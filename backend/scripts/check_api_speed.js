const http = require('http');

const request = (path, method = 'GET', headers = {}, body = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8080,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const start = Date.now();
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const duration = Date.now() - start;
                resolve({
                    status: res.statusCode,
                    body: data ? JSON.parse(data) : {},
                    duration
                });
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

(async () => {
    try {
        console.log('1. Logging in...');
        const loginRes = await request('/auth/login', 'POST', {}, {
            username: 'john',
            password: 'john123',
            role: 'admin_org'
        });

        if (loginRes.status !== 200) {
            console.error('Login failed:', loginRes.body);
            process.exit(1);
        }

        const token = loginRes.body.token;
        console.log(`Logged in. Token length: ${token.length}`);

        console.log('2. Fetching Users...');
        // Match what frontend sends: page=1, limit=10, sort=-createdAt
        const params = new URLSearchParams({
            page: '1',
            limit: '10',
            sort: '-createdAt'
        }).toString();

        const usersRes = await request(`/users?${params}`, 'GET', {
            'Authorization': `Bearer ${token}`
        });

        console.log(`API Status: ${usersRes.status}`);
        console.log(`API Duration: ${usersRes.duration}ms`);
        console.log(`Users count: ${usersRes.body.data ? usersRes.body.data.length : 'N/A'}`);
        console.log(`Total users: ${usersRes.body.total}`);

    } catch (err) {
        console.error('Error:', err);
    }
})();
