path = "apps/web/agent-bridge.js"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

# 1. Add shell: true to npm.cmd in install
old_install_npm = "execFile('npm.cmd', args, { cwd: __dirname, env, timeout: 180000 }"
new_install_npm = "execFile('npm.cmd', args, { cwd: __dirname, env, timeout: 180000, shell: true }"

if old_install_npm in c:
    c = c.replace(old_install_npm, new_install_npm)
    print("Fixed install npm.cmd with shell: true")

# 2. Add shell: true to npm.cmd in uninstall and support data.name
old_uninstall_npm = "execFile('npm.cmd', ['uninstall', cleanPkg], { cwd: __dirname, timeout: 60000 }"
new_uninstall_npm = "execFile('npm.cmd', ['uninstall', cleanPkg], { cwd: __dirname, timeout: 60000, shell: true }"

if old_uninstall_npm in c:
    c = c.replace(old_uninstall_npm, new_uninstall_npm)
    print("Fixed uninstall npm.cmd with shell: true")

old_uninstall_pkg = "const { type = 'npm', package: pkgName } = data;"
new_uninstall_pkg = "const { type = 'npm' } = data;\n                    const pkgName = data.package || data.name;"

if old_uninstall_pkg in c:
    c = c.replace(old_uninstall_pkg, new_uninstall_pkg)
    print("Fixed uninstall package name parameter")

with open(path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(c)

print("Agent Bridge Windows shell: true patch applied.")
