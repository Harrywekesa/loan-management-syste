const fetch = require('node-fetch');

async function verifyProfileUpdate() {
    try {
        console.log('Logging in as Jane Doe...');
        const loginRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'jane.doe@example.com', password: 'password123' })
        });
        const { token, user } = await loginRes.json();
        console.log(`Current Name: ${user.fullName}`);

        const newName = `Jane Doe ${Math.floor(Math.random() * 100)}`;
        console.log(`Updating Name to: ${newName}`);

        const updateRes = await fetch('http://127.0.0.1:3000/api/auth/me', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ fullName: newName })
        });

        if (updateRes.ok) {
            const updatedUser = (await updateRes.json()).user;
            console.log(`Update Success. New Name: ${updatedUser.fullName}`);
        } else {
            console.error('Update Failed', await updateRes.text());
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

verifyProfileUpdate();
