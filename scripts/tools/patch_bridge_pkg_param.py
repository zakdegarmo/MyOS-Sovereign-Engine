path = "apps/web/agent-bridge.js"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "const { type = 'npm', package: pkgName, flags = '' } = data;",
    "const { type = 'npm', flags = '' } = data;\n                    const pkgName = data.package || data.name;"
)

with open(path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(c)

print("Patched agent-bridge.js to accept both data.package and data.name")
