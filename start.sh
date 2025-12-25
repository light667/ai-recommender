#!/bin/bash

echo "🚀 Démarrage de AI Tools Recommender"
echo ""

# Vérifier si l'environnement virtuel existe
if [ ! -d "venv" ]; then
    echo "⚠️  Environnement virtuel non trouvé. Création..."
    python3 -m venv venv
fi

# Activer l'environnement virtuel
source venv/bin/activate

# Installer les dépendances
echo "📦 Installation des dépendances..."
pip install -q -r requirements.txt

# Entraîner le modèle si nécessaire
if [ ! -f "models/recommender_model.pkl" ]; then
    echo "🔧 Entraînement du modèle de recommandation..."
    cd backend
    python recommender.py
    cd ..
fi

# Démarrer le serveur backend en arrière-plan
echo "🖥️  Démarrage du serveur backend..."
cd backend
python app.py &
BACKEND_PID=$!
cd ..

# Attendre que le backend démarre
sleep 3

# Démarrer le serveur frontend
echo "🌐 Démarrage du serveur frontend..."
cd frontend
python3 -m http.server 8000 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Application démarrée avec succès !"
echo ""
echo "📍 Backend API: http://localhost:5000"
echo "📍 Frontend: http://localhost:8000"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter les serveurs"

# Fonction pour arrêter proprement les serveurs
cleanup() {
    echo ""
    echo "🛑 Arrêt des serveurs..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Capturer Ctrl+C
trap cleanup INT

# Attendre indéfiniment
wait
