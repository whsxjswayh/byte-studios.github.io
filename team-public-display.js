// ============================================
// PUBLIC TEAM DISPLAY - Meet The Team Page
// ============================================

// Load team members from Firebase
async function loadPublicTeam() {
    const teamGrid = document.querySelector('.team-grid');
    
    if (!teamGrid) {
        console.error('Team grid not found');
        return;
    }
    
    // Show loading state
    teamGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: #888;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(255, 101, 5, 0.3); border-radius: 50%; border-top-color: var(--accent-pink); animation: spin 0.8s linear infinite;"></div>
            <p style="margin-top: 1rem;">Loading team members...</p>
        </div>
    `;
    
    try {
        const db = firebase.firestore();
        const snapshot = await db.collection('team').orderBy('createdAt', 'desc').get();
        
        if (snapshot.empty) {
            teamGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: #888;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
                    <p>No team members yet. Check back soon!</p>
                </div>
            `;
            return;
        }
        
        // Clear loading state
        teamGrid.innerHTML = '';
        
        // Add each team member
        snapshot.forEach((doc) => {
            const data = doc.data();
            const memberCard = createPublicTeamCard(data);
            teamGrid.appendChild(memberCard);
        });
        
        // Re-initialize scroll animations
        if (typeof observer !== 'undefined') {
            document.querySelectorAll('.scroll-trigger').forEach((el) => {
                observer.observe(el);
            });
        }
        
        // Update cursor targets
        if (typeof updateCursorTargets === 'function') {
            updateCursorTargets();
        }
        
    } catch (error) {
        console.error('Error loading team:', error);
        teamGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: #888;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <p>Error loading team members</p>
            </div>
        `;
    }
}

// Create team card element
function createPublicTeamCard(data) {
    const wrapper = document.createElement('div');
    wrapper.className = 'scroll-trigger hover-target';
    wrapper.setAttribute('data-name', data.name);
    wrapper.setAttribute('data-role', data.role);
    wrapper.setAttribute('data-bio', data.bio);
    wrapper.setAttribute('data-img', data.imageUrl);
    wrapper.onclick = function() { openMember(this); };
    
    wrapper.innerHTML = `
        <div class="team-card">
            <img src="${data.imageUrl}" alt="${data.name}" loading="lazy">
        </div>
        <div class="team-info">
            <div class="team-name">${data.name}</div>
            <div class="team-role">${data.role}</div>
        </div>
    `;
    
    return wrapper;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPublicTeam);
} else {
    loadPublicTeam();
}

// Add CSS for loading animation if not already present
if (!document.querySelector('#team-loading-styles')) {
    const style = document.createElement('style');
    style.id = 'team-loading-styles';
    style.textContent = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}