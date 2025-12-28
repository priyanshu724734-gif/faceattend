import { Request, Response } from 'express';
import FaceData from '../models/FaceData';
import axios from 'axios';
import FormData from 'form-data';

interface AuthRequest extends Request {
    user?: any;
}

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// @desc    Register Face
// @route   POST /api/face/register
// @access  Private (Student)
export const registerFace = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { image } = req.body;
        const studentId = req.user._id;

        if (!image) {
            res.status(400).json({ message: 'Image data required' });
            return;
        }

        // Call ML Service to get embedding
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');

        const form = new FormData();
        form.append('file', imageBuffer, { filename: 'register.jpg', contentType: 'image/jpeg' });

        try {
            const mlResponse = await axios.post(`${ML_SERVICE_URL}/register`, form, {
                headers: { ...form.getHeaders() }
            });

            const { embedding } = mlResponse.data as any;

            // Save to DB
            let faceData = await FaceData.findOne({ studentId });
            if (faceData) {
                faceData.embeddings = embedding;
                faceData.registeredAt = new Date();
                await faceData.save();
            } else {
                faceData = await FaceData.create({
                    studentId,
                    embeddings: embedding
                });
            }

            res.json({ message: 'Face registered successfully', faceData });
        } catch (mlError: any) {
            console.error("ML Service Error:", mlError.response?.data || mlError.message);
            res.status(400).json({ message: mlError.response?.data?.detail || 'Face registration failed' });
        }

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Face Status
// @route   GET /api/face/status
export const getFaceStatus = async (req: AuthRequest, res: Response) => {
    try {
        const faceData = await FaceData.exists({ studentId: req.user._id });
        res.json({ registered: !!faceData });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
