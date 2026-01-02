
import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        const userCount = await prisma.user.count();
        console.log(`User count: ${userCount}`);

        if (userCount > 0) {
            const users = await prisma.user.findMany({ include: { loans: true, wallet: true } });
            console.log('All Users:', JSON.stringify(users, null, 2));
            const settings = await prisma.systemSetting.findMany();
            console.log('System Settings:', JSON.stringify(settings, null, 2));
        } else {
            console.log('No users found in the database.');
        }
    } catch (e) {
        console.error('Error connecting to database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
