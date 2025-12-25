#!/bin/bash
# Script de build pour Render.com

echo "📦 Installation des dépendances..."
pip install -r requirements.txt

echo "🧠 Entraînement du modèle de recommandation..."
cd backend
python recommender.py
cd ..

echo "✅ Build terminé !"
