
import { PrismaClient } from './generated/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Disabling maintenance mode...');
        const update = await prisma.systemSetting.update({
            where: { key: 'maintenance_mode' },
            data: { value: 'false' }
        });
        console.log('Maintenance mode disabled:', update);
    } catch (e) {
        console.error('Error updating settings:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
