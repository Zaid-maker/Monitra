import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase, Monitor, Heartbeat } from '@monitra/database';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import axios from 'axios';
import { z } from 'zod';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/monitra';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

// Queues
const monitorQueue = new Queue('monitor-tasks', { connection });
const notificationQueue = new Queue('notification-tasks', { connection });

// Validation Schemas
const createMonitorSchema = z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.enum(['http', 'port', 'ping']).default('http'),
    interval: z.number().min(30).default(60),
    userId: z.string(),
});

// Routes
app.post('/monitors', async (req, res) => {
    try {
        const data = createMonitorSchema.parse(req.body);
        const monitor = await Monitor.create(data);

        // Schedule the task
        await monitorQueue.add(
            `monitor-${monitor._id}`,
            { monitorId: monitor._id },
            {
                repeat: { every: monitor.interval * 1000 },
                jobId: monitor._id.toString()
            }
        );

        res.status(201).json(monitor);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/monitors/user/:userId', async (req, res) => {
    try {
        const monitors = await Monitor.find({ userId: req.params.userId });
        res.json(monitors);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/monitors/stats/:monitorId', async (req, res) => {
    try {
        const heartbeats = await Heartbeat.find({ monitorId: req.params.monitorId })
            .sort({ timestamp: -1 })
            .limit(50);
        res.json(heartbeats);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Worker to process monitoring
const worker = new Worker('monitor-tasks', async (job: Job) => {
    const { monitorId } = job.data;
    const monitor = await Monitor.findById(monitorId).populate('userId');
    if (!monitor || !monitor.isActive) return;

    const user = monitor.userId as any;
    const previousStatus = monitor.status;

    const start = Date.now();
    try {
        const response = await axios.get(monitor.url, { timeout: 10000 });
        const latency = Date.now() - start;

        await Heartbeat.create({
            monitorId,
            status: 'up',
            latency,
            message: `OK: ${response.status}`,
        });

        const newStatus = 'up';
        await Monitor.findByIdAndUpdate(monitorId, { status: newStatus, lastChecked: new Date() });

        if (previousStatus === 'down') {
            await notificationQueue.add(`notify-up-${monitorId}`, {
                monitorName: monitor.name,
                status: 'up',
                email: user.email,
                url: monitor.url,
                message: 'Monitor is back online.'
            });
        }

        console.log(`Monitor ${monitor.name} is UP (${latency}ms)`);
    } catch (error: any) {
        const latency = Date.now() - start;
        const message = error.message || 'Error occurred';

        await Heartbeat.create({
            monitorId,
            status: 'down',
            latency,
            message,
        });

        const newStatus = 'down';
        await Monitor.findByIdAndUpdate(monitorId, { status: newStatus, lastChecked: new Date() });

        if (previousStatus !== 'down') {
            await notificationQueue.add(`notify-down-${monitorId}`, {
                monitorName: monitor.name,
                status: 'down',
                email: user.email,
                url: monitor.url,
                message
            });
        }

        console.log(`Monitor ${monitor.name} is DOWN: ${message}`);
    }
}, { connection });

async function start() {
    await connectDatabase(MONGODB_URI);
    app.listen(PORT, () => {
        console.log(`Monitor service running on port ${PORT}`);
    });
}

start();
