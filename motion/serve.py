#!/usr/bin/env python3
"""motion/serve.py — serve the film locally with the right MIME types.

    python3 motion/serve.py [port]        # then open http://localhost:8000

ES modules (.mjs) need `text/javascript`; Python's stock http.server gets this wrong on some
systems, which makes the film silently fail to start. This is the same reason the render script
serves the folder itself instead of opening file://.
"""
import functools
import http.server
import mimetypes
import os
import socketserver
import sys

mimetypes.add_type("text/javascript", ".mjs")
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("font/woff2", ".woff2")


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass  # quiet


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    root = os.path.dirname(os.path.abspath(__file__))
    handler = functools.partial(Handler, directory=root)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("0.0.0.0", port), handler) as httpd:
        print(f"film  →  http://localhost:{port}   (export  →  ?export=1)", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
