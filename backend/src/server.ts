import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import courseRoutes from './routes/courseRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import faceRoutes from './routes/faceRoutes';
import reportRoutes from './routes/reportRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));

// Make io accessible in routes
app.use((req: any, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req: express.Request, res: express.Response) => {
    res.send('API is running...');
});

// Socket.IO Logic
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join_session', (sessionId: string) => {
        socket.join(sessionId);
        console.log(`Socket ${socket.id} joined session ${sessionId}`);
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
