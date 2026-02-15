import http.server
import socketserver
import os
import sys

PORT = 5500
DIRECTORY = "dist"

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Check if the requested file exists
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            # If not, serve index.html
            self.path = "/index.html"
        super().do_GET()

if __name__ == "__main__":
    # Change into the frontend directory if running from root
    if "frontend" in os.listdir("."):
        os.chdir("frontend")
    
    # Ensure dist exists
    if not os.path.exists(DIRECTORY):
        print(f"Error: '{DIRECTORY}' directory not found. Did you run 'npm run build'?")
        sys.exit(1)

    os.chdir(DIRECTORY)
    
    with socketserver.TCPServer(("", PORT), SPAHandler) as httpd:
        print(f"Serving SPA at http://localhost:{PORT}")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down...")
            httpd.shutdown()
