import { Request, Response } from 'express';
import User from '../models/User';
import generateToken from '../utils/generateToken';
import jwt from 'jsonwebtoken';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body; // username can be email or enrollmentNumber

    try {
        const user = await User.findOne({
            $or: [{ email: username }, { enrollmentNumber: username }],
        });

        if (user && (await user.matchPassword(password))) {
            const { token } = generateToken(res, user._id, user.role);

            res.json({
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    enrollmentNumber: user.enrollmentNumber,
                    role: user.role,
                    profileImageUrl: user.profileImageUrl
                },
                token
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change user password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (req: any, res: Response): Promise<void> => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const isMatch = await user.matchPassword(oldPassword);
        if (!isMatch) {
            res.status(400).json({ message: 'Incorrect old password' });
            return;
        }

        user.passwordHash = newPassword; // Pre-save hook will hash it
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Refresh Access Token
// @route   GET /api/auth/refresh
// @access  Public (uses cookie)
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.jwt;

    if (!refreshToken) {
        res.status(401).json({ message: 'Refresh token missing' });
        return;
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refreshSecret') as any;

        // Check if user still exists
        const user = await User.findById(decoded.userId);
        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '15m',
        });

        res.json({ token });
    } catch (error) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req: Request, res: Response) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV !== 'development',
    });
    res.status(200).json({ message: 'Logged out successfully' });
};
