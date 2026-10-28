const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const STATE_FILE = path.join(__dirname, '../../state.json');

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/state') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const state = JSON.parse(body);
                const timestamp = new Date().toISOString();
                const payload = { timestamp, ...state };

                fs.writeFile(STATE_FILE, JSON.stringify(payload, null, 2), (err) => {
                    if (err) {
                        console.error('Error writing state:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to write state' }));
                    } else {
                        console.log(`[${timestamp}] State updated:`, state.activeGem || 'Unknown');
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    }
                });
            } catch (e) {
                console.error('Invalid JSON:', e);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`Nervous System Bridge running on http://localhost:${PORT}`);
    console.log(`Writing state to: ${STATE_FILE}`);
});
