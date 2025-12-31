const fetch = require('node-fetch');

async function verify() {
    try {
        // 1. Login
        console.log('Logging in as Jane Doe...');
        const loginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'jane.doe@example.com', password: 'password123' })
        });

        if (!loginRes.ok) {
            console.error('Login Failed:', await loginRes.text());
            return;
        }

        const { token, user } = await loginRes.json();
        console.log(`Login Successful. User: ${user.fullName}`);
        console.log(`Credit Score from Login: ${user.creditScore}`);

        // 2. Fetch Dashboard/Profile explicitly if needed, but login usually returns user info.
        // Let's also check the products endpoint to see if minCreditScore is exposed.
        console.log('\nFetching Loan Products...');
        const productsRes = await fetch('http://127.0.0.1:3000/api/loans/products', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const products = await productsRes.json();
        console.log('Loan Products found:', products.length);
        products.forEach(p => {
            console.log(`- ${p.name}: Min Score ${p.minCreditScore}`);
        });

    } catch (err) {
        console.error('Verification Error:', err);
    }
}

verify();
