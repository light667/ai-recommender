"""Configuration Gunicorn pour production"""

import multiprocessing

# Adresse et port
bind = "0.0.0.0:5000"

# Workers
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 5

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

# SSL (si nécessaire)
# keyfile = "/path/to/key.pem"
# certfile = "/path/to/cert.pem"
