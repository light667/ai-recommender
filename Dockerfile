# Multi-stage build pour optimiser la taille
FROM python:3.11-slim as builder

WORKDIR /app

# Installer les dépendances de build
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copier les requirements et installer les dépendances
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage final
FROM python:3.11-slim

WORKDIR /app

# Créer l'utilisateur d'abord
RUN useradd -m -u 1000 appuser

# Copier les dépendances depuis le builder et donner les bonnes permissions
COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local

# Copier le code de l'application
COPY --chown=appuser:appuser backend/ ./backend/
COPY --chown=appuser:appuser data/ ./data/
COPY --chown=appuser:appuser models/ ./models/

# Variables d'environnement
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

# Exposer le port (Render utilisera la variable $PORT)
EXPOSE 10000

# Passer à l'utilisateur non-root
USER appuser

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-10000}/')" || exit 1

# Commande de démarrage avec variable PORT de Render
CMD gunicorn --bind 0.0.0.0:${PORT:-10000} --config backend/gunicorn_config.py backend.app:app
