import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcrypt';
import { signToken } from '../utils/jwt';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string(),
    phoneNumber: z.string().optional(),
    idNumber: z.string().optional(),
    termsAccepted: z.literal(true, { errorMap: () => ({ message: "Terms must be accepted" }) }),
    termsVersion: z.string()
});

export const register = async (req: Request, res: Response) => {
    try {
        const data = registerSchema.parse(req.body);

        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) return res.status(400).json({ message: 'Email already in use' });

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const verificationToken = Math.random().toString(36).substring(2, 15);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                fullName: data.fullName,
                phoneNumber: data.phoneNumber,
                idNumber: data.idNumber,
                termsAccepted: data.termsAccepted,
                termsVersion: data.termsVersion,
                termsAcceptedAt: new Date(),
                verificationToken,
                verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                wallet: {
                    create: { balance: 0.0 }
                }
            }
        });

        // Simulate Email Sending
        console.log(`[EMAIL STUB] Verification Link for ${user.email}: http://localhost:5173/verify-email?token=${verificationToken}`);

        const token = signToken({ id: user.id, role: user.role });
        res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Registration failed' });
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    const { token } = req.body;
    try {
        const user = await prisma.user.findFirst({ where: { verificationToken: token } });
        if (!user) return res.status(400).json({ message: 'Invalid token' });

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verificationToken: null,
                verificationTokenExpiry: null,
                status: user.status === 'EMAIL_PENDING' ? 'DOCS_PENDING' : user.status
            }
        });
        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Verification failed' });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(400).json({ message: 'Invalid credentials' });

        if (user.status === 'SUSPENDED' || user.status === 'BLACKLISTED') {
            return res.status(403).json({ message: 'Account is suspended or blacklisted. Contact support.' });
        }

        const token = signToken({ id: user.id, role: user.role });
        res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
};

export const getProfile = async (req: any, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { wallet: true, documents: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
};
