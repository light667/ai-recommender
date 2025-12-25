// Configuration de l'API
// URL du backend déployé sur Render
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : 'https://ai-recommender-b0ha.onrender.com/api';

// État global de l'application
let allTools = [];
let allCategories = [];
let allModalities = [];
let currentTools = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let compareList = JSON.parse(localStorage.getItem('compareList')) || [];

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

async function initializeApp() {
    try {
        // Détecter le cold start (backend en veille)
        showLoadingMessage();
        const startTime = Date.now();
        
        // Charger les statistiques
        await loadStatistics();
        
        const loadTime = Date.now() - startTime;
        if (loadTime > 5000) {
            // Cold start détecté (plus de 5 secondes)
            console.log('Cold start détecté:', loadTime + 'ms');
        }
        
        // Charger les catégories et modalités
        await loadCategories();
        await loadModalities();
        
        // Charger tous les outils
        await loadAllTools();
        
        // Charger les catégories pour l'onglet
        await loadCategoriesGrid();
        
        // Remplir le select des outils pour les recommandations
        populateToolSelect();
        
        hideLoadingMessage();
        
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        hideLoadingMessage();
        showError('Erreur de connexion à l\'API. Assurez-vous que le serveur backend est démarré.');
    }
}

function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
            if (btn.dataset.tab === 'favorites') displayFavorites();
            if (btn.dataset.tab === 'compare') updateCompareView();
        });
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
    
    // Tri
    document.getElementById('sortFilter').addEventListener('change', (e) => sortTools(e.target.value));
    
    // Outil aléatoire
    document.getElementById('randomTool').addEventListener('click', showRandomTool);
    
    // Comparateur
    document.getElementById('clearComparison').addEventListener('click', clearComparison);
    
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
    
    const isFavorite = favorites.includes(tool.tool_name);
    const isInCompare = compareList.includes(tool.tool_name);
    
    return `
        <div class="tool-card">
            <div class="card-actions">
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                        data-tool="${tool.tool_name}"
                        onclick="toggleFavorite('${tool.tool_name}', event)"
                        title="Ajouter aux favoris">
                    ⭐
                </button>
                <button class="compare-btn ${isInCompare ? 'active' : ''}" 
                        data-tool="${tool.tool_name}"
                        onclick="toggleCompare('${tool.tool_name}', event)"
                        title="Ajouter à la comparaison">
                    📊
                </button>
            </div>
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

// Message de chargement pour cold start
function showLoadingMessage() {
    const existingMsg = document.getElementById('coldStartMessage');
    if (existingMsg) return;
    
    const message = document.createElement('div');
    message.id = 'coldStartMessage';
    message.className = 'cold-start-message';
    message.innerHTML = `
        <div class="loading-spinner"></div>
        <h3>Chargement en cours...</h3>
        <p>Le serveur se réveille (première visite), merci de patienter ~30 secondes ⏱️</p>
        <div class="loading-bar"><div class="loading-progress"></div></div>
    `;
    document.body.appendChild(message);
    
    // Masquer après 3 secondes si chargement rapide
    setTimeout(() => {
        const msg = document.getElementById('coldStartMessage');
        if (msg && !msg.classList.contains('loading')) {
            msg.remove();
        }
    }, 3000);
}

function hideLoadingMessage() {
    const message = document.getElementById('coldStartMessage');
    if (message) {
        message.style.opacity = '0';
        setTimeout(() => message.remove(), 300);
    }
}

// ========== NOUVELLES FONCTIONNALITÉS ==========

// 1. OUTIL ALÉATOIRE
function showRandomTool() {
    if (currentTools.length === 0) return;
    const randomIndex = Math.floor(Math.random() * currentTools.length);
    const randomTool = currentTools[randomIndex];
    showToolDetails(randomTool);
}

// 3. SYSTÈME DE FAVORIS
function toggleFavorite(toolName, event) {
    if (event) {
        event.stopPropagation();
    }
    
    const index = favorites.indexOf(toolName);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(toolName);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Rafraîchir l'affichage si on est sur l'onglet favoris
    if (document.getElementById('favoritesTab').classList.contains('active')) {
        displayFavorites();
    }
    
    // Mettre à jour les icônes d'étoiles
    updateFavoriteIcons();
}

function displayFavorites() {
    const grid = document.getElementById('favoritesGrid');
    const favoriteTools = allTools.filter(tool => favorites.includes(tool.tool_name));
    
    if (favoriteTools.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Aucun favori</h3>
                <p>Cliquez sur l'étoile d'un outil pour l'ajouter à vos favoris</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = favoriteTools.map(tool => createToolCard(tool)).join('');
    
    grid.querySelectorAll('.tool-card').forEach((card, index) => {
        card.addEventListener('click', () => showToolDetails(favoriteTools[index]));
    });
}

function updateFavoriteIcons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const toolName = btn.dataset.tool;
        btn.classList.toggle('active', favorites.includes(toolName));
    });
}

// 4. COMPARATEUR D'OUTILS
function toggleCompare(toolName, event) {
    if (event) {
        event.stopPropagation();
    }
    
    const index = compareList.indexOf(toolName);
    if (index > -1) {
        compareList.splice(index, 1);
    } else {
        if (compareList.length >= 3) {
            alert('Vous pouvez comparer maximum 3 outils');
            return;
        }
        compareList.push(toolName);
    }
    
    localStorage.setItem('compareList', JSON.stringify(compareList));
    updateCompareView();
    updateCompareIcons();
}

function updateCompareView() {
    const selectedTools = document.getElementById('selectedTools');
    const compareTable = document.getElementById('comparisonTable');
    
    if (compareList.length === 0) {
        selectedTools.innerHTML = '<p>Aucun outil sélectionné</p>';
        compareTable.innerHTML = '';
        return;
    }
    
    const tools = allTools.filter(t => compareList.includes(t.tool_name));
    
    selectedTools.innerHTML = tools.map(tool => `
        <div class="compare-chip">
            ${tool.tool_name}
            <button onclick="toggleCompare('${tool.tool_name}')" class="remove-btn">×</button>
        </div>
    `).join('');
    
    if (tools.length >= 2) {
        compareTable.innerHTML = generateComparisonTable(tools);
    }
}

function generateComparisonTable(tools) {
    return `
        <table class="comparison">
            <thead>
                <tr>
                    <th>Critère</th>
                    ${tools.map(t => `<th>${t.tool_name}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Entreprise</strong></td>
                    ${tools.map(t => `<td>${t.company}</td>`).join('')}
                </tr>
                <tr>
                    <td><strong>Catégorie</strong></td>
                    ${tools.map(t => `<td>${t.category}</td>`).join('')}
                </tr>
                <tr>
                    <td><strong>Modalité</strong></td>
                    ${tools.map(t => `<td>${t.modality}</td>`).join('')}
                </tr>
                <tr>
                    <td><strong>Open Source</strong></td>
                    ${tools.map(t => `<td>${t.open_source ? '✅ Oui' : '❌ Non'}</td>`).join('')}
                </tr>
                <tr>
                    <td><strong>API Disponible</strong></td>
                    ${tools.map(t => `<td>${t.api_available ? '✅ Oui (' + t.api_status + ')' : '❌ Non'}</td>`).join('')}
                </tr>
                <tr>
                    <td><strong>Année de sortie</strong></td>
                    ${tools.map(t => `<td>${t.release_year || 'N/A'}</td>`).join('')}
                </tr>
                <tr>
                    <td><strong>Site web</strong></td>
                    ${tools.map(t => `<td><a href="${t.website}" target="_blank" class="btn btn-sm">Visiter</a></td>`).join('')}
                </tr>
            </tbody>
        </table>
    `;
}

function clearComparison() {
    compareList = [];
    localStorage.setItem('compareList', JSON.stringify(compareList));
    updateCompareView();
    updateCompareIcons();
}

function updateCompareIcons() {
    document.querySelectorAll('.compare-btn').forEach(btn => {
        const toolName = btn.dataset.tool;
        btn.classList.toggle('active', compareList.includes(toolName));
    });
}

// 5. TRI ET FILTRES AVANCÉS
function sortTools(criteria) {
    let sorted = [...currentTools];
    
    switch(criteria) {
        case 'name-asc':
            sorted.sort((a, b) => a.tool_name.localeCompare(b.tool_name));
            break;
        case 'name-desc':
            sorted.sort((a, b) => b.tool_name.localeCompare(a.tool_name));
            break;
        case 'year-desc':
            sorted.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
            break;
        case 'year-asc':
            sorted.sort((a, b) => (a.release_year || 9999) - (b.release_year || 9999));
            break;
    }
    
    currentTools = sorted;
    displayTools(currentTools);
}
