#!/bin/bash
# Script de démarrage optimisé pour Render

echo "🚀 Démarrage de AI Tools Recommender Backend"

# Vérifier si le modèle existe
if [ ! -f "models/recommender_model.pkl" ]; then
    echo "⚠️  Modèle non trouvé, entraînement..."
    cd backend && python recommender.py && cd ..
else
    echo "✅ Modèle trouvé, prêt à démarrer"
fi

# Démarrer Gunicorn avec le port dynamique
echo "🌐 Démarrage sur le port $PORT"
exec gunicorn --bind 0.0.0.0:$PORT --config backend/gunicorn_config.py backend.app:app
