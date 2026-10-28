#!/usr/bin/env python3
import socket
import time
import sys

def send_qemu_cmd(cmd, port=4444):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect(('127.0.0.1', port))
    time.sleep(0.2)
    s.recv(4096)
    s.sendall((cmd + '\n').encode('utf-8'))
    time.sleep(0.3)
    response = s.recv(4096).decode('utf-8', errors='ignore')
    s.close()
    return response

def type_string(text, port=4444):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect(('127.0.0.1', port))
    time.sleep(0.2)
    s.recv(4096)

    key_map = {
        ' ': 'spc',
        '\n': 'ret',
        '-': 'minus',
        '/': 'slash',
        '.': 'dot',
        ':': 'shift-semicolon',
        ';': 'semicolon',
        '_': 'shift-minus',
        '=': 'equal',
        '"': 'shift-apostrophe',
        "'": 'apostrophe',
        '&': 'shift-7',
        '|': 'shift-backslash',
        '>': 'shift-dot',
        '<': 'shift-comma',
        '~': 'shift-grave_accent',
        '`': 'grave_accent',
        '$': 'shift-4',
        '*': 'shift-8',
        '+': 'shift-equal',
        '?': 'shift-slash',
        '!': 'shift-1',
        '@': 'shift-2',
        '#': 'shift-3',
        '%': 'shift-5',
        '^': 'shift-6',
        '(': 'shift-9',
        ')': 'shift-0',
    }

    for char in text:
        if char in key_map:
            key = key_map[char]
        elif char.isupper():
            key = f"shift-{char.lower()}"
        else:
            key = char
        s.sendall(f"sendkey {key}\n".encode('utf-8'))
        time.sleep(0.03)

    s.close()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(1)
    action = sys.argv[1]
    if action == 'type':
        type_string(' '.join(sys.argv[2:]))
    elif action == 'cmd':
        print(send_qemu_cmd(' '.join(sys.argv[2:])))
    elif action == 'enter':
        type_string('\n')
    elif action == 'screenshot':
        send_qemu_cmd(f"screendump {sys.argv[2]}")
