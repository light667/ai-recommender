import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
import pickle
import os


class AIToolRecommender:
    """Système de recommandation d'outils IA basé sur le contenu"""
    
    def __init__(self, data_path):
        self.data_path = data_path
        self.df = None
        self.similarity_matrix = None
        self.feature_matrix = None
        self.tfidf_vectorizer = None
        
    def load_data(self):
        """Charge les données depuis le CSV"""
        self.df = pd.read_csv(self.data_path)
        print(f"✓ Chargé {len(self.df)} outils d'IA")
        return self.df
    
    def preprocess_data(self):
        """Prétraite les données pour le modèle"""
        # Créer des features textuelles combinées
        self.df['text_features'] = (
            self.df['category_canonical'].fillna('') + ' ' +
            self.df['modality_canonical'].fillna('') + ' ' +
            self.df['company'].fillna('')
        )
        
        # Créer des features binaires
        binary_features = ['open_source', 'api_available', 
                          'mod_text', 'mod_image', 'mod_video', 
                          'mod_audio', 'mod_code', 'mod_design', 
                          'mod_infra', 'mod_productivity', 'mod_safety', 
                          'mod_multimodal']
        
        for feature in binary_features:
            self.df[feature] = self.df[feature].fillna(0).astype(int)
        
        print("✓ Données prétraitées")
        
    def train_model(self):
        """Entraîne le modèle de recommandation"""
        # TF-IDF pour les features textuelles
        self.tfidf_vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
        tfidf_matrix = self.tfidf_vectorizer.fit_transform(self.df['text_features'])
        
        # Features numériques
        binary_cols = ['open_source', 'api_available', 
                      'mod_text', 'mod_image', 'mod_video', 
                      'mod_audio', 'mod_code', 'mod_design', 
                      'mod_infra', 'mod_productivity', 'mod_safety', 
                      'mod_multimodal']
        
        numeric_features = self.df[binary_cols].values
        
        # Normaliser les features numériques
        scaler = MinMaxScaler()
        numeric_features_scaled = scaler.fit_transform(numeric_features)
        
        # Combiner TF-IDF et features numériques
        self.feature_matrix = np.hstack([
            tfidf_matrix.toarray(),
            numeric_features_scaled * 2  # Donner plus de poids aux features binaires
        ])
        
        # Calculer la matrice de similarité cosinus
        self.similarity_matrix = cosine_similarity(self.feature_matrix)
        
        print("✓ Modèle entraîné avec succès")
        print(f"  - Matrice de similarité: {self.similarity_matrix.shape}")
        
    def get_recommendations(self, tool_name, n_recommendations=5, filters=None):
        """
        Obtient des recommandations basées sur un outil donné
        
        Args:
            tool_name: Nom de l'outil de référence
            n_recommendations: Nombre de recommandations à retourner
            filters: Dictionnaire de filtres (ex: {'open_source': 1, 'api_available': 1})
        """
        # Trouver l'index de l'outil
        tool_idx = self.df[self.df['tool_name'].str.lower() == tool_name.lower()].index
        
        if len(tool_idx) == 0:
            return None
        
        tool_idx = tool_idx[0]
        
        # Obtenir les scores de similarité
        similarity_scores = list(enumerate(self.similarity_matrix[tool_idx]))
        
        # Trier par similarité décroissante
        similarity_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)
        
        # Appliquer les filtres si fournis
        recommendations = []
        for idx, score in similarity_scores[1:]:  # Exclure l'outil lui-même
            tool = self.df.iloc[idx]
            
            # Vérifier les filtres
            if filters:
                passes_filters = all(
                    tool[key] == value for key, value in filters.items()
                    if key in tool.index
                )
                if not passes_filters:
                    continue
            
            recommendations.append({
                'tool_name': tool['tool_name'],
                'company': tool['company'],
                'category': tool['category_canonical'],
                'modality': tool['modality_canonical'],
                'open_source': bool(tool['open_source']),
                'api_available': bool(tool['api_available']),
                'website': tool['website'],
                'similarity_score': float(score)
            })
            
            if len(recommendations) >= n_recommendations:
                break
        
        return recommendations
    
    def get_recommendations_by_category(self, category, n_recommendations=10, filters=None):
        """
        Obtient les meilleurs outils d'une catégorie
        
        Args:
            category: Catégorie recherchée
            n_recommendations: Nombre de recommandations
            filters: Filtres additionnels
        """
        filtered_df = self.df[self.df['category_canonical'].str.lower() == category.lower()]
        
        if filters:
            for key, value in filters.items():
                if key in filtered_df.columns:
                    filtered_df = filtered_df[filtered_df[key] == value]
        
        # Trier par années depuis release (les plus récents en premier)
        filtered_df = filtered_df.sort_values('years_since_release', ascending=True)
        
        results = []
        for _, tool in filtered_df.head(n_recommendations).iterrows():
            results.append({
                'tool_name': tool['tool_name'],
                'company': tool['company'],
                'category': tool['category_canonical'],
                'modality': tool['modality_canonical'],
                'open_source': bool(tool['open_source']),
                'api_available': bool(tool['api_available']),
                'website': tool['website'],
                'release_year': int(tool['release_year']) if pd.notna(tool['release_year']) else None
            })
        
        return results
    
    def search_tools(self, query, n_results=10):
        """
        Recherche d'outils par mots-clés
        
        Args:
            query: Requête de recherche
            n_results: Nombre de résultats
        """
        query_lower = query.lower()
        
        # Rechercher dans plusieurs colonnes
        mask = (
            self.df['tool_name'].str.lower().str.contains(query_lower, na=False) |
            self.df['company'].str.lower().str.contains(query_lower, na=False) |
            self.df['category_canonical'].str.lower().str.contains(query_lower, na=False) |
            self.df['modality_canonical'].str.lower().str.contains(query_lower, na=False)
        )
        
        results_df = self.df[mask].head(n_results)
        
        results = []
        for _, tool in results_df.iterrows():
            results.append({
                'tool_name': tool['tool_name'],
                'company': tool['company'],
                'category': tool['category_canonical'],
                'modality': tool['modality_canonical'],
                'open_source': bool(tool['open_source']),
                'api_available': bool(tool['api_available']),
                'website': tool['website']
            })
        
        return results
    
    def get_all_categories(self):
        """Retourne toutes les catégories uniques"""
        return sorted(self.df['category_canonical'].dropna().unique().tolist())
    
    def get_all_modalities(self):
        """Retourne toutes les modalités uniques"""
        return sorted(self.df['modality_canonical'].dropna().unique().tolist())
    
    def get_statistics(self):
        """Retourne des statistiques sur le dataset"""
        return {
            'total_tools': int(len(self.df)),
            'total_companies': int(self.df['company'].nunique()),
            'open_source_count': int(self.df['open_source'].sum()),
            'api_available_count': int(self.df['api_available'].sum()),
            'categories': self.df['category_canonical'].value_counts().to_dict(),
            'modalities': self.df['modality_canonical'].value_counts().to_dict(),
            'releases_by_year': self.df['release_year'].value_counts().sort_index().to_dict()
        }
    
    def save_model(self, model_dir='../models'):
        """Sauvegarde le modèle entraîné"""
        os.makedirs(model_dir, exist_ok=True)
        
        model_data = {
            'similarity_matrix': self.similarity_matrix,
            'feature_matrix': self.feature_matrix,
            'tfidf_vectorizer': self.tfidf_vectorizer,
            'df': self.df
        }
        
        with open(f'{model_dir}/recommender_model.pkl', 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"✓ Modèle sauvegardé dans {model_dir}/recommender_model.pkl")
    
    def load_model(self, model_dir='../models'):
        """Charge un modèle pré-entraîné"""
        with open(f'{model_dir}/recommender_model.pkl', 'rb') as f:
            model_data = pickle.load(f)
        
        self.similarity_matrix = model_data['similarity_matrix']
        self.feature_matrix = model_data['feature_matrix']
        self.tfidf_vectorizer = model_data['tfidf_vectorizer']
        self.df = model_data['df']
        
        print(f"✓ Modèle chargé depuis {model_dir}/recommender_model.pkl")


def train_and_save():
    """Fonction helper pour entraîner et sauvegarder le modèle"""
    print("🚀 Entraînement du modèle de recommandation...")
    
    recommender = AIToolRecommender('../data/Generative AI Tools - Platforms 2025.csv')
    recommender.load_data()
    recommender.preprocess_data()
    recommender.train_model()
    recommender.save_model()
    
    print("\n✅ Entraînement terminé !")
    
    # Test rapide
    print("\n🧪 Test du modèle:")
    recs = recommender.get_recommendations('ChatGPT', n_recommendations=3)
    print(f"\n📌 Outils similaires à ChatGPT:")
    for i, rec in enumerate(recs, 1):
        print(f"  {i}. {rec['tool_name']} ({rec['company']}) - Score: {rec['similarity_score']:.3f}")


if __name__ == "__main__":
    train_and_save()
