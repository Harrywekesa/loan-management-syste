const fetch = require('node-fetch');

async function verify() {
    try {
        console.log('Logging in as Admin...');
        const loginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@loanapp.com', password: 'admin123' })
        });

        if (!loginRes.ok) {
            console.error('Login Failed', await loginRes.text());
            return;
        }

        const { token } = await loginRes.json();
        console.log('Login Successful.');

        // 1. Update Settings
        console.log('Updating Site Name...');
        const settingsRes = await fetch('http://127.0.0.1:3000/api/admin/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                site_name: 'Verified Loan App',
                maintenance_mode: 'false'
            })
        });

        console.log('Update Settings Status:', settingsRes.status);

        // 2. Fetch Audit Logs
        console.log('Fetching Audit Logs...');
        const logsRes = await fetch('http://127.0.0.1:3000/api/admin/audit-logs', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (logsRes.ok) {
            const logs = await logsRes.json();
            console.log('Logs found:', logs.length);
            if (logs.length > 0) {
                console.log('Latest Log:', logs[0].action, logs[0].details);
            }
        } else {
            console.error('Failed to fetch logs', await logsRes.text());
        }

    } catch (err) {
        console.error('Verification Error:', err);
    }
}

verify();
