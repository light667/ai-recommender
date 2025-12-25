@echo off
echo 🚀 Démarrage de AI Tools Recommender
echo.

REM Vérifier si l'environnement virtuel existe
if not exist "venv" (
    echo ⚠️  Environnement virtuel non trouvé. Création...
    python -m venv venv
)

REM Activer l'environnement virtuel
call venv\Scripts\activate

REM Installer les dépendances
echo 📦 Installation des dépendances...
pip install -q -r requirements.txt

REM Entraîner le modèle si nécessaire
if not exist "models\recommender_model.pkl" (
    echo 🔧 Entraînement du modèle de recommandation...
    cd backend
    python recommender.py
    cd ..
)

REM Démarrer le serveur backend
echo 🖥️  Démarrage du serveur backend...
start "Backend Server" cmd /k "cd backend && python app.py"

REM Attendre que le backend démarre
timeout /t 3 /nobreak > nul

REM Démarrer le serveur frontend
echo 🌐 Démarrage du serveur frontend...
start "Frontend Server" cmd /k "cd frontend && python -m http.server 8000"

echo.
echo ✅ Application démarrée avec succès !
echo.
echo 📍 Backend API: http://localhost:5000
echo 📍 Frontend: http://localhost:8000
echo.
echo Fermez les fenêtres des serveurs pour arrêter l'application
pause
