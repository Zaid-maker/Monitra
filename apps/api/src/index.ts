import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Server } from 'socket.io';
import { createServer } from 'http';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const MONITOR_SERVICE_URL = process.env.MONITOR_SERVICE_URL || 'http://localhost:3002';

// Routes for Gateway itself
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'gateway' });
});

// Proxy to Auth Service
app.use('/auth', createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/auth': '/auth',
    },
}));

// Proxy to Monitor Service
app.use('/monitors', createProxyMiddleware({
    target: MONITOR_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/monitors': '/monitors',
    },
}));

// Socket.io for real-time updates
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('subscribe', (monitorId) => {
        socket.join(`monitor-${monitorId}`);
        console.log(`Socket ${socket.id} subscribed to monitor-${monitorId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// In a real scenario, we would use Redis Adapter for Socket.io to sync across instances
// and have the monitor service emit events to Redis/Gateway.

httpServer.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
