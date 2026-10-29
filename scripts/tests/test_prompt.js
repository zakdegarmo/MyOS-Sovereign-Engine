const http = require('http');

function post(url, payload) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const postData = JSON.stringify(payload);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function run() {
    console.log('Testing non-whitelisted launch (winver)... This should show a prompt on screen or timeout in 15s.');
    const startTime = Date.now();
    const postRes = await post('http://localhost:8081/api/win/launch', { target: 'winver' });
    const duration = (Date.now() - startTime) / 1000;
    console.log(`Response received after ${duration}s.`);
    console.log('Status code:', postRes.statusCode);
    console.log('Response body:', postRes.body);
}

run().catch(console.error);
