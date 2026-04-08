// RAWG API configuration
const API_KEY = "0a37318356c449c2a8dc302b115fdb94"; // Public / Mock Key placeholder
const BASE_URL = "https://api.rawg.io/api";

// Application State
const state = {
    games: [],
    wishlist: JSON.parse(localStorage.getItem('rgv_wishlist')) || [],
    compareMode: false,
    compareSelection: [],
    currentView: 'home', // 'home' | 'wishlist'
    filters: {
        search: '',
        platform: '', // parent_platforms id
        page: 1
    },
    isLoading: false
};

// DOM Elements
const els = {
    grid: document.getElementById('gameGrid'),
    searchInput: document.getElementById('searchInput'),
    platformFilters: document.getElementById('platformFilters'),
    sectionTitle: document.getElementById('sectionTitle'),
    viewWishlistBtn: document.getElementById('viewWishlistBtn'),
    toggleCompareBtn: document.getElementById('toggleCompareBtn'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    detailsModal: document.getElementById('detailsModal'),
    detailsModalBody: document.getElementById('detailsModalBody'),
    closeDetailsBtn: document.getElementById('closeDetailsBtn'),
    compareModal: document.getElementById('compareModal'),
    compareGrid: document.getElementById('compareGrid'),
    closeCompareBtn: document.getElementById('closeCompareBtn'),
};

// --- API FUNCTIONS ---

async function fetchGames(reset = true) {
    if (state.isLoading) return;
    
    state.isLoading = true;
    if (reset) {
        state.filters.page = 1;
        els.grid.innerHTML = '';
    }
    
    els.loadingIndicator.classList.remove('hidden');
    els.loadMoreBtn.classList.add('hidden');

    try {
        let url = `${BASE_URL}/games?key=${API_KEY}&page=${state.filters.page}&page_size=20`;
        
        if (state.filters.search) {
            url += `&search=${encodeURIComponent(state.filters.search)}`;
        }
        if (state.filters.platform) {
            url += `&parent_platforms=${state.filters.platform}`;
        }
        if (!state.filters.search && !state.filters.platform) {
            // Default to popular games
            url += `&ordering=-added`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (reset) {
            state.games = data.results;
        } else {
            state.games = [...state.games, ...data.results];
        }

        renderGames(data.results);

        if (data.next) {
            els.loadMoreBtn.classList.remove('hidden');
        }

    } catch (error) {
        console.error("Error fetching games:", error);
        els.grid.innerHTML = `<div class="error">Failed to load games. Make sure the API key is valid.</div>`;
    } finally {
        state.isLoading = false;
        els.loadingIndicator.classList.add('hidden');
    }
}

async function fetchGameDetails(id) {
    try {
        const response = await fetch(`${BASE_URL}/games/${id}?key=${API_KEY}`);
        if (!response.ok) throw new Error('Details fetch failed');
        return await response.json();
    } catch (error) {
        console.error("Error details:", error);
        return null;
    }
}

// --- RENDER FUNCTIONS ---

function renderGames(games) {
    if (games.length === 0 && state.filters.page === 1) {
        els.grid.innerHTML = '<p>No games found.</p>';
        return;
    }

    const html = games.map(game => createGameCard(game)).join('');
    els.grid.insertAdjacentHTML('beforeend', html);
    
    // Add event listeners to new cards
    attachCardEvents();
}

function createGameCard(game) {
    const isWishlisted = state.wishlist.some(w => w.id === game.id);
    const platforms = game.parent_platforms ? game.parent_platforms.map(p => p.platform.name).slice(0, 3).join(', ') : 'Unknown';
    const isSelectedForCompare = state.compareSelection.some(c => c.id === game.id);

    return `
        <article class="game-card ${isSelectedForCompare ? 'selected-for-compare' : ''}" data-id="${game.id}">
            <input type="checkbox" class="compare-checkbox" ${isSelectedForCompare ? 'checked' : ''}>
            <div class="card-actions">
                <button class="icon-btn wishlist-toggle ${isWishlisted ? 'active' : ''}" title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                    ❤
                </button>
            </div>
            <div class="game-image-container">
                <img src="${game.background_image || 'https://via.placeholder.com/400x225?text=No+Image'}" alt="${game.name}" class="game-image" loading="lazy">
            </div>
            <div class="game-info">
                <h3 class="game-title" title="${game.name}">${game.name}</h3>
                <div class="game-meta">
                    <div class="platforms">
                        <span>${platforms}</span>
                    </div>
                    ${game.metacritic ? `<div class="rating">${game.metacritic}</div>` : ''}
                </div>
            </div>
        </article>
    `;
}

// --- EVENT HANDLERS ---

function attachCardEvents() {
    const cards = els.grid.querySelectorAll('.game-card');
    
    cards.forEach(card => {
        // Remove old listeners to avoid duplicates on load more
        card.replaceWith(card.cloneNode(true));
    });

    const newCards = els.grid.querySelectorAll('.game-card');
    newCards.forEach(card => {
        const id = parseInt(card.dataset.id);
        
        // Card click for details
        card.addEventListener('click', (e) => {
            // Ignore if clicking checkbox or action button
            if (e.target.closest('.card-actions') || e.target.classList.contains('compare-checkbox')) return;
            
            if (state.compareMode) {
                toggleCompareSelection(id, card);
            } else {
                openGameDetails(id);
            }
        });

        // Wishlist btn
        const wishlistBtn = card.querySelector('.wishlist-toggle');
        wishlistBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWishlist(id, card);
        });

        // Checkbox click
        const checkbox = card.querySelector('.compare-checkbox');
        checkbox.addEventListener('change', () => {
            toggleCompareSelection(id, card);
        });
    });
}

