// Configuration de l'API
// En production, utiliser l'URL relative pour passer par Nginx
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

// État global de l'application
let allTools = [];
let allCategories = [];
let allModalities = [];
let currentTools = [];

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

async function initializeApp() {
    try {
        // Charger les statistiques
        await loadStatistics();
        
        // Charger les catégories et modalités
        await loadCategories();
        await loadModalities();
        
        // Charger tous les outils
        await loadAllTools();
        
        // Charger les catégories pour l'onglet
        await loadCategoriesGrid();
        
        // Remplir le select des outils pour les recommandations
        populateToolSelect();
        
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        showError('Erreur de connexion à l\'API. Assurez-vous que le serveur backend est démarré.');
    }
}

function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Recherche
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Filtres
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('modalityFilter').addEventListener('change', applyFilters);
    document.getElementById('openSourceFilter').addEventListener('change', applyFilters);
    document.getElementById('apiFilter').addEventListener('change', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    
    // Recommandations
    document.getElementById('getRecommendations').addEventListener('click', getRecommendations);
    
    // Modal
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target.id === 'toolModal') closeModal();
    });
}

// Gestion des onglets
function switchTab(tabName) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Chargement des statistiques
async function loadStatistics() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const data = await response.json();
        
        if (data.success) {
            const stats = data.statistics;
            document.getElementById('totalTools').textContent = stats.total_tools;
            document.getElementById('totalCompanies').textContent = stats.total_companies;
            document.getElementById('openSourceCount').textContent = stats.open_source_count;
        }
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

// Chargement des catégories
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const data = await response.json();
        
        if (data.success) {
            allCategories = data.categories;
            const select = document.getElementById('categoryFilter');
            
            allCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erreur chargement catégories:', error);
    }
}

