# 🚀 Déploiement en Production - Guide Rapide

## Option Recommandée : Render.com (Gratuit)

### ✅ Avantages
- ✅ Gratuit avec plan de base
- ✅ Déploiement automatique depuis Git
- ✅ HTTPS automatique
- ✅ Logs et monitoring inclus
- ✅ Pas de carte de crédit nécessaire

---

## 📋 Étapes de déploiement

### 1️⃣ Préparer le dépôt Git

```bash
# Initialiser Git si pas déjà fait
git init
git add .
git commit -m "Initial commit - AI Recommender"

# Créer un dépôt sur GitHub
# Puis pousser le code
git remote add origin https://github.com/VOTRE-USERNAME/ai-recommander.git
git branch -M main
git push -u origin main
```

### 2️⃣ Créer un compte Render

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **"Get Started"**
3. Connectez-vous avec GitHub

### 3️⃣ Déployer le Backend

1. Dans le dashboard Render, cliquez sur **"New +"** → **"Web Service"**
2. Connectez votre dépôt GitHub `ai-recommander`
3. Configuration :
   - **Name** : `ai-recommender-backend`
   - **Region** : Frankfurt (ou le plus proche)
   - **Branch** : `main`
   - **Root Directory** : (laisser vide)
   - **Runtime** : `Python 3`
   - **Build Command** : 
     ```
     pip install -r requirements.txt && cd backend && python recommender.py
     ```
   - **Start Command** : 
     ```
     gunicorn --config backend/gunicorn_config.py backend.app:app
     ```
   - **Instance Type** : `Free`

4. Cliquez sur **"Create Web Service"**
5. Attendez 5-10 minutes (première fois plus long car il entraîne le modèle)
6. **Notez l'URL** : `https://ai-recommender-backend.onrender.com`

### 4️⃣ Mettre à jour le Frontend

Modifiez `frontend/app.js` pour utiliser l'URL du backend :

```javascript
// Remplacer cette ligne
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

// Par cette ligne avec VOTRE URL Render
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://ai-recommender-backend.onrender.com/api';
```

Committez et poussez :
```bash
git add frontend/app.js
git commit -m "Update API URL for production"
git push
```

### 5️⃣ Déployer le Frontend

#### Option A : Render Static Site (Recommandé)

1. **"New +"** → **"Static Site"**
2. Sélectionnez le même dépôt
3. Configuration :
   - **Name** : `ai-recommender-frontend`
   - **Branch** : `main`
   - **Root Directory** : `frontend`
   - **Build Command** : (laisser vide)
   - **Publish Directory** : `.`

4. Cliquez sur **"Create Static Site"**
5. Votre frontend sera sur : `https://ai-recommender-frontend.onrender.com`

#### Option B : Vercel (Alternative, aussi gratuit)

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer le frontend
cd frontend
vercel

# Suivre les instructions
# Publish directory: .
```

#### Option C : Netlify (Alternative)

1. Allez sur [netlify.com](https://netlify.com)
2. **"Add new site"** → **"Import from Git"**
3. Sélectionnez votre repo
4. Configuration :
   - **Base directory** : `frontend`
   - **Build command** : (vide)
   - **Publish directory** : `.`

---

## 🎯 Résultat Final

Votre application sera accessible à :
- **Frontend** : `https://ai-recommender-frontend.onrender.com`
- **Backend API** : `https://ai-recommender-backend.onrender.com/api`

---

## 🔧 Configuration CORS pour la Production

Dans `backend/app.py`, mettez à jour CORS pour accepter votre domaine :

```python
from flask_cors import CORS

# Remplacer
CORS(app)

# Par
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://ai-recommender-frontend.onrender.com",
            "http://localhost:8000",  # Pour le dev
        ]
    }
})
```

---

## 📊 Monitoring et Maintenance

### Voir les logs
1. Dans Render, allez dans votre service
2. Onglet **"Logs"**
3. Logs en temps réel de votre application

### Redéployer
- Render redéploie automatiquement à chaque `git push`
- Ou manuellement : bouton **"Manual Deploy"** dans Render

### Plan gratuit - Limitations
⚠️ Le plan gratuit de Render :
- Se met en veille après 15 min d'inactivité
- Premier accès peut prendre 30-60 secondes (cold start)
- 750 heures/mois gratuites

**Solutions :**
1. Upgrade vers plan payant ($7/mois) pour always-on
2. Utiliser un service de ping (uptimerobot.com) pour garder actif
3. Accepter le cold start initial

---

## 🚀 Déploiement Alternatif : Railway.app

Railway est aussi excellent et gratuit :

```bash
# 1. Installer Railway CLI
npm i -g @railway/cli

# 2. Se connecter
railway login

# 3. Créer un nouveau projet
railway init

# 4. Déployer
railway up

# 5. Ajouter un domaine
railway domain
```

Configuration dans Railway :
- **Build Command** : `pip install -r requirements.txt && cd backend && python recommender.py`
- **Start Command** : `gunicorn --config backend/gunicorn_config.py backend.app:app`
- **Port** : 5000

---

## 🔒 Bonnes Pratiques Production

### 1. Variables d'environnement
Dans Render, ajoutez :
- `FLASK_ENV=production`
- `SECRET_KEY=votre-clé-secrète-aléatoire`

### 2. Monitoring
- Activez les alertes dans Render
- Utilisez [UptimeRobot](https://uptimerobot.com) pour surveiller l'uptime

### 3. Backups
- Le modèle ML est sauvegardé dans le dépôt Git
- Faites des backups réguliers de vos données

### 4. Performance
- Le plan gratuit est suffisant pour un MVP
- Pour production avec trafic : upgrade vers plan payant

---

## 🆘 Dépannage

### Erreur "Module not found"
```bash
# Vérifiez requirements.txt
# Ajoutez pandas dans le build command si nécessaire
```

### Erreur "Port already in use"
```bash
# Render gère automatiquement le port via $PORT
# Pas de configuration nécessaire avec Gunicorn
```

### Backend trop lent au démarrage
```bash
# Normal la première fois (entraînement du modèle)
# Ensuite le modèle est en cache
```

---

## ✅ Checklist Déploiement

- [ ] Code poussé sur GitHub
- [ ] Backend déployé sur Render
- [ ] URL backend notée et mise à jour dans frontend
- [ ] Frontend déployé
- [ ] CORS configuré correctement
- [ ] Test de l'application en production
- [ ] Monitoring configuré
- [ ] Domaine personnalisé configuré (optionnel)

---

**🎉 Félicitations ! Votre application est en ligne !**

Besoin d'aide ? Consultez :
- [Documentation Render](https://render.com/docs)
- [Documentation Railway](https://docs.railway.app)
