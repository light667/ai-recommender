# ✅ Checklist de Déploiement Render (Docker)

## Avant le Déploiement

### 📁 Fichiers Requis
- [x] `Dockerfile` - Configuré avec port dynamique et multi-stage build
- [x] `render.yaml` - Configuré pour runtime: docker
- [x] `requirements.txt` - Toutes les dépendances listées
- [x] `.dockerignore` - Optimisé pour réduire la taille du build
- [x] `backend/app.py` - Chemins corrigés pour Docker
- [x] `backend/gunicorn_config.py` - Configuration production avec PORT dynamique
- [x] `data/Generative AI Tools - Platforms 2025.csv` - Fichier de données présent

### 🔧 Configuration Vérifiée
- [x] Port dynamique avec `$PORT` dans Dockerfile
- [x] Chemins relatifs (pas de `../`) dans app.py
- [x] Gunicorn utilise `os.getenv("PORT", "10000")`
- [x] Healthcheck configuré dans Dockerfile
- [x] Variables d'environnement dans render.yaml
- [x] Multi-stage build pour optimiser la taille
- [x] Utilisateur non-root (appuser) configuré

### 🧪 Tests Locaux (Optionnel mais Recommandé)

```bash
# Test de construction Docker
docker build -t ai-recommender-test .

# Test d'exécution
docker run -d -p 10000:10000 -e PORT=10000 --name ai-recommender-test ai-recommender-test

# Test de l'API
curl http://localhost:10000/
curl http://localhost:10000/api/tools

# Voir les logs
docker logs ai-recommender-test

# Nettoyage
docker stop ai-recommender-test && docker rm ai-recommender-test
```

Ou utilisez le script automatique:
```bash
./test-docker.sh
```

## Déploiement sur Render

### 📤 1. Pousser sur GitHub

```bash
git add .
git commit -m "Configuration pour déploiement Render Docker"
git push origin main
```

### 🌐 2. Créer le Service sur Render

#### Via Blueprint (Recommandé):
1. Aller sur [Render Dashboard](https://dashboard.render.com)
2. Cliquer "New +" → "Blueprint"
3. Connecter votre repository GitHub
4. Sélectionner le repository `ai-recommander`
5. Render détecte `render.yaml` automatiquement
6. Cliquer "Apply" pour créer les 2 services

#### Via Web Service Manuel:
1. "New +" → "Web Service"
2. Connecter le repository GitHub
3. Sélectionner le repository
4. Configuration:
   - **Name**: `ai-recommender-backend`
   - **Runtime**: `Docker`
   - **Region**: `Frankfurt` (ou proche de vous)
   - **Branch**: `main`
   - **Plan**: `Free`
5. Variables d'environnement (auto-configurées):
   - `FLASK_ENV=production`
   - `PYTHONUNBUFFERED=1`
6. Cliquer "Create Web Service"

### ⏱️ 3. Attendre le Build

- Le build prend 3-5 minutes la première fois
- Render va:
  1. Cloner le repository
  2. Construire l'image Docker
  3. Lancer le conteneur
  4. Générer le modèle ML (1-2 minutes)
  5. Démarrer Gunicorn

### 🔍 4. Vérifier le Déploiement

Une fois le service "Live":

```bash
# Test de base
curl https://ai-recommender-backend.onrender.com/

# Test API
curl https://ai-recommender-backend.onrender.com/api/tools

# Test catégories
curl https://ai-recommender-backend.onrender.com/api/categories
```

Ou ouvrez directement dans le navigateur:
- https://ai-recommender-backend.onrender.com/

## 📊 Après le Déploiement

### ✅ Vérifications

- [ ] L'URL du backend fonctionne
- [ ] `/api/tools` retourne des données
- [ ] `/api/categories` retourne les catégories
- [ ] Les logs ne montrent pas d'erreurs
- [ ] Le healthcheck est vert sur le dashboard Render

### 📝 URLs à Noter

- **Backend API**: https://ai-recommender-backend.onrender.com
- **Frontend** (si déployé): https://ai-recommender-frontend.onrender.com
- **Dashboard Render**: https://dashboard.render.com

### 🐛 En Cas de Problème

1. **Vérifier les logs** dans le dashboard Render
2. **Erreurs communes**:
   - Port incorrect → Vérifier que `$PORT` est utilisé partout
   - Chemins incorrects → Vérifier les chemins dans app.py
   - Mémoire insuffisante → Réduire workers dans gunicorn_config.py
   - Modèle non généré → Vérifier que le CSV existe dans data/

3. **Commandes utiles**:
   ```bash
   # Voir les logs en temps réel (via dashboard)
   # Redéployer manuellement
   # Redémarrer le service
   ```

## 🔄 Mises à Jour

Pour mettre à jour:

```bash
# 1. Faire les modifications
git add .
git commit -m "Description des changements"
git push origin main

# 2. Render redéploie automatiquement
# 3. Vérifier les logs pendant le déploiement
```

## ⚡ Optimisations Appliquées

✅ Multi-stage build → Image plus légère
✅ Port dynamique → Compatible Render
✅ Preload app → Démarrage plus rapide
✅ Healthcheck → Détection automatique des problèmes
✅ Workers optimisés → Fonctionne avec 512MB RAM
✅ .dockerignore → Build plus rapide
✅ Utilisateur non-root → Sécurité renforcée

## 📚 Documentation

- [Render Docker Docs](https://render.com/docs/docker)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Render Free Tier](https://render.com/docs/free)
