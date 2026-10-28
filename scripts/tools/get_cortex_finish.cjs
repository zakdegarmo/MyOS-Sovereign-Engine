const http = require('http');

const payload = {
  model: 'myos-cortex:latest',
  prompt: `Cortex, continue your synthesis from:
"In the first 60 seconds, you need to experience Immediate, Directed Utility. You do not need to see the full spectrum of the 10 Pillars. You need a single, highly visible, low-friction path that allows you to take a complex idea..."

Complete Section 2 ("The Zak Persona Reality Check") and deliver Section 3 ("Actionable Usability Roadmap: Top 3 Tactical Fixes to marry the breathtaking FORM with razor-sharp FUNCTION"). Focus on making MyOS the ultimate, focused daily-driver OS.`,
  stream: false,
  options: {
    temperature: 0.3,
    num_predict: 1000
  }
};

const postData = JSON.stringify(payload);
const req = http.request({
  hostname: 'localhost',
  port: 11434,
  path: '/api/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  },
  timeout: 60000
}, (res) => {
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      console.log(json.response);
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err);
});

req.write(postData);
req.end();
