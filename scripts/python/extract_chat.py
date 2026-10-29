import re
import sys
import os

def extract_strings(filename, out_filename, min_length=20):
    try:
        with open(filename, 'rb') as f:
            data = f.read()
        
        # Regex to find sequences of printable ASCII characters
        # including common punctuation and space, tab, newline
        pattern = re.compile(b'[\x20-\x7E\n\r\t]+')
        strings = pattern.findall(data)
        
        with open(out_filename, 'w', encoding='utf-8') as out:
            for s in strings:
                if len(s) >= min_length:
                    try:
                        decoded = s.decode('utf-8').strip()
                        if len(decoded) >= min_length:
                            out.write(decoded + '\n---\n')
                    except UnicodeDecodeError:
                        pass
        print(f"Extraction complete. Results saved to {out_filename}")
        print(f"File size: {os.path.getsize(out_filename)} bytes")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    in_file = r'C:\Users\zakde\.gemini\antigravity\conversations\d3f47d63-e91a-418e-922d-9e794c94ebcb.pb'
    out_file = r'C:\Users\zakde\Desktop\AntiGravity projects\MyOS\raw_chat_dump.txt'
    extract_strings(in_file, out_file)
