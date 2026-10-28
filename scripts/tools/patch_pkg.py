with open('package.json', 'r', encoding='utf-8') as f:
    text = f.read()

target = '"dev:prism": "npm run dev --workspace=@myos/prism-os",'
addition = '"dev:prism": "npm run dev --workspace=@myos/prism-os",\n    "dev:spatial": "npm run dev --workspace=@myos/spatial-db",'

if target in text:
    text = text.replace(target, addition, 1)
    with open('package.json', 'w', encoding='utf-8') as f:
        f.write(text)
    print("PATCH SUCCESS")
else:
    print("TARGET NOT FOUND")
