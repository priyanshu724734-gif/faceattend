import jwt from 'jsonwebtoken';
import { Response } from 'express';

const generateToken = (res: Response, userId: any, role: string) => {
    const token = jwt.sign({ userId, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ userId, role }, process.env.JWT_REFRESH_SECRET || 'refreshSecret', {
        expiresIn: '7d',
    });

    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
        sameSite: 'strict', // Prevent CSRF attacks
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { token };
};

export default generateToken;
