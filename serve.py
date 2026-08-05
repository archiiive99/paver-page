#!/usr/bin/env python3
"""Static server for the PAVER project page.

Binds every interface so a forwarded port reaches it; anyone who can reach
this address and port can read the whole page, including the manuscript PDFs.

Immutable long-lived caching for /assets, whose contents never change in place,
and no-cache for the documents so edits appear on reload. Range requests stay
enabled so the closed-loop videos can seek.
"""
import http.server
import os
import socketserver

HOST = "0.0.0.0"
PORT = 28417

os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".mp4": "video/mp4",
        ".pdf": "application/pdf",
        ".webp": "image/webp",
        ".woff2": "font/woff2",
    }

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        path = self.path.split("?", 1)[0]
        if path.endswith("manifest.json") or path.endswith(".js") or path.endswith(".css"):
            self.send_header("Cache-Control", "no-cache")
        elif path.startswith("/assets/"):
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        else:
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True
    # a clip warms 240 images at once; the default backlog of 5 turned that
    # into refused connections and made scrubbing wait on retries
    request_queue_size = 256


if __name__ == "__main__":
    with Server((HOST, PORT), Handler) as httpd:
        import socket
        lan = socket.gethostbyname(socket.gethostname())
        print(f"PAVER project page on http://127.0.0.1:{PORT}", flush=True)
        print(f"                     and http://{lan}:{PORT} (every interface)", flush=True)
        httpd.serve_forever()