// --- LOGIC ---

// Debounce Function
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

const handleSearch = debounce((query) => {
    state.filters.search = query;
    state.currentView = 'home';
    updateSectionTitle();
    fetchGames(true);
}, 500);

els.searchInput.addEventListener('input', (e) => {
    handleSearch(e.target.value.trim());
});

// Sidebar Filters
els.platformFilters.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const btns = els.platformFilters.querySelectorAll('.filter-btn');
        btns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        state.filters.platform = e.target.dataset.platform;
        state.currentView = 'home';
        updateSectionTitle();
        fetchGames(true);
    }
});

// Load More
els.loadMoreBtn.addEventListener('click', () => {
    state.filters.page += 1;
    fetchGames(false);
});

// Wishlist Logic
function toggleWishlist(id, cardElement) {
    const game = state.games.find(g => g.id === id) || state.wishlist.find(g => g.id === id);
    if (!game) return;

    const index = state.wishlist.findIndex(w => w.id === id);
    const btn = cardElement.querySelector('.wishlist-toggle');

    if (index > -1) {
        state.wishlist.splice(index, 1);
        btn.classList.remove('active');
        if (state.currentView === 'wishlist') {
            cardElement.remove();
        }
    } else {
        state.wishlist.push(game);
        btn.classList.add('active');
    }

    localStorage.setItem('rgv_wishlist', JSON.stringify(state.wishlist));
}

els.viewWishlistBtn.addEventListener('click', () => {
    state.currentView = 'wishlist';
    updateSectionTitle();
    els.grid.innerHTML = '';
    
    if (state.wishlist.length === 0) {
        els.grid.innerHTML = '<p>Your wishlist is empty.</p>';
    } else {
        // We use state.wishlist directly for rendering
        state.games = [...state.wishlist]; // temp replace for interaction logic
        renderGames(state.wishlist);
    }
    
    els.loadMoreBtn.classList.add('hidden');
});

function updateSectionTitle() {
    if (state.currentView === 'wishlist') {
        els.sectionTitle.textContent = "My Wishlist";
    } else if (state.filters.search) {
        els.sectionTitle.textContent = `Search Results for "${state.filters.search}"`;
    } else if (state.filters.platform) {
        const activeBtn = document.querySelector('.filter-btn.active');
        els.sectionTitle.textContent = `Games for ${activeBtn.textContent}`;
    } else {
        els.sectionTitle.textContent = "Trending Games";
    }
}

// Modal Logic
async function openGameDetails(id) {
    els.detailsModal.showModal();
    els.detailsModalBody.innerHTML = '<div class="spinner"></div><p>Loading details...</p>';
    
    const details = await fetchGameDetails(id);
    
    if (!details) {
        els.detailsModalBody.innerHTML = '<p>Error loading details.</p>';
        return;
    }

    const { name, background_image, description_raw, released, metacritic, developers, genres } = details;
    
    els.detailsModalBody.innerHTML = `
        <div class="details-header">
            <img src="${background_image}" alt="${name}" class="details-image">
            <div class="details-info">
                <h2>${name}</h2>
                <div class="details-meta">
                    <p><strong>Released:</strong> ${released || 'N/A'}</p>
                    <p><strong>Metacritic:</strong> <span class="rating">${metacritic || 'N/A'}</span></p>
                    <p><strong>Developer:</strong> ${developers?.map(d => d.name).join(', ') || 'Unknown'}</p>
                    <p><strong>Genres:</strong> ${genres?.map(g => g.name).join(', ') || 'Unknown'}</p>
                </div>
                <div class="details-desc">
                    <p>${description_raw || 'No description available.'}</p>
                </div>
            </div>
        </div>
    `;
}

