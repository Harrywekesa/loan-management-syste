import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const uploadDocument = async (req: any, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const { title } = req.body;
        const userId = req.user.id;

        const document = await prisma.document.create({
            data: {
                userId,
                title: title,
                url: `/${req.file.path.replace(/\\/g, '/')}`,
                status: 'PENDING'
            }
        });

        // Update User Status to DOCS_PENDING if not verified
        await prisma.user.update({
            where: { id: userId },
            data: { status: 'DOCS_PENDING' }
        });

        res.status(201).json(document);
    } catch (error) {
        res.status(500).json({ message: 'Upload failed' });
    }
};

export const getPendingDocuments = async (req: Request, res: Response) => {
    try {
        const documents = await prisma.document.findMany({
            where: { status: 'PENDING' },
            include: { user: { select: { email: true, fullName: true, idNumber: true } } }
        });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents' });
    }
};

export const reviewDocument = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body; // APPROVED, REJECTED

    try {
        const doc = await prisma.document.update({
            where: { id },
            data: { status }
        });

        // Check if all docs are approved for this user
        const userDocs = await prisma.document.count({
            where: { userId: doc.userId, status: { not: 'APPROVED' } }
        });

        if (userDocs === 0) {
            await prisma.user.update({
                where: { id: doc.userId },
                data: { status: 'VERIFIED' }
            });
        }

        res.json(doc);
    } catch (error) {
        res.status(500).json({ message: 'Error updating document' });
    }
};
