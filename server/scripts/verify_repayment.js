const fetch = require('node-fetch');

async function verifyRepayment() {
    try {
        console.log('Logging in as Jane Doe...');
        const loginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'jane.doe@example.com', password: 'password123' })
        });
        const { token, user } = await loginRes.json();
        console.log(`Login Success: ${user.fullName}`);

        // 1. Get Loans
        console.log('Fetching Loans...');
        const loansRes = await fetch('http://127.0.0.1:3000/api/loans/my-loans', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const loans = await loansRes.json();
        const activeLoan = loans.find(l => l.status === 'ACTIVE' || l.status === 'APPROVED' || l.status === 'DISBURSED');

        if (!activeLoan) {
            console.log('No active loan found to repay. Please verify manually.');
            return;
        }

        console.log(`Found Active Loan ${activeLoan.id}. Balance: ${activeLoan.balance}`);

        // 2. Repay Partial (100)
        console.log('Attempting Partial Repayment of 100...');
        const repayRes = await fetch(`http://127.0.0.1:3000/api/loans/${activeLoan.id}/repay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount: 100 })
        });

        if (repayRes.ok) {
            console.log('Partial Repayment Successful.');
            // Verify Balance
            const verifyRes = await fetch('http://127.0.0.1:3000/api/loans/my-loans', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const updatedLoans = await verifyRes.json();
            const updatedLoan = updatedLoans.find(l => l.id === activeLoan.id);
            console.log(`New Balance: ${updatedLoan.balance}`);
        } else {
            console.error('Repayment Failed:', await repayRes.text());
        }

    } catch (err) {
        console.error('Verification Error:', err);
    }
}

verifyRepayment();
