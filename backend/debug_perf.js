// Native fetch is available in Node > 18
// No imports needed

async function runTest() {
    const baseUrl = 'http://localhost:8080/api';

    console.log('--- Starting Performance Test (Native Fetch) ---');

    // 1. Login
    console.log('1. Attempting Login...');
    const startLogin = performance.now();
    try {
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'superadmin',
                password: 'admin123',
                role: 'super_admin'
            })
        });

        const loginData = await loginRes.json();
        const endLogin = performance.now();
        console.log(`   Login Status: ${loginRes.status}`);
        console.log(`   Login Time: ${(endLogin - startLogin).toFixed(2)}ms`);

        if ((!loginData.success && !loginData.token) || loginRes.status !== 200) {
            console.error('   Login Failed:', loginData);
            return;
        }

        const token = loginData.token;

        // 2. Fetch Users (Paginated)
        console.log('\n2. Fetching Users (Page 1, Limit 10)...');
        const startFetch = performance.now();
        const usersRes = await fetch(`${baseUrl}/users?page=1&limit=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const usersText = await usersRes.text();
        const endFetch = performance.now();

        console.log(`   Fetch Status: ${usersRes.status}`);
        console.log(`   Fetch Time: ${(endFetch - startFetch).toFixed(2)}ms`);
        console.log(`   Payload Size: ${(usersText.length / 1024).toFixed(2)} KB`);

        const usersData = JSON.parse(usersText);
        console.log(`   Items Returned: ${usersData.data?.length}`);
        console.log(`   Total Items: ${usersData.total}`);

    } catch (err) {
        console.error('Test Failed:', err);
    }
}

runTest();
