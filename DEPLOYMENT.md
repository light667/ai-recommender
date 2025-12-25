# 🚀 Guide de Déploiement - AI Tools Recommender

## Options de déploiement

### 1. 🐳 Déploiement avec Docker (Recommandé)

#### Prérequis
- Docker et Docker Compose installés

#### Étapes

```bash
# 1. Construire et lancer les conteneurs
docker-compose up -d --build

# 2. Vérifier que tout fonctionne
docker-compose ps
docker-compose logs -f

# L'application est accessible sur:
# - Frontend: http://localhost
# - Backend: http://localhost:5000
```

#### Commandes utiles
```bash
# Arrêter les conteneurs
docker-compose down

# Redémarrer
docker-compose restart

# Voir les logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Mettre à jour
docker-compose up -d --build
```

---

### 2. 🌐 Déploiement sur VPS (Ubuntu/Debian)

#### Installation complète

```bash
# 1. Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# 2. Installer Python et dépendances
sudo apt install python3 python3-pip python3-venv nginx -y

# 3. Cloner le projet
cd /var/www
sudo git clone <votre-repo> ai-recommender
cd ai-recommender

# 4. Créer l'environnement virtuel
python3 -m venv venv
source venv/bin/activate

# 5. Installer les dépendances
pip install -r requirements.txt gunicorn

# 6. Entraîner le modèle
cd backend && python recommender.py && cd ..

# 7. Créer un service systemd pour le backend
sudo nano /etc/systemd/system/ai-recommender.service
```

#### Fichier service systemd
```ini
[Unit]
Description=AI Tools Recommender Backend
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/ai-recommender
Environment="PATH=/var/www/ai-recommender/venv/bin"
ExecStart=/var/www/ai-recommender/venv/bin/gunicorn \
    --config backend/gunicorn_config.py \
    backend.app:app

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Configuration Nginx
```bash
sudo nano /etc/nginx/sites-available/ai-recommender
```

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Frontend
    location / {
        root /var/www/ai-recommender/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/ai-recommender /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Démarrer le service
sudo systemctl enable ai-recommender
sudo systemctl start ai-recommender
sudo systemctl status ai-recommender
```

#### SSL avec Let's Encrypt (optionnel mais recommandé)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d votre-domaine.com
```

---

### 3. ☁️ Déploiement sur Render.com (Gratuit)

#### Backend

1. Créer un compte sur [Render.com](https://render.com)
2. Créer un nouveau **Web Service**
3. Connecter votre dépôt Git
4. Configuration:
   - **Build Command**: `pip install -r requirements.txt gunicorn && cd backend && python recommender.py`
   - **Start Command**: `gunicorn --config backend/gunicorn_config.py backend.app:app`
   - **Environment**: Python 3

#### Frontend

1. Créer un **Static Site**
2. Configuration:
   - **Build Command**: (vide)
   - **Publish Directory**: `frontend`

---

### 4. 🚂 Déploiement sur Railway.app

```bash
# 1. Installer Railway CLI
npm i -g @railway/cli

# 2. Se connecter
railway login

# 3. Initialiser le projet
railway init

# 4. Déployer
railway up
```

Créer un fichier `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend && python recommender.py && gunicorn --config gunicorn_config.py app:app",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

### 5. 🌊 Déploiement sur Heroku

```bash
# 1. Installer Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# 2. Se connecter
heroku login

# 3. Créer l'application
heroku create ai-recommender-app

# 4. Ajouter buildpack Python
heroku buildpacks:set heroku/python

# 5. Déployer
git push heroku main
```

Créer un `Procfile`:
```
web: cd backend && gunicorn --config gunicorn_config.py app:app
```

---

### 6. 🔷 Déploiement sur Azure App Service

```bash
# 1. Installer Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# 2. Se connecter
az login

# 3. Créer un groupe de ressources
az group create --name ai-recommender-rg --location eastus

# 4. Créer le plan App Service
az appservice plan create --name ai-recommender-plan --resource-group ai-recommender-rg --sku B1 --is-linux

# 5. Créer la web app
az webapp create --resource-group ai-recommender-rg --plan ai-recommender-plan --name ai-recommender --runtime "PYTHON:3.11"

# 6. Déployer depuis Git
az webapp deployment source config-local-git --name ai-recommender --resource-group ai-recommender-rg
```

---

## 📊 Monitoring et Logs

### Docker
```bash
# Logs en temps réel
docker-compose logs -f

# Statistiques des conteneurs
docker stats
```

### Systemd (VPS)
```bash
# Logs du service
sudo journalctl -u ai-recommender -f

# Redémarrer le service
sudo systemctl restart ai-recommender
```

---

## 🔒 Bonnes pratiques de sécurité

1. **Variables d'environnement**: Ne jamais commiter de clés secrètes
2. **HTTPS**: Toujours utiliser SSL en production
3. **Firewall**: Configurer UFW ou iptables
4. **Mises à jour**: Garder le système à jour
5. **Backups**: Sauvegarder régulièrement les modèles et données
6. **Rate limiting**: Limiter les requêtes API
7. **CORS**: Configurer correctement les origines autorisées

---

## 🔧 Configuration de production

### Variables d'environnement recommandées

```bash
# Backend
export FLASK_ENV=production
export WORKERS=4
export LOG_LEVEL=info
export MAX_REQUESTS=1000

# Frontend
export API_URL=https://api.votre-domaine.com
```

---

## 📈 Scalabilité

### Load Balancing avec Nginx
```nginx
upstream backend {
    least_conn;
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}
```

### Redis pour le cache (optionnel)
```python
# Ajouter dans requirements.txt
redis==5.0.1
flask-caching==2.1.0
```

---

## ✅ Checklist de déploiement

- [ ] Modèle ML entraîné et sauvegardé
- [ ] Variables d'environnement configurées
- [ ] HTTPS/SSL configuré
- [ ] CORS configuré correctement
- [ ] Logs configurés et accessibles
- [ ] Monitoring en place
- [ ] Backups automatisés
- [ ] Firewall configuré
- [ ] Tests de charge effectués
- [ ] Documentation à jour

---

**Besoin d'aide ?** Consultez la documentation des plateformes ou ouvrez une issue sur GitHub.
