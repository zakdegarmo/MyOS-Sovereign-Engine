import urllib.request
import json

data = json.dumps({
    "model": "myos-cortex",
    "messages": [{"role": "user", "content": "Do you have API access or tool access in MyOS?"}],
    "stream": False
}).encode('utf-8')

req = urllib.request.Request("http://localhost:11434/api/chat", data=data, headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode('utf-8'))
    print(res["message"]["content"])
