#!/bin/bash
# Script de test local avec Docker avant déploiement

echo "🐳 Test de construction Docker..."
echo ""

# Construction de l'image
echo "📦 Étape 1/3 : Construction de l'image Docker..."
docker build -t ai-recommender-test . || {
    echo "❌ Erreur lors de la construction de l'image"
    exit 1
}

echo ""
echo "✅ Image construite avec succès!"
echo ""

# Lancement du conteneur
echo "🚀 Étape 2/3 : Lancement du conteneur..."
docker run -d \
    --name ai-recommender-test \
    -p 10000:10000 \
    -e PORT=10000 \
    -e FLASK_ENV=production \
    -e PYTHONUNBUFFERED=1 \
    ai-recommender-test || {
    echo "❌ Erreur lors du lancement du conteneur"
    exit 1
}

echo "✅ Conteneur lancé!"
echo ""

# Attendre que l'API soit prête
echo "⏳ Étape 3/3 : Attente du démarrage de l'API (peut prendre 30-60 secondes)..."
sleep 10

for i in {1..12}; do
    if curl -s http://localhost:10000/ > /dev/null 2>&1; then
        echo "✅ API prête!"
        break
    fi
    if [ $i -eq 12 ]; then
        echo "❌ L'API ne répond pas après 2 minutes"
        echo "📋 Logs du conteneur:"
        docker logs ai-recommender-test
        docker stop ai-recommender-test
        docker rm ai-recommender-test
        exit 1
    fi
    echo "   Tentative $i/12... en attente"
    sleep 10
done

echo ""
echo "🧪 Tests des endpoints..."
echo ""

# Test endpoint principal
echo "1️⃣  Test GET / (page d'accueil)"
curl -s http://localhost:10000/ | jq '.' || echo "❌ Erreur"
echo ""

# Test endpoint tools
echo "2️⃣  Test GET /api/tools (premiers 2 outils)"
curl -s http://localhost:10000/api/tools | jq '.tools[:2]' || echo "❌ Erreur"
echo ""

# Test endpoint categories
echo "3️⃣  Test GET /api/categories"
curl -s http://localhost:10000/api/categories | jq '.' || echo "❌ Erreur"
echo ""

# Afficher les logs
echo ""
echo "📋 Logs du conteneur:"
docker logs ai-recommender-test --tail 50
echo ""

# Nettoyage
echo "🧹 Nettoyage..."
docker stop ai-recommender-test
docker rm ai-recommender-test

echo ""
echo "✅ Tests terminés avec succès!"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Commit et push sur GitHub"
echo "   2. Déployer sur Render via le dashboard ou render.yaml"
echo "   3. Vérifier les logs de déploiement sur Render"
echo ""
