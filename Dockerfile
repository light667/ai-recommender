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
RUN pip install --user --no-cache-dir -r requirements.txt gunicorn

# Stage final
FROM python:3.11-slim

WORKDIR /app

# Copier les dépendances depuis le builder
COPY --from=builder /root/.local /root/.local

# Copier le code de l'application
COPY backend/ ./backend/
COPY data/ ./data/
COPY models/ ./models/

# Variables d'environnement
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

# Exposer le port
EXPOSE 5000

# Créer un utilisateur non-root
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5000/')"

# Commande de démarrage
CMD ["gunicorn", "--config", "backend/gunicorn_config.py", "backend.app:app"]
