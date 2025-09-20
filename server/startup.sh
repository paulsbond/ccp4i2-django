#!/bin/bash
set -e

# Accept environment variables as arguments
CCP4_DATA_PATH="${1:-/mnt/ccp4data}"
CCP4I2_PROJECTS_DIR="${2:-/mnt/ccp4data/ccp4i2-projects}"
DATABASE_URL="${3:-postgresql://default:default@localhost/default}"
DJANGO_SETTINGS_MODULE="${4:-ccp4x.config.settings}"
SECRET_KEY="${5:-default-secret-key}"

# Export variables for subprocesses (e.g., uvicorn)
export CCP4_DATA_PATH
export CCP4I2_PROJECTS_DIR
export DATABASE_URL
export DJANGO_SETTINGS_MODULE
export SECRET_KEY

echo "=== CCP4i2 Container Startup ==="
echo "CCP4_DATA_PATH: $CCP4_DATA_PATH"
echo "CCP4I2_PROJECTS_DIR: $CCP4I2_PROJECTS_DIR"
echo "DATABASE_URL: [HIDDEN FOR SECURITY]"
echo "DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "SECRET_KEY: [HIDDEN FOR SECURITY]"

# Quick health check endpoint using Python 3
python3 -c "
import http.server
import socketserver
import threading

class HealthHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health/':
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'OK')
        else:
            self.send_response(404)
            self.end_headers()

# Start health server in background
server = socketserver.TCPServer(('', 8000), HealthHandler)
thread = threading.Thread(target=server.serve_forever)
thread.daemon = True
thread.start()
print('Health check server started on port 8000')
" &
HEALTH_PID=$!  # Store the PID of the Python process
echo "Health server PID: $HEALTH_PID"

# CCP4 is pre-transferred to the file share
echo "CCP4 distribution is pre-transferred to $CCP4_DATA_PATH/ccp4-9"

# Setup CCP4 environment
if [ -f "$CCP4_DATA_PATH/ccp4-9/bin/ccp4.setup-sh" ]; then
  . "$CCP4_DATA_PATH/ccp4-9/bin/ccp4.setup-sh"
  export CCP4_PYTHON="$CCP4_DATA_PATH/ccp4-9/bin/ccp4-python"
  echo "CCP4 environment configured"
else
  echo "WARNING: CCP4 setup script not found"
  export CCP4_PYTHON=python3
fi

# Change to app directory
cd /usr/src/app

# Install dependencies (can run on all replicas)
echo "Installing Python dependencies..."
$CCP4_PYTHON -m pip install --upgrade pip
$CCP4_PYTHON -m pip install -r requirements.txt

# Run Django setup (can run on all replicas, but migrations are idempotent)
echo "Running Django migrations..."
$CCP4_PYTHON manage.py migrate
$CCP4_PYTHON manage.py collectstatic --noinput

# Before starting Django, kill the health server
echo "Stopping health check server to free port 8000..."
if kill -TERM $HEALTH_PID 2>/dev/null; then
    echo "Health server stopped successfully"
    # Wait a bit for the port to be freed
    sleep 2
else
    echo "Health server was already stopped or not found"
fi

# Start Django server
echo "Starting Django server..."
exec $CCP4_PYTHON -m uvicorn asgi:application --host 0.0.0.0 --port 8000
