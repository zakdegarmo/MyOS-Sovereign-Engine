import sys

bridge_path = r"c:\Users\zakde\Desktop\AntiGravity projects\MyOS\apps\web\agent-bridge.js"

with open(bridge_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add GET /api/packages/list
get_target = """                res.writeHead(200, { 'Content-Type': contentType });
                return res.end(fileBuffer);
            } catch (err) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'File not found or unreadable', details: err.message }));
            }
        }
    }"""

get_replacement = """                res.writeHead(200, { 'Content-Type': contentType });
                return res.end(fileBuffer);
            } catch (err) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'File not found or unreadable', details: err.message }));
            }
        }

        if (parsedUrl.pathname === '/api/packages/list') {
            const pkgType = parsedUrl.searchParams.get('type') || 'npm';
            if (pkgType === 'npm') {
                try {
                    const pkgPath = path.resolve(__dirname, 'package.json');
                    const raw = await fs.readFile(pkgPath, 'utf-8');
                    const json = JSON.parse(raw);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({
                        success: true,
                        type: 'npm',
                        name: json.name,
                        version: json.version,
                        dependencies: json.dependencies || {},
                        devDependencies: json.devDependencies || {}
                    }));
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, error: err.message }));
                }
            } else if (pkgType === 'pip') {
                execFile('python', ['-m', 'pip', 'list', '--format=json'], { timeout: 15000 }, (error, stdout, stderr) => {
                    if (error) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ success: false, error: error.message, stderr }));
                    }
                    try {
                        const packages = JSON.parse(stdout.trim() || '[]');
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ success: true, type: 'pip', packages }));
                    } catch (e) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ success: false, error: 'Failed to parse pip list output', stdout }));
                    }
                });
                return;
            }
        }
    }"""

# 2. Add POST /api/packages/install & /api/packages/uninstall
post_target = """                    execFile('powershell.exe', ['-NoProfile', '-Command', data.command], { cwd, env }, (error, stdout, stderr) => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            stdout: stdout || '',
                            stderr: stderr || '',
                            error: error ? error.message : null
                        }));
                    });
                    return; 
                }"""

post_replacement = """                    execFile('powershell.exe', ['-NoProfile', '-Command', data.command], { cwd, env }, (error, stdout, stderr) => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            stdout: stdout || '',
                            stderr: stderr || '',
                            error: error ? error.message : null
                        }));
                    });
                    return; 
                }

                // Endpoint: /api/packages/install
                if (pathname === '/api/packages/install') {
                    const { type = 'npm', package: pkgName, flags = '' } = data;
                    if (!pkgName) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ success: false, error: 'Missing package name' }));
                    }

                    const cleanPkg = pkgName.trim();
                    console.log(`[Package Foundry] 📦 Installing ${type} package: ${cleanPkg}...`);

                    if (type === 'npm') {
                        const env = { ...process.env, PUPPETEER_SKIP_DOWNLOAD: 'true' };
                        const args = ['install', cleanPkg];
                        if (flags) args.push(...flags.split(' ').filter(Boolean));
                        execFile('npm.cmd', args, { cwd: __dirname, env, timeout: 180000 }, (error, stdout, stderr) => {
                            if (error) {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                return res.end(JSON.stringify({ success: false, error: error.message, stderr }));
                            }
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ success: true, type: 'npm', package: cleanPkg, stdout, stderr }));
                        });
                        return;
                    } else if (type === 'pip') {
                        const args = ['-m', 'pip', 'install', cleanPkg];
                        if (flags) args.push(...flags.split(' ').filter(Boolean));
                        execFile('python', args, { timeout: 180000 }, (error, stdout, stderr) => {
                            if (error) {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                return res.end(JSON.stringify({ success: false, error: error.message, stderr }));
                            }
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ success: true, type: 'pip', package: cleanPkg, stdout, stderr }));
                        });
                        return;
                    }
                }

                // Endpoint: /api/packages/uninstall
                if (pathname === '/api/packages/uninstall') {
                    const { type = 'npm', package: pkgName } = data;
                    if (!pkgName) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ success: false, error: 'Missing package name' }));
                    }

                    const cleanPkg = pkgName.trim();
                    console.log(`[Package Foundry] 🗑️ Uninstalling ${type} package: ${cleanPkg}...`);

                    if (type === 'npm') {
                        execFile('npm.cmd', ['uninstall', cleanPkg], { cwd: __dirname, timeout: 60000 }, (error, stdout, stderr) => {
                            if (error) {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                return res.end(JSON.stringify({ success: false, error: error.message, stderr }));
                            }
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ success: true, type: 'npm', package: cleanPkg, stdout }));
                        });
                        return;
                    } else if (type === 'pip') {
                        execFile('python', ['-m', 'pip', 'uninstall', '-y', cleanPkg], { timeout: 60000 }, (error, stdout, stderr) => {
                            if (error) {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                return res.end(JSON.stringify({ success: false, error: error.message, stderr }));
                            }
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ success: true, type: 'pip', package: cleanPkg, stdout }));
                        });
                        return;
                    }
                }"""

# Normalize CRLF
content_norm = content.replace("\r\n", "\n")
get_target_norm = get_target.replace("\r\n", "\n")
post_target_norm = post_target.replace("\r\n", "\n")

if get_target_norm in content_norm and post_target_norm in content_norm:
    content_norm = content_norm.replace(get_target_norm, get_replacement.replace("\r\n", "\n"))
    content_norm = content_norm.replace(post_target_norm, post_replacement.replace("\r\n", "\n"))
    # Restore CRLF
    final_content = content_norm.replace("\n", "\r\n")
    with open(bridge_path, "w", encoding="utf-8") as f:
        f.write(final_content)
    print("SUCCESS_UPDATED_BRIDGE")
else:
    print("TARGET_NOT_FOUND")
    if get_target_norm not in content_norm:
        print("get_target not found")
    if post_target_norm not in content_norm:
        print("post_target not found")
