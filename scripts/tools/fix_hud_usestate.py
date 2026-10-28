path = "apps/web/src/components/MaxOverlay/SystemHud.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("import React from 'react';", "import React, { useState } from 'react';")

with open(path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(c)

print("Imported useState in SystemHud.tsx")
