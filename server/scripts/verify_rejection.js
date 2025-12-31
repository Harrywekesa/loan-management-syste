const fetch = require('node-fetch');

async function verifyRejection() {
    try {
        // 1. Login as Admin
        console.log('Logging in as Admin...');
        const adminLogin = await fetch('http://127.0.0.1:3000/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@loanapp.com', password: 'admin123' }),
            headers: { 'Content-Type': 'application/json' }
        });
        const { token } = await adminLogin.json();

        // 2. Find a Pending Loan
        const loansRes = await fetch('http://127.0.0.1:3000/api/admin/loans', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const loans = await loansRes.json();
        const pendingLoan = loans.find(l => l.status === 'PENDING');

        if (!pendingLoan) {
            console.log('No pending loans found to reject. Please create one first.');
            return;
        }

        console.log(`Rejecting Loan ${pendingLoan.id}...`);

        // 3. Reject with Reason
        const reason = "Credit Score too low - Automated Test";
        const rejectRes = await fetch(`http://127.0.0.1:3000/api/admin/loans/${pendingLoan.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'REJECTED', reason })
        });

        if (rejectRes.ok) {
            console.log('Rejection Successful.');
            // 4. Verify Reason Persisted
            const verifyRes = await fetch('http://127.0.0.1:3000/api/admin/loans', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const updatedLoans = await verifyRes.json();
            const rejectedLoan = updatedLoans.find(l => l.id === pendingLoan.id);

            console.log(`Status: ${rejectedLoan.status}`);
            console.log(`Reason: ${rejectedLoan.rejectionReason}`);

            if (rejectedLoan.rejectionReason === reason) {
                console.log('PASS: Rejection reason matches.');
            } else {
                console.error('FAIL: Reason mismatch.');
            }
        } else {
            console.error('Rejection Failed', await rejectRes.text());
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

verifyRejection();
