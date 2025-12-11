// ============================================
// ADMIN DASHBOARD - PORTFOLIO MANAGEMENT
// ============================================

// Check if user is logged in
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        // Not logged in, show access denied
        document.querySelector('.admin-dashboard').style.display = 'none';
        document.getElementById('notLoggedIn').style.display = 'block';
    } else {
        // Logged in, show dashboard
        document.querySelector('.admin-dashboard').style.display = 'block';
        document.getElementById('notLoggedIn').style.display = 'none';
        
        // Initialize dashboard
        loadPortfolioItems();
        loadStats();
        
        // Initialize messages if the function exists
        if (typeof loadMessages === 'function') {
            loadMessages();
        }
    }
});

const db = firebase.firestore();
const storage = firebase.storage();
let selectedFile = null;

// ============================================
// FILE UPLOAD HANDLING
// ============================================

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const uploadForm = document.getElementById('uploadForm');

// Click to upload
if (uploadArea) {
    uploadArea.addEventListener('click', () => fileInput.click());
}

// File selection
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        handleFileSelect(e.target.files[0]);
    });
}

// Drag and drop
if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragging');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragging');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragging');
        handleFileSelect(e.dataTransfer.files[0]);
    });
}

function handleFileSelect(file) {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPG, PNG, GIF, WEBP)');
        return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
    }
    
    selectedFile = file;
    if (fileInfo) {
        fileInfo.style.display = 'block';
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        if (uploadArea) {
            uploadArea.style.backgroundImage = `url(${e.target.result})`;
            uploadArea.style.backgroundSize = 'cover';
            uploadArea.style.backgroundPosition = 'center';
        }
    };
    reader.readAsDataURL(file);
}

// ============================================
// FORM SUBMISSION
// ============================================

if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!selectedFile) {
            alert('Please select an image');
            return;
        }
        
        const title = document.getElementById('projectTitle').value.trim();
        const category = document.getElementById('projectCategory').value;
        const description = document.getElementById('projectDescription').value.trim();
        const client = document.getElementById('projectClient').value.trim();
        const artist = document.getElementById('projectArtist').value.trim();
        const year = document.getElementById('projectYear').value;
        
        if (!title || !category) {
            alert('Please fill in required fields');
            return;
        }
        
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';
        progressBar.style.display = 'block';
        
        try {
            // Upload to Firebase Storage
            const filename = `portfolio/${Date.now()}_${selectedFile.name}`;
            const storageRef = storage.ref(filename);
            const uploadTask = storageRef.put(selectedFile);
            
            // Track progress
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    progressFill.style.width = progress + '%';
                    progressFill.textContent = Math.round(progress) + '%';
                },
                (error) => {
                    console.error('Upload error:', error);
                    alert('Upload failed: ' + error.message);
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Upload Project*';
                },
                async () => {
                    // Upload complete, get download URL
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    
                    // Save to Firestore
                    await db.collection('portfolio').add({
                        title: title,
                        category: category,
                        description: description,
                        client: client,
                        artist: artist || 'Unknown Artist',
                        year: parseInt(year),
                        imageUrl: downloadURL,
                        storagePath: filename,
                        uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        views: 0
                    });
                    
                    alert('Project uploaded successfully!');
                    
                    // Reset form
                    uploadForm.reset();
                    fileInfo.style.display = 'none';
                    uploadArea.style.backgroundImage = 'none';
                    selectedFile = null;
                    progressBar.style.display = 'none';
                    progressFill.style.width = '0%';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Upload Project*';
                    
                    // Reload portfolio
                    loadPortfolioItems();
                    loadStats();
                }
            );
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error uploading project: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Upload Project*';
        }
    });
}

// ============================================
// LOAD PORTFOLIO ITEMS
// ============================================

let currentFilter = 'all';

async function loadPortfolioItems(filter = 'all') {
    const grid = document.getElementById('portfolioGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="empty-state"><div class="loading"></div></div>';
    
    try {
        let query = db.collection('portfolio').orderBy('uploadedAt', 'desc');
        
        if (filter !== 'all') {
            query = query.where('category', '==', filter);
        }
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📁</div>
                    <p>No projects yet. Upload your first work!</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const item = createPortfolioItem(doc.id, data);
            grid.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error loading portfolio:', error);
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p>Error loading portfolio</p>
            </div>
        `;
    }
}

function createPortfolioItem(id, data) {
    const item = document.createElement('div');
    item.className = 'portfolio-item';
    
    item.innerHTML = `
        <div class="portfolio-item-img">
            <img src="${data.imageUrl}" alt="${data.title}">
        </div>
        <div class="portfolio-item-info">
            <div class="portfolio-item-title">${data.title}</div>
            <div class="portfolio-item-category">${data.category.replace('-', ' ')}</div>
            ${data.artist ? `<div class="portfolio-item-artist" style="font-family: var(--font-mono); font-size: 0.75rem; color: #666; margin-bottom: 0.5rem;">By ${data.artist}</div>` : ''}
            <div class="portfolio-item-desc">${data.description || 'No description'}</div>
            <div class="portfolio-item-actions">
                <button class="action-btn" onclick="viewProject('${id}', '${data.imageUrl}')">View</button>
                <button class="action-btn" onclick="editProject('${id}')">Edit</button>
                <button class="action-btn delete" onclick="deleteProject('${id}', '${data.storagePath}')">Delete</button>
            </div>
        </div>
    `;
    
    return item;
}

// ============================================
// PROJECT ACTIONS
// ============================================

window.viewProject = function(id, imageUrl) {
    window.open(imageUrl, '_blank');
}

window.editProject = function(id) {
    alert('Edit functionality - coming soon!');
}

window.deleteProject = async function(id, storagePath) {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
        return;
    }
    
    try {
        // Delete from Storage
        await storage.ref(storagePath).delete();
        
        // Delete from Firestore
        await db.collection('portfolio').doc(id).delete();
        
        alert('Project deleted successfully');
        loadPortfolioItems(currentFilter);
        loadStats();
        
    } catch (error) {
        console.error('Error deleting:', error);
        alert('Error deleting project: ' + error.message);
    }
}

// ============================================
// FILTER BUTTONS
// ============================================

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        currentFilter = e.target.getAttribute('data-filter');
        loadPortfolioItems(currentFilter);
    });
});

// ============================================
// STATS
// ============================================

async function loadStats() {
    try {
        const snapshot = await db.collection('portfolio').get();
        
        let totalViews = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            totalViews += data.views || 0;
        });
        
        const totalWorksEl = document.getElementById('totalWorks');
        const totalViewsEl = document.getElementById('totalViews');
        const storageUsedEl = document.getElementById('storageUsed');
        
        if (totalWorksEl) totalWorksEl.textContent = snapshot.size;
        if (totalViewsEl) totalViewsEl.textContent = totalViews;
        if (storageUsedEl) storageUsedEl.textContent = '0 MB';
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}