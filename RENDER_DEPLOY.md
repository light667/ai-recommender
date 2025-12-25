# 🚀 Guide de Déploiement Render.com

## Configuration complète prête pour Render

Tous les fichiers sont optimisés pour un déploiement sur Render.com :

✅ `render.yaml` - Configuration Blueprint Render  
✅ `gunicorn_config.py` - Serveur de production optimisé  
✅ `requirements.txt` - Toutes les dépendances  
✅ `build.sh` - Script de build automatique  
✅ `start-render.sh` - Script de démarrage robuste  

---

## 📋 Étapes de déploiement

### 1. Aller sur Render.com

👉 [render.com](https://render.com)

- Cliquez sur **"Get Started"**
- Connectez-vous avec votre compte GitHub

### 2. Créer le Web Service Backend

1. Dans le dashboard : **"New +"** → **"Web Service"**

2. Autorisez Render à accéder à GitHub (si première fois)

3. Sélectionnez le repository : **`light667/ai-recommender`**

4. Configuration du service :

   **Basic Settings:**
   ```
   Name: ai-recommender-backend
   Region: Frankfurt (ou le plus proche de vous)
   Branch: main
   Root Directory: (laisser vide)
   Runtime: Python 3
   ```

   **Build & Deploy:**
   ```
   Build Command:
   pip install -r requirements.txt && cd backend && python recommender.py && cd ..
   
   Start Command:
   gunicorn --bind 0.0.0.0:$PORT --config backend/gunicorn_config.py backend.app:app
   ```

   **Instance Type:**
   ```
   Free
   ```

   **Advanced (optionnel):**
   - Health Check Path: `/`
   - Auto-Deploy: Yes (recommandé)

5. Cliquez sur **"Create Web Service"**

### 3. Attendre le déploiement

⏱️ **Temps estimé : 5-10 minutes**

Le processus :
1. ⚙️ Installation des dépendances (2-3 min)
2. 🧠 Entraînement du modèle ML (3-5 min)
3. 🚀 Démarrage du serveur (30 sec)

Vous pouvez suivre les logs en temps réel dans l'onglet **"Logs"**.

### 4. Récupérer l'URL

Une fois déployé (statut vert ✅), vous verrez :

```
https://ai-recommender-backend-XXXX.onrender.com
```

**Testez l'API :**
```bash
curl https://ai-recommender-backend-XXXX.onrender.com/api/stats
```

---

## 🎯 Configuration optimale appliquée

### ✅ Port dynamique
```python
port = os.getenv("PORT", "5000")  # Render définit automatiquement PORT
```

### ✅ Workers optimisés
```python
workers = 2  # Parfait pour le plan gratuit
timeout = 300  # 5 minutes pour les requêtes longues
```

### ✅ Health checks
```python
@app.route('/')
def home():
    return jsonify({'status': 'healthy'})
```

### ✅ Logging
```python
accesslog = "-"  # Logs dans stdout (visible dans Render)
errorlog = "-"
loglevel = "info"
```

---

## 🔧 Variables d'environnement (déjà configurées)

Render définira automatiquement :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `PORT` | `10000` | Port assigné par Render |
| `PYTHON_VERSION` | `3.11.0` | Version Python |
| `FLASK_ENV` | `production` | Mode production |
| `WORKERS` | `2` | Nombre de workers Gunicorn |

---

## 📊 Monitoring

### Voir les logs en temps réel

1. Dans votre service Render
2. Onglet **"Logs"**
3. Logs de build + runtime

### Métriques

- **CPU Usage** : visible dans l'onglet "Metrics"
- **Memory** : surveillé automatiquement
- **Requests** : compteur de requêtes

---

## ⚠️ Limitations du plan gratuit

| Limite | Valeur |
|--------|--------|
| RAM | 512 MB |
| CPU | Partagé |
| Veille | Après 15 min inactivité |
| Cold start | 30-60 secondes |
| Heures/mois | 750h gratuit |

**💡 Solutions :**
- Le modèle est sauvegardé (pas besoin de réentraîner)
- Cold start uniquement au premier accès
- Pour always-on : upgrade à $7/mois

---

## 🐛 Dépannage

### Erreur "Build failed"
```bash
# Vérifier les logs de build
# Souvent : problème de dépendances

# Solution : vérifier requirements.txt
pip install -r requirements.txt  # test local
```

### Erreur "Application failed to respond"
```bash
# Vérifier que le port est bien dynamique
# Dans gunicorn_config.py :
bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"
```

### Erreur "Out of memory"
```bash
# Le modèle est trop gros pour 512MB
# Solution : optimiser le modèle ou upgrade plan
```

### Cold start trop long
```bash
# Normal la première fois (entraînement)
# Ensuite le modèle est en cache
# Pour éviter : utiliser un cron job pour ping
```

---

## 🔄 Mises à jour

Render redéploie automatiquement à chaque push sur `main` :

```bash
git add .
git commit -m "Update API"
git push
```

Ou manuellement dans Render : bouton **"Manual Deploy"**

---

## 🌐 Étape suivante : Frontend

Une fois le backend déployé :

1. Notez l'URL : `https://ai-recommender-backend-XXXX.onrender.com`

2. Mettez à jour `frontend/app.js` :
   ```javascript
   const API_URL = 'https://ai-recommender-backend-XXXX.onrender.com/api';
   ```

3. Committez et poussez :
   ```bash
   git add frontend/app.js
   git commit -m "Update API URL for production"
   git push
   ```

4. Déployez le frontend :
   - **"New +"** → **"Static Site"**
   - Root Directory: `frontend`
   - Publish Directory: `.`

---

## ✅ Checklist finale

- [ ] Repository GitHub à jour
- [ ] Backend créé sur Render
- [ ] Build réussi (logs verts)
- [ ] Service démarré (status healthy)
- [ ] URL backend récupérée
- [ ] Test API avec curl/Postman
- [ ] Logs vérifiés (pas d'erreurs)

---

## 🎉 Votre backend est en production !

**URL API :** `https://ai-recommender-backend-XXXX.onrender.com`

**Endpoints disponibles :**
- `GET /` - Health check
- `GET /api/stats` - Statistiques
- `GET /api/tools` - Tous les outils
- `GET /api/recommend/<tool_name>` - Recommandations
- `GET /api/search?q=<query>` - Recherche
- `GET /api/categories` - Catégories
- `GET /api/category/<category>` - Outils par catégorie

---

**Besoin d'aide ?**  
- [Documentation Render](https://render.com/docs)
- [Community Forum](https://community.render.com)
