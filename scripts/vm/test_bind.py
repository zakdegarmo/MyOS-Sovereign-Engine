import http.server
import socket
import sys

print("Python version:", sys.version)
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(("0.0.0.0", 3333))
    s.listen(5)
    print("Socket bind port 3333 SUCCESS")
    s.close()
except Exception as e:
    print("Socket bind error:", e)
