import mongoose, { Schema, Document, Model } from 'mongoose';

// User Schema
export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'user' | 'admin';
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

// Monitor Schema
export interface IMonitor extends Document {
    name: string;
    url: string;
    type: 'http' | 'port' | 'ping';
    interval: number; // in seconds
    status: 'up' | 'down' | 'pending' | 'paused';
    userId: mongoose.Types.ObjectId;
    lastChecked?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MonitorSchema = new Schema<IMonitor>({
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['http', 'port', 'ping'], default: 'http' },
    interval: { type: Number, default: 60 },
    status: { type: String, enum: ['up', 'down', 'pending', 'paused'], default: 'pending' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastChecked: { type: Date },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Heartbeat Schema
export interface IHeartbeat extends Document {
    monitorId: mongoose.Types.ObjectId;
    status: 'up' | 'down';
    latency: number; // ms
    message?: string;
    timestamp: Date;
}

const HeartbeatSchema = new Schema<IHeartbeat>({
    monitorId: { type: Schema.Types.ObjectId, ref: 'Monitor', required: true },
    status: { type: String, enum: ['up', 'down'], required: true },
    latency: { type: Number, required: true },
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>('User', UserSchema);
export const Monitor = mongoose.model<IMonitor>('Monitor', MonitorSchema);
export const Heartbeat = mongoose.model<IHeartbeat>('Heartbeat', HeartbeatSchema);

export async function connectDatabase(uri: string) {
    if (mongoose.connection.readyState >= 1) return;

    try {
        await mongoose.connect(uri);
        console.log('Successfully connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

export { mongoose };
