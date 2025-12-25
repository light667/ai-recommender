"""Configuration Gunicorn pour production"""

import multiprocessing
import os

# Adresse et port (Render utilise la variable PORT, défaut 10000)
port = os.getenv("PORT", "10000")
bind = f"0.0.0.0:{port}"

# Workers (optimisé pour plan gratuit Render - max 512MB RAM)
workers = int(os.getenv("WORKERS", "2"))
worker_class = "sync"
worker_connections = 1000
timeout = 300
keepalive = 5
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process naming
proc_name = "ai-recommender-api"

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# Preload app for better performance
preload_app = True

# SSL (si nécessaire)
# keyfile = "/path/to/key.pem"
# certfile = "/path/to/cert.pem"