// Chargement des modalités
async function loadModalities() {
    try {
        const response = await fetch(`${API_URL}/modalities`);
        const data = await response.json();
        
        if (data.success) {
            allModalities = data.modalities;
            const select = document.getElementById('modalityFilter');
            
            allModalities.forEach(modality => {
                const option = document.createElement('option');
                option.value = modality;
                option.textContent = modality;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erreur chargement modalités:', error);
    }
}

// Chargement de tous les outils
async function loadAllTools() {
    try {
        const response = await fetch(`${API_URL}/tools`);
        const data = await response.json();
        
        if (data.success) {
            allTools = data.tools;
            currentTools = allTools;
            displayTools(currentTools);
        }
    } catch (error) {
        console.error('Erreur chargement outils:', error);
        showError('Impossible de charger les outils');
    }
}

// Affichage des outils
function displayTools(tools) {
    const grid = document.getElementById('toolsGrid');
    
    if (tools.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Aucun outil trouvé</h3>
                <p>Essayez de modifier vos filtres ou votre recherche</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = tools.map(tool => createToolCard(tool)).join('');
    
    // Ajouter les événements click
    grid.querySelectorAll('.tool-card').forEach((card, index) => {
        card.addEventListener('click', () => showToolDetails(tools[index]));
    });
}

// Création d'une carte d'outil
function createToolCard(tool, showScore = false) {
    const badges = [];
    
    if (tool.open_source) {
        badges.push('<span class="badge open-source">Open Source</span>');
    }
    
    if (tool.api_available) {
        badges.push('<span class="badge api">API</span>');
    }
    
    if (showScore && tool.similarity_score !== undefined) {
        const scorePercent = (tool.similarity_score * 100).toFixed(0);
        badges.push(`<span class="badge score">${scorePercent}% match</span>`);
    }
    
    return `
        <div class="tool-card">
            <h3>${tool.tool_name}</h3>
            <div class="company">par ${tool.company}</div>
            <div class="category">${tool.category}</div>
            <div class="modality">${tool.modality}</div>
            <div class="badges">
                ${badges.join('')}
            </div>
        </div>
    `;
}

// Affichage des détails d'un outil
function showToolDetails(tool) {
    const modal = document.getElementById('toolModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <h2>${tool.tool_name}</h2>
        <p><strong>Entreprise:</strong> ${tool.company}</p>
        <p><strong>Catégorie:</strong> ${tool.category}</p>
        <p><strong>Modalité:</strong> ${tool.modality}</p>
        <p><strong>Open Source:</strong> ${tool.open_source ? '✅ Oui' : '❌ Non'}</p>
        <p><strong>API disponible:</strong> ${tool.api_available ? '✅ Oui' : '❌ Non'}</p>
        ${tool.release_year ? `<p><strong>Année de sortie:</strong> ${tool.release_year}</p>` : ''}
        <p><strong>Site web:</strong> <a href="${tool.website}" target="_blank">${tool.website}</a></p>
        <button class="btn btn-primary" onclick="window.open('${tool.website}', '_blank')">Visiter le site</button>
    `;
    
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('toolModal').style.display = 'none';
}

// Recherche
async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        currentTools = allTools;
        displayTools(currentTools);
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success) {
            currentTools = data.results;
            displayTools(currentTools);
        }
    } catch (error) {
        console.error('Erreur recherche:', error);
        showError('Erreur lors de la recherche');
    }
}

// Application des filtres
async function applyFilters() {
    const category = document.getElementById('categoryFilter').value;
    const modality = document.getElementById('modalityFilter').value;
    const openSource = document.getElementById('openSourceFilter').checked;
    const apiAvailable = document.getElementById('apiFilter').checked;
    
    // Construire l'URL avec les filtres
    let url = `${API_URL}/tools?`;
    const params = [];
    
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (modality) params.push(`modality=${encodeURIComponent(modality)}`);
    if (openSource) params.push('open_source=1');
    if (apiAvailable) params.push('api_available=1');
    
    url += params.join('&');
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            currentTools = data.tools;
            displayTools(currentTools);
        }
    } catch (error) {
        console.error('Erreur filtres:', error);
        showError('Erreur lors de l\'application des filtres');
    }
}

// Réinitialisation des filtres
function clearFilters() {
    document.getElementById('categoryFilter').value = '';
    document.getElementById('modalityFilter').value = '';
    document.getElementById('openSourceFilter').checked = false;
    document.getElementById('apiFilter').checked = false;
    document.getElementById('searchInput').value = '';
    
    currentTools = allTools;
    displayTools(currentTools);
}

// Remplir le select des outils
function populateToolSelect() {
    const select = document.getElementById('toolSelect');
    
    // Trier les outils par nom
    const sortedTools = [...allTools].sort((a, b) => 
        a.tool_name.localeCompare(b.tool_name)
    );
    
    sortedTools.forEach(tool => {
        const option = document.createElement('option');
        option.value = tool.tool_name;
        option.textContent = `${tool.tool_name} (${tool.company})`;
        select.appendChild(option);
    });
}

// Obtenir des recommandations
async function getRecommendations() {
    const toolName = document.getElementById('toolSelect').value;
    
    if (!toolName) {
        alert('Veuillez sélectionner un outil');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/recommend/${encodeURIComponent(toolName)}?n=6`);
        const data = await response.json();
        
        if (data.success) {
            const grid = document.getElementById('recommendationsResult');
            
            if (data.recommendations.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <h3>Aucune recommandation trouvée</h3>
                    </div>
                `;
                return;
            }
            
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; margin-bottom: 1rem;">
                    <h3>Outils similaires à ${toolName}</h3>
                </div>
                ${data.recommendations.map(tool => createToolCard(tool, true)).join('')}
            `;
            
            // Ajouter les événements click
            grid.querySelectorAll('.tool-card').forEach((card, index) => {
                card.addEventListener('click', () => showToolDetails(data.recommendations[index]));
            });
        } else {
            showError(data.error);
        }
    } catch (error) {
        console.error('Erreur recommandations:', error);
        showError('Erreur lors de la récupération des recommandations');
    }
}

// Chargement de la grille des catégories
async function loadCategoriesGrid() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const data = await response.json();
        
        if (data.success) {
            const categories = data.statistics.categories;
            const grid = document.getElementById('categoriesGrid');
            
            const colors = [
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            ];
            
            grid.innerHTML = Object.entries(categories)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count], index) => `
                    <div class="category-card" style="background: ${colors[index % colors.length]}" 
                         onclick="filterByCategory('${category}')">
                        <h3>${category}</h3>
                        <div class="count">${count}</div>
                        <p>outils</p>
                    </div>
                `).join('');
        }
    } catch (error) {
        console.error('Erreur chargement catégories grid:', error);
    }
}

// Filtrer par catégorie (depuis l'onglet catégories)
function filterByCategory(category) {
    document.getElementById('categoryFilter').value = category;
    switchTab('explore');
    applyFilters();
}

// Affichage des erreurs
function showError(message) {
    alert(message);
}
