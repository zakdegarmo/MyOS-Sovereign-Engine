path = "apps/web/agent-bridge.js"
with open(path, "r", encoding="utf-8") as f:
    c = f.read().replace('\r\n', '\n')

anchor = "if (pathname === '/api/packages/uninstall') {"
# find the end of this block
idx = c.find(anchor)
next_block = "if (!global.observerProcess) {"
idx_next = c.find(next_block, idx)

new_endpoint = """
                // Endpoint: /api/ast/validate (Powered by pyparsing & AST Sentinel)
                if (pathname === '/api/ast/validate') {
                    const { code = '', filename = 'script.py' } = data;
                    const sentinelScript = path.resolve(__dirname, '../../scripts/tools/ast_syntax_sentinel.py');

                    const child = execFile('python', [sentinelScript, '--json'], { timeout: 15000 }, (error, stdout, stderr) => {
                        if (error && !stdout) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ success: false, valid: false, error: error.message, stderr }));
                        }
                        try {
                            const parsed = JSON.parse(stdout.trim());
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ success: true, ...parsed }));
                        } catch (e) {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ success: true, valid: false, summary: stdout || stderr }));
                        }
                    });

                    if (child.stdin) {
                        child.stdin.write(JSON.stringify({ code, filename }));
                        child.stdin.end();
                    }
                    return;
                }

                """

if idx_next != -1 and "/api/ast/validate" not in c:
    c = c[:idx_next] + new_endpoint + c[idx_next:]
    print("Added /api/ast/validate to agent-bridge.js")

with open(path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(c)
