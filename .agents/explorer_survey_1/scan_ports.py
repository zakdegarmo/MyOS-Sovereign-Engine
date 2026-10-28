import socket
import urllib.request

def scan():
    open_ports = []
    for port in range(3000, 9000):
        # Quick socket check
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.05)
        result = s.connect_ex(('127.0.0.1', port))
        s.close()
        if result == 0:
            open_ports.append(port)
    
    print(f"Open ports found: {open_ports}")
    for port in open_ports:
        try:
            req = urllib.request.urlopen(f"http://127.0.0.1:{port}", timeout=1)
            title = ""
            html = req.read().decode('utf-8', errors='ignore')
            if '<title>' in html and '</title>' in html:
                title = html.split('<title>')[1].split('</title>')[0]
            print(f"Port {port}: HTTP {req.getcode()} | Title: '{title.strip()}' | Snippet: {html[:80].strip()}")
        except Exception as e:
            print(f"Port {port}: HTTP error or non-http service ({e})")

if __name__ == "__main__":
    scan()
