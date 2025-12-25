# 🤖 AI Tools Recommender

Un système de recommandation d'outils d'IA générative basé sur le Machine Learning, avec une interface web moderne et interactive.

## 📋 Fonctionnalités

- **Recommandations intelligentes** : Système ML basé sur la similarité cosinus (content-based filtering)
- **Recherche avancée** : Recherche par mots-clés dans plusieurs champs
- **Filtres multiples** : Catégorie, modalité, open-source, API disponible
- **Interface moderne** : Design responsive et attrayant avec gradients
- **Exploration par catégorie** : Visualisation des catégories avec statistiques
- **API REST complète** : Backend Flask avec endpoints documentés

## 🏗️ Architecture

```
ai-recommander/
├── backend/
│   ├── app.py              # API Flask
│   └── recommender.py      # Modèle de recommandation ML
├── frontend/
│   ├── index.html          # Interface web
│   ├── style.css           # Styles modernes
│   └── app.js              # Logique frontend
├── data/
│   └── Generative AI Tools - Platforms 2025.csv
├── models/
│   └── recommender_model.pkl (généré après entraînement)
└── requirements.txt
```

## 🚀 Installation

### 1. Cloner le projet

```bash
cd ai-recommander
```

### 2. Créer un environnement virtuel (recommandé)

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

## 🎯 Utilisation

### Étape 1 : Entraîner le modèle

```bash
cd backend
python recommender.py
```

Cela va :
- Charger les données CSV
- Prétraiter les features
- Entraîner le modèle de recommandation
- Sauvegarder le modèle dans `models/recommender_model.pkl`

### Étape 2 : Démarrer le serveur backend

```bash
cd backend
python app.py
```

Le serveur Flask démarre sur `http://localhost:5000`

### Étape 3 : Ouvrir l'interface web

Ouvrez `frontend/index.html` dans votre navigateur, ou utilisez un serveur local :

```bash
cd frontend
python -m http.server 8000
```

Puis ouvrez `http://localhost:8000`

## 📡 API Endpoints

### Statistiques
```
GET /api/stats
```

### Tous les outils
```
GET /api/tools?open_source=1&api_available=1&category=LLMs&modality=code
```

### Recommandations
```
GET /api/recommend/<tool_name>?n=5&open_source=1
```

### Par catégorie
```
GET /api/category/<category>?n=10
```

### Recherche
```
GET /api/search?q=openai
```

### Catégories et modalités
```
GET /api/categories
GET /api/modalities
```

## 🎨 Fonctionnalités de l'interface

### Onglet Explorer
- Affiche tous les outils d'IA
- Recherche en temps réel
- Filtres multiples (catégorie, modalité, open-source, API)
- Cartes interactives avec détails

### Onglet Recommandations
- Sélectionner un outil de référence
- Obtenir 6 outils similaires
- Score de similarité affiché en pourcentage

### Onglet Par Catégorie
- Vue d'ensemble des catégories
- Nombre d'outils par catégorie
- Clic pour filtrer par catégorie

## 🧠 Modèle de Machine Learning

Le système utilise une approche **content-based filtering** :

1. **Features textuelles** : TF-IDF sur catégorie, modalité, entreprise
2. **Features binaires** : open-source, API, modalités (text, image, video, etc.)
3. **Similarité cosinus** : Calcul de similarité entre tous les outils
4. **Recommandations** : Top N outils les plus similaires

### Métriques
- Matrice de similarité : 118 x 118 (tous les outils)
- Features combinées : TF-IDF (100 dimensions) + features binaires (12 dimensions)

## 📊 Dataset

**Generative AI Tools - Platforms 2025.csv** contient :
- 118 outils d'IA générative
- 50+ entreprises (OpenAI, Google, Meta, Anthropic, etc.)
- Catégories : LLMs, Image Gen, Video Gen, Audio, Code Assistants, etc.
- Modalités : text, image, video, audio, code, multimodal, etc.

## 🛠️ Technologies

### Backend
- **Flask** : Framework web Python
- **scikit-learn** : Machine Learning (TF-IDF, cosine similarity)
- **pandas** : Manipulation de données
- **numpy** : Calculs numériques

### Frontend
- **HTML5/CSS3** : Structure et styles modernes
- **JavaScript (Vanilla)** : Logique interactive
- **CSS Grid & Flexbox** : Layout responsive
- **Gradients & Animations** : Design moderne

## 🎯 Cas d'usage

1. **Trouver des alternatives** : "Je veux des outils similaires à ChatGPT"
2. **Explorer une catégorie** : "Quels sont les meilleurs outils de génération d'images ?"
3. **Filtrer par critères** : "Je veux uniquement des outils open-source avec API"
4. **Découvrir des outils** : Navigation dans toutes les catégories

## 📈 Améliorations futures

- [ ] Système de notation utilisateur
- [ ] Filtres avancés (année de sortie, prix)
- [ ] Comparaison côte à côte de plusieurs outils
- [ ] Export des résultats (PDF, CSV)
- [ ] Authentification utilisateur
- [ ] Sauvegarde des favoris
- [ ] Collaborative filtering (recommandations basées sur les utilisateurs)
- [ ] Intégration d'API externes pour données à jour

## 📝 Licence

Ce projet est à usage éducatif et de démonstration.

## 👥 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

---

**Créé avec ❤️ et Machine Learning**
