import app from './app';
import dotenv from 'dotenv';
import { startCronJobs } from './services/cron.service';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Start Cron Jobs
startCronJobs();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
