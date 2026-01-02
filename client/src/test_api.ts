
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function testApi() {
    try {
        // 1. Login as Admin (since we know credentials)
        console.log('Attempting login as admin@loanapp.com...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@loanapp.com',
            password: 'admin123'
        });

        console.log('Login successful!');
        const token = loginRes.data.token;
        console.log('Token received.');

        // 2. Get My Loans
        console.log('Fetching loans for admin...');
        const loansRes = await axios.get(`${BASE_URL}/loans/my`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Loans fetch successful:', loansRes.status);
        console.log('Loans data:', JSON.stringify(loansRes.data, null, 2));

    } catch (error: any) {
        console.error('API Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testApi();
