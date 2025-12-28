import { Request, Response } from 'express';
import AttendanceSession from '../models/AttendanceSession';
import AttendanceRecord from '../models/AttendanceRecord';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import FaceData from '../models/FaceData';
import axios from 'axios';
import FormData from 'form-data';

interface AuthRequest extends Request {
    user?: any;
    io?: any;
}

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// @desc    Start Attendance Session
export const startSession = async (req: AuthRequest, res: Response): Promise<void> => {
    const { courseId, attendanceMethod, latitude, longitude } = req.body;
    const facultyId = req.user._id;

    try {
        const session = await AttendanceSession.create({
            facultyId,
            courseId,
            attendanceMethod,
            facultyLocation: { lat: latitude, lng: longitude },
            startTime: new Date(),
            status: 'ACTIVE'
        });

        // Notify students via Socket.io
        req.io.emit('attendance_started', {
            courseId,
            sessionId: session._id,
            method: attendanceMethod
        });

        res.status(201).json(session);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Stop Attendance Session
export const stopSession = async (req: AuthRequest, res: Response): Promise<void> => {
    const { sessionId } = req.body;

    try {
        const session = await AttendanceSession.findById(sessionId);
        if (!session) {
            res.status(404).json({ message: 'Session not found' });
            return;
        }

        session.status = 'CLOSED';
        session.endTime = new Date();
        await session.save();

        req.io.emit('attendance_stopped', { sessionId });

        res.json({ message: 'Session stopped', session });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark Attendance
export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    const { sessionId, deviceFingerprint, gpsLocation, faceImage } = req.body;
    const studentId = req.user._id;

    try {
        const session = await AttendanceSession.findById(sessionId);
        if (!session || session.status !== 'ACTIVE') {
            res.status(400).json({ message: 'Attendance session is not active' });
            return;
        }

        // Check if student is enrolled in this course
        const enrollment = await Enrollment.findOne({ courseId: session.courseId, studentId });
        if (!enrollment) {
            res.status(403).json({ message: 'You are not enrolled in this course' });
            return;
        }

        // Check if student has already marked
        const existingRecord = await AttendanceRecord.findOne({ sessionId, studentId });
        if (existingRecord) {
            res.status(400).json({ message: 'Attendance already marked' });
            return;
        }

        // ANTI-FRAUD: Check if device fingerprint was already used for this session
        const deviceUsed = await AttendanceRecord.findOne({ sessionId, deviceFingerprint });
        if (deviceUsed) {
            res.status(403).json({ message: 'Another student has already used this device to mark attendance.' });
            return;
        }


        // Distance Check
        const facultyLoc = session.facultyLocation;
        let distance = 0;

        if (facultyLoc && gpsLocation) {
            distance = Math.sqrt(
                Math.pow((gpsLocation.lat - facultyLoc.lat), 2) +
                Math.pow((gpsLocation.lng - facultyLoc.lng), 2)
            ) * 111139; // Roughly meters
        }

        if (distance > 50 && facultyLoc) {
            // res.status(403).json({ message: 'You are too far from the classroom' });
            // return;
        }

        // Face Verification if method is FACE
        if (session.attendanceMethod === 'FACE') {
            const faceData = await FaceData.findOne({ studentId });
            if (!faceData) {
                res.status(400).json({ message: 'Please register your face ID first' });
                return;
            }

            // Call Python ML Service
            try {
                const base64Data = faceImage.replace(/^data:image\/\w+;base64,/, "");
                const imageBuffer = Buffer.from(base64Data, 'base64');

                const form = new FormData();
                form.append('file', imageBuffer, { filename: 'capture.jpg', contentType: 'image/jpeg' });
                form.append('registered_embedding', JSON.stringify(faceData.embeddings));

                const mlResponse = await axios.post(`${ML_SERVICE_URL}/verify`, form, {
                    headers: { ...form.getHeaders() }
                });

                const responseData = mlResponse.data as any;

                if (!responseData.verified) {
                    res.status(403).json({
                        message: `Face verification failed: ${responseData.reason || 'Not a match'}`,
                        details: responseData
                    });
                    return;
                }
            } catch (mlError: any) {
                console.error("ML Service Error:", mlError.message);
                res.status(500).json({ message: 'Face verification service unavailable' });
                return;
            }
        }

        // ANTI-FRAUD: Check if IP was already used (Prevents multiple accounts from same device/network)
        const ipUsed = await AttendanceRecord.findOne({ sessionId, ipAddress: req.ip });
        if (ipUsed && ipUsed.studentId.toString() !== studentId.toString()) {
            res.status(403).json({ message: 'Only one attendance submission allowed per device/network connection.' });
            return;
        }

        const record = await AttendanceRecord.create({
            studentId,
            sessionId,
            courseId: session.courseId,
            status: 'PRESENT',
            deviceFingerprint,
            ipAddress: req.ip,
            gpsLocation,
            distanceFromFaculty: distance,
            attendanceMethod: session.attendanceMethod
        });

        res.status(201).json({ message: 'Attendance marked successfully', record });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Process Group Photo Attendance (Faculty)
export const bulkRecognize = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId, image } = req.body;
        const facultyId = req.user._id;

        const course = await Course.findOne({ _id: courseId, facultyId });
        if (!course) {
            res.status(403).json({ message: 'Not authorized for this course' });
            return;
        }

        const enrollments = await Enrollment.find({ courseId }).populate('studentId');
        const studentsWithEmbeddings = [];

        for (const enrollment of enrollments) {
            const studentId = (enrollment.studentId as any)._id;
            const faceData = await FaceData.findOne({ studentId });
            if (faceData) {
                studentsWithEmbeddings.push({
                    id: studentId,
                    embedding: faceData.embeddings
                });
            }
        }

        if (studentsWithEmbeddings.length === 0) {
            res.status(400).json({ message: 'No registered faces found for students in this course.' });
            return;
        }

        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');

        const form = new FormData();
        form.append('file', imageBuffer, { filename: 'group.jpg', contentType: 'image/jpeg' });
        form.append('students_data', JSON.stringify(studentsWithEmbeddings));

        const mlResponse = await axios.post(`${ML_SERVICE_URL}/recognize_batch`, form, {
            headers: { ...form.getHeaders() }
        });

        const { present_students, total_detected } = mlResponse.data as any;

        const session = await AttendanceSession.create({
            facultyId,
            courseId,
            startTime: new Date(),
            endTime: new Date(),
            attendanceMethod: 'FACE',
            status: 'CLOSED'
        });

        const records = [];
        for (const ps of present_students) {
            records.push({
                studentId: ps.student_id,
                sessionId: session._id,
                courseId,
                status: 'PRESENT',
                attendanceMethod: 'FACE',
                fraudFlags: { note: `Bulk recognized with similarity ${ps.similarity.toFixed(2)}` }
            });
        }

        if (records.length > 0) {
            await AttendanceRecord.insertMany(records);
        }

        res.json({
            message: `Bulk attendance completed.`,
            detectedFaces: total_detected,
            markedPresent: records.length,
            session
        });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Manual Override (Toggle Attendance)
export const toggleAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { sessionId, studentId, status } = req.body;
        const facultyId = req.user._id;

        const session = await AttendanceSession.findOne({ _id: sessionId, facultyId });
        if (!session) {
            res.status(403).json({ message: 'Not authorized for this session' });
            return;
        }

        let record = await AttendanceRecord.findOne({ sessionId, studentId });

        if (record) {
            record.status = status;
            record.fraudFlags = { note: `Manual override by faculty at ${new Date().toLocaleString()}` };
            await record.save();
        } else {
            record = await AttendanceRecord.create({
                studentId,
                sessionId,
                courseId: session.courseId,
                status,
                attendanceMethod: 'MANUAL',
                fraudFlags: { note: 'Manually created by faculty' }
            });
        }

        res.json({ message: `Attendance set to ${status}`, record });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Active Session for a Course
// @route   GET /api/attendance/active/:courseId
export const getActiveSession = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        const session = await AttendanceSession.findOne({ courseId: courseId as any, status: 'ACTIVE' });

        if (!session) {
            res.json({ active: false });
            return;
        }

        res.json({
            active: true,
            sessionId: session._id,
            method: session.attendanceMethod
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
