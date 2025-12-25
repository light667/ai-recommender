from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender import AIToolRecommender
import os
import pandas as pd

app = Flask(__name__)
CORS(app)  # Permet les requêtes cross-origin depuis le frontend

# Initialiser le recommender
recommender = None

def init_recommender():
    """Initialise le système de recommandation"""
    global recommender
    # Chemins absolus pour Docker
    data_path = 'data/Generative AI Tools - Platforms 2025.csv'
    model_path = 'models/recommender_model.pkl'
    
    recommender = AIToolRecommender(data_path)
    
    # Charger le modèle s'il existe, sinon l'entraîner
    if os.path.exists(model_path):
        print("📦 Chargement du modèle existant...")
        recommender.load_model('models')
    else:
        print("🔧 Entraînement du nouveau modèle...")
        recommender.load_data()
        recommender.preprocess_data()
        recommender.train_model()
        # Créer le répertoire models s'il n'existe pas
        os.makedirs('models', exist_ok=True)
        recommender.save_model('models')
    
    print("✅ API prête !")


@app.route('/')
def home():
    """Page d'accueil de l'API"""
    return jsonify({
        'message': 'API de Recommandation d\'Outils IA 🤖',
        'version': '1.0',
        'endpoints': {
            '/api/tools': 'Liste tous les outils',
            '/api/recommend/<tool_name>': 'Recommandations basées sur un outil',
            '/api/category/<category>': 'Outils par catégorie',
            '/api/search?q=<query>': 'Recherche d\'outils',
            '/api/categories': 'Liste des catégories',
            '/api/modalities': 'Liste des modalités',
            '/api/stats': 'Statistiques du dataset'
        }
    })


@app.route('/api/tools', methods=['GET'])
def get_all_tools():
    """Retourne tous les outils avec filtres optionnels"""
    try:
        # Récupérer les filtres de la query string
        open_source = request.args.get('open_source', type=int)
        api_available = request.args.get('api_available', type=int)
        category = request.args.get('category')
        modality = request.args.get('modality')
        
        df = recommender.df.copy()
        
        # Appliquer les filtres
        if open_source is not None:
            df = df[df['open_source'] == open_source]
        if api_available is not None:
            df = df[df['api_available'] == api_available]
        if category:
            df = df[df['category_canonical'].str.lower() == category.lower()]
        if modality:
            df = df[df['modality_canonical'].str.lower() == modality.lower()]
        
        # Convertir en liste de dictionnaires
        tools = []
        for _, tool in df.iterrows():
            tools.append({
                'tool_name': tool['tool_name'],
                'company': tool['company'],
                'category': tool['category_canonical'],
                'modality': tool['modality_canonical'],
                'open_source': bool(tool['open_source']),
                'api_available': bool(tool['api_available']),
                'api_status': tool['api_status'],
                'website': tool['website'],
                'release_year': int(tool['release_year']) if not pd.isna(tool['release_year']) else None
            })
        
        return jsonify({
            'success': True,
            'count': len(tools),
            'tools': tools
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/recommend/<tool_name>', methods=['GET'])
def get_recommendations(tool_name):
    """Obtient des recommandations basées sur un outil"""
    try:
        n = request.args.get('n', default=5, type=int)
        open_source = request.args.get('open_source', type=int)
        api_available = request.args.get('api_available', type=int)
        
        filters = {}
        if open_source is not None:
            filters['open_source'] = open_source
        if api_available is not None:
            filters['api_available'] = api_available
        
        recommendations = recommender.get_recommendations(
            tool_name, 
            n_recommendations=n,
            filters=filters if filters else None
        )
        
        if recommendations is None:
            return jsonify({
                'success': False,
                'error': f'Outil "{tool_name}" non trouvé'
            }), 404
        
        return jsonify({
            'success': True,
            'tool_name': tool_name,
            'count': len(recommendations),
            'recommendations': recommendations
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/category/<category>', methods=['GET'])
def get_by_category(category):
    """Obtient les outils d'une catégorie"""
    try:
        n = request.args.get('n', default=10, type=int)
        open_source = request.args.get('open_source', type=int)
        api_available = request.args.get('api_available', type=int)
        
        filters = {}
        if open_source is not None:
            filters['open_source'] = open_source
        if api_available is not None:
            filters['api_available'] = api_available
        
        results = recommender.get_recommendations_by_category(
            category,
            n_recommendations=n,
            filters=filters if filters else None
        )
        
        return jsonify({
            'success': True,
            'category': category,
            'count': len(results),
            'tools': results
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/search', methods=['GET'])
def search_tools():
    """Recherche d'outils par mots-clés"""
    try:
        query = request.args.get('q', '')
        n = request.args.get('n', default=10, type=int)
        
        if not query:
            return jsonify({
                'success': False,
                'error': 'Paramètre "q" requis'
            }), 400
        
        results = recommender.search_tools(query, n_results=n)
        
        return jsonify({
            'success': True,
            'query': query,
            'count': len(results),
            'results': results
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Retourne toutes les catégories"""
    try:
        categories = recommender.get_all_categories()
        return jsonify({
            'success': True,
            'count': len(categories),
            'categories': categories
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/modalities', methods=['GET'])
def get_modalities():
    """Retourne toutes les modalités"""
    try:
        modalities = recommender.get_all_modalities()
        return jsonify({
            'success': True,
            'count': len(modalities),
            'modalities': modalities
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/stats', methods=['GET'])
def get_statistics():
    """Retourne des statistiques sur le dataset"""
    try:
        stats = recommender.get_statistics()
        return jsonify({
            'success': True,
            'statistics': stats
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    init_recommender()
    port = int(os.getenv('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
else:
    # Initialiser le recommender lors de l'import par Gunicorn
    init_recommender()
