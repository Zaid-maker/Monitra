import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3003;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

// Email Transporter (Mock for now, or use Ethereal)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
        user: process.env.SMTP_USER || 'mock_user',
        pass: process.env.SMTP_PASS || 'mock_pass',
    },
});

// Worker to process notifications
new Worker('notification-tasks', async (job: Job) => {
    const { monitorName, status, email, url, message } = job.data;

    console.log(`Sending notification for ${monitorName}: ${status}`);

    const mailOptions = {
        from: '"Monitra Alerter" <no-reply@monitra.com>',
        to: email,
        subject: `🚨 Monitor ${status.toUpperCase()}: ${monitorName}`,
        text: `Your monitor "${monitorName}" (${url}) is now ${status.toUpperCase()}.\n\nMessage: ${message}`,
        html: `<p>Your monitor <strong>${monitorName}</strong> (${url}) is now <strong>${status.toUpperCase()}</strong>.</p><p>Message: ${message}</p>`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}, { connection });

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'notification' });
});

app.listen(PORT, () => {
    console.log(`Notification service running on port ${PORT}`);
});
