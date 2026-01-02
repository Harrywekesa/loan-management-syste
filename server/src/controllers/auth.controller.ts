import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { signToken } from '../utils/jwt';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

// Helper to get file path
const getFilePath = (files: any, fieldName: string) => {
    if (files && files[fieldName] && files[fieldName][0]) {
        return `/uploads/documents/${files[fieldName][0].filename}`;
    }
    return null;
};

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
        // 1. Validate JSON Data (Zod handles multipart form data parsing if it's just fields, but keys might need processing)
        // Since we are using FormData, everything comes as strings. We might need to preprocess numbers/booleans if Zod expects them.
        // transforming termsAccepted to boolean
        const rawBody = { ...req.body };
        if (typeof rawBody.termsAccepted === 'string') rawBody.termsAccepted = rawBody.termsAccepted === 'true';

        const data = registerSchema.parse(rawBody);

        // 2. Validate Files
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (!files || !files['idFront'] || !files['idBack']) {
            return res.status(400).json({ message: 'Both ID Front and Back images are required.' });
        }

        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) return res.status(400).json({ message: 'Email already in use' });

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // 3. Create User & Documents interactively
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
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

            // Create Documents
            await tx.document.create({
                data: {
                    userId: newUser.id,
                    title: 'National ID (Front)',
                    url: getFilePath(files, 'idFront')!,
                    status: 'PENDING'
                }
            });

            await tx.document.create({
                data: {
                    userId: newUser.id,
                    title: 'National ID (Back)',
                    url: getFilePath(files, 'idBack')!,
                    status: 'PENDING'
                }
            });

            return newUser;
        });

        // Simulate Email Sending
        console.log(`[EMAIL STUB] Verification Link for ${user.email}: http://localhost:5173/verify-email?token=${verificationToken}`);

        const token = signToken({ id: user.id, role: user.role });
        res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', details: error.errors });
        }
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
        const userWithDocs = await prisma.user.findUnique({
            where: { email },
            include: { documents: true }
        });

        if (!userWithDocs) return res.status(400).json({ message: 'Invalid credentials' });

        const isValid = await bcrypt.compare(password, userWithDocs.password);
        if (!isValid) return res.status(400).json({ message: 'Invalid credentials' });

        if (userWithDocs.status === 'SUSPENDED' || userWithDocs.status === 'BLACKLISTED') {
            return res.status(403).json({ message: 'Account is suspended or blacklisted. Contact support.' });
        }

        const token = signToken({ id: userWithDocs.id, role: userWithDocs.role });
        const { password: _, ...user } = userWithDocs;
        res.json({ token, user });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { wallet: true, documents: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

// Update Profile (including Profile Picture)
export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
        const userId = req.user.id;
        const { fullName, phoneNumber } = req.body;

        const updateData: any = {};
        if (fullName) updateData.fullName = fullName;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;

        if (req.file) {
            updateData.profilePicture = `/uploads/documents/${req.file.filename}`;
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: { wallet: true, documents: true }
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
};
