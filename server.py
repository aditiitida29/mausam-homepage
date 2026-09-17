#!/usr/bin/env python3
"""
Mausam Web Application Multi-Threaded HTTP Server
Uses ThreadingHTTPServer to handle multiple concurrent connections from phones, tablets, and tunnels simultaneously.
"""

import http.server
import os
import sys
import socket
import json

# Ensure UTF-8 stdout encoding on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class MausamHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault('directory', DIRECTORY)
        super().__init__(*args, **kwargs)

    def guess_type(self, path):
        if path.endswith('.webmanifest') or path.endswith('manifest.json'):
            return 'application/manifest+json'
        if path.endswith('.js'):
            return 'application/javascript'
        if path.endswith('.css'):
            return 'text/css'
        return super().guess_type(path)

    def do_GET(self):
        if self.path == '/api/info':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            info = {
                'ip': get_local_ip(),
                'port': self.server.server_address[1],
                'status': 'online'
            }
            self.wfile.write(json.dumps(info).encode('utf-8'))
            return
        return super().do_GET()

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def run_server(port=PORT):
    local_ip = get_local_ip()
    for p in range(port, port + 10):
        try:
            httpd = http.server.ThreadingHTTPServer(("0.0.0.0", p), MausamHTTPHandler)
            print("================================================================")
            print(" [*] Mausam Multi-Threaded Server Online!")
            print(f" [PC Access]      http://localhost:{p}")
            print(f" [Phone Access]   http://{local_ip}:{p}")
            print(f" [Directory]      {DIRECTORY}")
            print("================================================================")
            sys.stdout.flush()
            httpd.serve_forever()
        except OSError as e:
            if "Address already in use" in str(e) or "10048" in str(e):
                continue
            else:
                raise e

if __name__ == "__main__":
    run_server()