els.closeDetailsBtn.addEventListener('click', () => els.detailsModal.close());
els.detailsModal.addEventListener('click', (e) => {
    if (e.target === els.detailsModal) els.detailsModal.close();
});

// Compare Logic
els.toggleCompareBtn.addEventListener('click', () => {
    state.compareMode = !state.compareMode;
    document.body.classList.toggle('compare-active', state.compareMode);
    
    if (state.compareMode) {
        els.toggleCompareBtn.textContent = "Compare Mode: ON";
        els.toggleCompareBtn.classList.add('bg-accent');
        alert("Select two games to compare.");
    } else {
        els.toggleCompareBtn.textContent = "Compare Mode: OFF";
        els.toggleCompareBtn.classList.remove('bg-accent');
        state.compareSelection = [];
        document.querySelectorAll('.game-card').forEach(card => {
            card.classList.remove('selected-for-compare');
            card.querySelector('.compare-checkbox').checked = false;
        });
    }
});

async function toggleCompareSelection(id, cardElement) {
    const index = state.compareSelection.findIndex(c => c.id === id);
    const checkbox = cardElement.querySelector('.compare-checkbox');

    if (index > -1) {
        state.compareSelection.splice(index, 1);
        cardElement.classList.remove('selected-for-compare');
        checkbox.checked = false;
    } else {
        if (state.compareSelection.length >= 2) {
            alert("Already selected 2 games. Unselect one first.");
            checkbox.checked = false;
            return;
        }
        
        let game = state.games.find(g => g.id === id);
        state.compareSelection.push(game);
        cardElement.classList.add('selected-for-compare');
        checkbox.checked = true;

        if (state.compareSelection.length === 2) {
            await showCompareModal();
        }
    }
}

async function showCompareModal() {
    els.compareModal.showModal();
    els.compareGrid.innerHTML = `
        <div style="grid-column: span 2; text-align: center;">
            <div class="spinner"></div><p>Fetching deep stats...</p>
        </div>
    `;
    
    const [game1Details, game2Details] = await Promise.all([
        fetchGameDetails(state.compareSelection[0].id),
        fetchGameDetails(state.compareSelection[1].id)
    ]);

    if (!game1Details || !game2Details) {
        els.compareGrid.innerHTML = `<p>Error loading comparison stats.</p>`;
        return;
    }

    els.compareGrid.innerHTML = `
        ${createCompareColumn(game1Details)}
        ${createCompareColumn(game2Details)}
    `;
}

function createCompareColumn(game) {
    const platforms = game.platforms?.map(p => p.platform.name).join(', ') || 'N/A';
    return `
        <div class="compare-col">
            <img src="${game.background_image}" alt="${game.name}">
            <h3>${game.name}</h3>
            <div class="stat-row"><span>Released</span> <strong>${game.released || 'N/A'}</strong></div>
            <div class="stat-row"><span>Metacritic</span> <strong class="rating">${game.metacritic || 'N/A'}</strong></div>
            <div class="stat-row"><span>Playtime</span> <strong>${game.playtime ? game.playtime + ' h' : 'N/A'}</strong></div>
            <div class="stat-row"><span>Genres</span> <strong>${game.genres?.map(g => g.name).join(', ') || 'N/A'}</strong></div>
            <div class="stat-row" style="flex-direction: column; align-items: flex-start;">
                <span style="margin-bottom: 0.5rem; text-decoration: underline;">Platforms</span>
                <span style="font-size: 0.85rem; color: var(--text-muted);">${platforms}</span>
            </div>
        </div>
    `;
}

els.closeCompareBtn.addEventListener('click', () => {
    els.compareModal.close();
    // Optional: Uncheck the selections when Modal closes?
    // Let's keep them checked in case they want to open it again without re-selecting.
});

els.compareModal.addEventListener('click', (e) => {
    if (e.target === els.compareModal) els.compareModal.close();
});


// Initialization Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchGames(true);
});
