import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // 1. Create Super Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@loanapp.com' },
        update: {},
        create: {
            email: 'admin@loanapp.com',
            password: hashedPassword,
            fullName: 'Super Admin',
            role: 'SUPER_ADMIN',
            status: 'VERIFIED',
            wallet: { create: { balance: 0.0 } }
        },
    });
    console.log({ admin });

    // 2. Create Default Loan Products
    const personalLoan = await prisma.loanProduct.create({
        data: {
            name: 'Personal Loan',
            minAmount: 1000,
            maxAmount: 50000,
            interestRate: 10,
            durationDays: 30,
            processingFee: 5,
            isFeeFixed: false,
            penaltyRate: 1
        }
    });
    console.log({ personalLoan });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
