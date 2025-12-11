// ============================================
// PUBLIC WORKS PAGE - DISPLAY PORTFOLIO
// ============================================

// Initialize Firestore
const db = firebase.firestore();

let currentFilter = 'all';
let allWorks = [];

// ============================================
// LOAD PORTFOLIO ITEMS
// ============================================

async function loadWorks(filter = 'all') {
    const worksGrid = document.getElementById('worksGrid');
    worksGrid.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading portfolio...</p></div>';
    
    try {
        let query = db.collection('portfolio').orderBy('uploadedAt', 'desc');
        
        // Apply filter
        if (filter !== 'all') {
            query = query.where('category', '==', filter);
        }
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            worksGrid.innerHTML = `
                <div class="loading-state">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📁</div>
                    <p>No works found${filter !== 'all' ? ' in this category' : ''}.</p>
                    <p style="font-size: 0.8rem; margin-top: 1rem;">Check back soon for new projects!</p>
                </div>
            `;
            return;
        }
        
        worksGrid.innerHTML = '';
        allWorks = [];
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            allWorks.push({ id: doc.id, ...data });
            const workCard = createWorkCard(doc.id, data);
            worksGrid.appendChild(workCard);
        });
        
        // Re-initialize scroll animations
        if (typeof observer !== 'undefined') {
            document.querySelectorAll('.work-card').forEach((el) => {
                observer.observe(el);
            });
        }
        
        // Update cursor targets
        if (typeof updateCursorTargets === 'function') {
            updateCursorTargets();
        }
        
    } catch (error) {
        console.error('Error loading works:', error);
        worksGrid.innerHTML = `
            <div class="loading-state">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <p>Error loading portfolio</p>
                <p style="font-size: 0.8rem; margin-top: 1rem;">Please try again later</p>
            </div>
        `;
    }
}

// ============================================
// CREATE WORK CARD ELEMENT
// ============================================

function createWorkCard(id, data) {
    const card = document.createElement('div');
    card.className = 'work-card scroll-trigger hover-target';
    card.setAttribute('data-work-id', id);
    card.onclick = () => openWorkDetail(id);
    
    const img = document.createElement('img');
    img.src = data.imageUrl;
    img.alt = data.title;
    img.loading = 'lazy';
    
    // Add title overlay on hover
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
        padding: 2rem 1.5rem 1.5rem;
        transform: translateY(100%);
        transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    `;
    
    overlay.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-pink); margin-bottom: 0.3rem; text-transform: uppercase;">
            ${data.category.replace('-', ' ')}
        </div>
        <div style="font-family: var(--font-head); font-size: 1.2rem; text-transform: uppercase; line-height: 1.2;">
            ${data.title}
        </div>
    `;
    
    card.appendChild(img);
    card.appendChild(overlay);
    
    // Hover effect for overlay
    card.addEventListener('mouseenter', () => {
        overlay.style.transform = 'translateY(0)';
    });
    
    card.addEventListener('mouseleave', () => {
        overlay.style.transform = 'translateY(100%)';
    });
    
    return card;
}

// ============================================
// WORK DETAIL MODAL
// ============================================

async function openWorkDetail(workId) {
    const overlay = document.getElementById('workOverlay');
    const content = document.getElementById('workDetailContent');
    
    try {
        // Get work data
        const doc = await db.collection('portfolio').doc(workId).get();
        
        if (!doc.exists) {
            console.error('Work not found');
            return;
        }
        
        const data = doc.data();
        
        // Increment view count
        await db.collection('portfolio').doc(workId).update({
            views: firebase.firestore.FieldValue.increment(1)
        });
        
        // Build detail view
        content.innerHTML = `
            <div class="work-detail-img">
                <img src="${data.imageUrl}" alt="${data.title}">
            </div>
            <div class="work-detail-info">
                <div class="work-detail-category">${data.category.replace('-', ' ')}</div>
                <h2 class="work-detail-title">${data.title}</h2>
                ${data.description ? `<p class="work-detail-desc">${data.description}</p>` : ''}
                
                <div class="work-meta-grid">
                    ${data.client ? `
                        <div class="work-meta-item">
                            <div class="work-meta-label">Client</div>
                            <div class="work-meta-value">${data.client}</div>
                        </div>
                    ` : ''}
                    <div class="work-meta-item">
                        <div class="work-meta-label">Year</div>
                        <div class="work-meta-value">${data.year}</div>
                    </div>
                    <div class="work-meta-item">
                        <div class="work-meta-label">Category</div>
                        <div class="work-meta-value">${data.category.replace('-', ' ').toUpperCase()}</div>
                    </div>
                    <div class="work-meta-item">
                        <div class="work-meta-label">Views</div>
                        <div class="work-meta-value">${(data.views || 0) + 1}</div>
                    </div>
                </div>
                
                <a href="${data.imageUrl}" target="_blank" class="btn-angled hover-target" style="margin-top: 2rem; display: inline-block;">
                    View Full Size*
                </a>
            </div>
        `;
        
        overlay.classList.add('open');
        
        // Update cursor targets
        if (typeof updateCursorTargets === 'function') {
            updateCursorTargets();
        }
        
    } catch (error) {
        console.error('Error loading work detail:', error);
    }
}

function closeWorkDetail() {
    const overlay = document.getElementById('workOverlay');
    overlay.classList.remove('open');
}

// Close on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeWorkDetail();
    }
});

// Close on overlay click (not content)
document.getElementById('workOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'workOverlay') {
        closeWorkDetail();
    }
});

// ============================================
// FILTER FUNCTIONALITY
// ============================================

document.querySelectorAll('.filter-tag').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Update active state
        document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // Get filter value
        const filter = e.target.getAttribute('data-filter');
        currentFilter = filter;
        
        // Load filtered works
        loadWorks(filter);
    });
});

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

// Wait for Firebase to initialize
if (typeof firebase !== 'undefined') {
    loadWorks();
} else {
    console.error('Firebase not loaded');
    document.getElementById('worksGrid').innerHTML = `
        <div class="loading-state">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <p>Error: Firebase not initialized</p>
        </div>
    `;
}

// ============================================
// ADMIN DASHBOARD LINK (for logged in admins)
// ============================================

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // Show admin dashboard link in navigation
        const navBottom = document.querySelector('.nav-bottom');
        
        // Check if link already exists
        if (!document.querySelector('.admin-dashboard-link')) {
            const dashboardLink = document.createElement('a');
            dashboardLink.href = 'admin-dashboard.html';
            dashboardLink.className = 'admin-dashboard-link hover-target';
            dashboardLink.style.gridColumn = 'span 2';
            dashboardLink.style.background = 'var(--accent-pink)';
            dashboardLink.style.color = '#000';
            dashboardLink.textContent = 'ADMIN DASHBOARD →';
            
            navBottom.appendChild(dashboardLink);
        }
    }
});