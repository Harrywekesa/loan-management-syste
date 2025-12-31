const fetch = require('node-fetch');

async function verifyReportingAndLimits() {
    try {
        console.log('--- TEST 1: Single Loan Policy ---');
        console.log('Logging in as Jane Doe...');
        const loginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'jane.doe@example.com', password: 'password123' })
        });
        const { token } = await loginRes.json();

        // 1. Check current loans
        const loansRes = await fetch('http://127.0.0.1:3000/api/loans/my-loans', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const loans = await loansRes.json();
        const hasActive = loans.some(l => ['ACTIVE', 'APPROVED', 'DISBURSED', 'PENDING'].includes(l.status));
        console.log(`User has active/pending loans: ${hasActive}`);

        if (hasActive) {
            // 2. Try to apply for another
            console.log('Attempting to apply for 2nd loan...');
            const product = (await (await fetch('http://127.0.0.1:3000/api/loans/products', { headers: { 'Authorization': `Bearer ${token}` } })).json())[0];

            const applyRes = await fetch('http://127.0.0.1:3000/api/loans/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId: product.id, amount: 1000 })
            });

            if (applyRes.status === 400) {
                console.log('SUCCESS: Application blocked as expected.');
                console.log('Msg:', (await applyRes.json()).message);
            } else {
                console.error('FAILURE: Application allowed or other error:', applyRes.status);
            }
        }

        console.log('\n--- TEST 2: Admin Reports ---');
        console.log('Logging in as Admin...');
        const adminLogin = await fetch('http://127.0.0.1:3000/api/auth/login', {
            method: 'POST',
            header: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@loanapp.com', password: 'admin123' })
        });
        const adminToken = (await adminLogin.json()).token;

        const reportRes = await fetch('http://127.0.0.1:3000/api/admin/reports/summary', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (reportRes.ok) {
            const report = await reportRes.json();
            console.log('Report Summary:', JSON.stringify(report, null, 2));
        } else {
            console.error('Failed to fetch report');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

verifyReportingAndLimits();
