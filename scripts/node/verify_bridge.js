const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        }).on('error', reject);
    });
}

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
    console.log('Testing GET /api/desktop/files...');
    const getRes = await get('http://localhost:8081/api/desktop/files');
    console.log('GET status:', getRes.statusCode);
    if (getRes.statusCode !== 200) {
        throw new Error('Expected status code 200, got ' + getRes.statusCode);
    }
    const files = JSON.parse(getRes.body);
    if (!Array.isArray(files)) {
        throw new Error('Expected response to be an array');
    }
    console.log(`GET /api/desktop/files returns array of ${files.length} items.`);
    if (files.length > 0) {
        console.log('Sample item:', files[0]);
        // verify keys
        const keys = Object.keys(files[0]);
        const expected = ['name', 'path', 'isShortcut', 'target'];
        for (const key of expected) {
            if (!keys.includes(key)) {
                throw new Error(`Expected item to contain key "${key}"`);
            }
        }
    }

    console.log('\nTesting POST /api/win/launch with target: "notepad"...');
    const postRes = await post('http://localhost:8081/api/win/launch', { target: 'notepad' });
    console.log('POST status:', postRes.statusCode);
    if (postRes.statusCode !== 200) {
        throw new Error('Expected status code 200, got ' + postRes.statusCode);
    }
    const launchResult = JSON.parse(postRes.body);
    if (launchResult.success !== true) {
        throw new Error('Expected success: true, got: ' + JSON.stringify(launchResult));
    }
    console.log('POST /api/win/launch response:', launchResult);
    console.log('\nAll tests passed successfully!');
}

run().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
