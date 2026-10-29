with open('apps/web/agent-bridge.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add GET endpoint
get_target = "if (parsedUrl.pathname === '/api/logs/stream') {"
get_addition = """if (parsedUrl.pathname === '/api/gemini-dom/poll') {
            const nextItem = geminiDomQueue.shift();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(nextItem || null));
        }

        if (parsedUrl.pathname === '/api/logs/stream') {"""

if get_target in content:
    content = content.replace(get_target, get_addition, 1)
    print('GET SUCCESS')
else:
    print('GET NOT FOUND')

# Add POST endpoints
post_target = "if (pathname === '/api/win/launch') {"
post_addition = """if (pathname === '/api/gemini-dom/fulfill') {
                    const { id, response, error } = data;
                    if (id && geminiDomResolvers.has(id)) {
                        const resolver = geminiDomResolvers.get(id);
                        geminiDomResolvers.delete(id);
                        resolver({ response, error });
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ status: 'ok' }));
                }

                if (pathname === '/api/gemini-dom/ask') {
                    const { prompt, timeoutMs = 60000 } = data;
                    if (!prompt) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: 'Prompt is required' }));
                    }
                    const reqId = 'dom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
                    geminiDomQueue.push({ id: reqId, prompt });
                    
                    const responsePromise = new Promise((resolve) => {
                        const timer = setTimeout(() => {
                            geminiDomResolvers.delete(reqId);
                            geminiDomQueue = geminiDomQueue.filter(item => item.id !== reqId);
                            resolve({ error: 'Timeout waiting for Gemini Web DOM response (60s)' });
                        }, timeoutMs);

                        geminiDomResolvers.set(reqId, (result) => {
                            clearTimeout(timer);
                            resolve(result);
                        });
                    });

                    const result = await responsePromise;
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify(result));
                }

                if (pathname === '/api/win/launch') {"""

if post_target in content:
    content = content.replace(post_target, post_addition, 1)
    print('POST SUCCESS')
else:
    print('POST NOT FOUND')

with open('apps/web/agent-bridge.js', 'w', encoding='utf-8') as f:
    f.write(content)
