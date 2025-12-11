// ============================================
// ADMIN MESSAGES HANDLER
// ============================================

let currentMessageFilter = 'all';
let selectedMessageId = null;

// ============================================
// LOAD MESSAGES
// ============================================

async function loadMessages(filter = 'all') {
    const grid = document.getElementById('messagesGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="empty-state"><div class="loading-spinner"></div></div>';
    
    try {
        let query = db.collection('messages').orderBy('timestamp', 'desc');
        
        // Apply filter
        if (filter === 'unread') {
            query = query.where('read', '==', false);
        } else if (filter === 'read') {
            query = query.where('read', '==', true);
        }
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <p>No messages ${filter !== 'all' ? 'in this category' : 'yet'}</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const messageCard = createMessageCard(doc.id, data);
            grid.appendChild(messageCard);
        });
        
        // Update message count in stats
        updateMessageStats();
        
    } catch (error) {
        console.error('Error loading messages:', error);
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p>Error loading messages</p>
            </div>
        `;
    }
}

// ============================================
// CREATE MESSAGE CARD
// ============================================

function createMessageCard(id, data) {
    const card = document.createElement('div');
    card.className = `message-card hover-target ${!data.read ? 'unread' : ''}`;
    card.onclick = () => openMessageDetail(id);
    
    // Format timestamp
    let timeAgo = 'Unknown time';
    if (data.timestamp) {
        const now = Date.now();
        const msgTime = data.timestamp.toDate().getTime();
        const diff = now - msgTime;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) timeAgo = 'Just now';
        else if (minutes < 60) timeAgo = `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        else if (hours < 24) timeAgo = `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        else timeAgo = `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    card.innerHTML = `
        <div class="message-card-header">
            <div>
                <div class="message-sender">${data.name}</div>
                <div class="message-email">${data.email}</div>
            </div>
            <div class="message-time">${timeAgo}</div>
        </div>
        <div class="message-preview">${data.message}</div>
        <div class="message-status">
            ${!data.read ? '<span class="status-badge unread">Unread</span>' : '<span class="status-badge">Read</span>'}
            ${data.replied ? '<span class="status-badge">Replied</span>' : ''}
        </div>
    `;
    
    return card;
}

// ============================================
// MESSAGE DETAIL MODAL
// ============================================

async function openMessageDetail(messageId) {
    const overlay = document.getElementById('messageOverlay');
    if (!overlay) return;
    
    try {
        const doc = await db.collection('messages').doc(messageId).get();
        
        if (!doc.exists) {
            alert('Message not found');
            return;
        }
        
        const data = doc.data();
        selectedMessageId = messageId;
        
        // Format timestamp
        let timeStr = 'Unknown time';
        if (data.timestamp) {
            timeStr = data.timestamp.toDate().toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }
        
        // Populate modal
        document.getElementById('msgDetailName').textContent = data.name;
        document.getElementById('msgDetailEmail').textContent = data.email;
        document.getElementById('msgDetailTime').textContent = timeStr;
        document.getElementById('msgDetailBody').textContent = data.message;
        
        // Update read button text
        const readBtn = document.getElementById('markReadBtn');
        readBtn.textContent = data.read ? 'Mark as Unread' : 'Mark as Read';
        
        overlay.classList.add('open');
        
        // Mark as read if it's unread
        if (!data.read) {
            await db.collection('messages').doc(messageId).update({
                read: true
            });
            loadMessages(currentMessageFilter);
        }
        
    } catch (error) {
        console.error('Error loading message:', error);
        alert('Error loading message details');
    }
}

function closeMessageDetail() {
    const overlay = document.getElementById('messageOverlay');
    if (overlay) {
        overlay.classList.remove('open');
    }
    selectedMessageId = null;
}

// ============================================
// MESSAGE ACTIONS
// ============================================

async function toggleReadStatus() {
    if (!selectedMessageId) return;
    
    try {
        const doc = await db.collection('messages').doc(selectedMessageId).get();
        const currentStatus = doc.data().read;
        
        await db.collection('messages').doc(selectedMessageId).update({
            read: !currentStatus
        });
        
        // Update button
        const readBtn = document.getElementById('markReadBtn');
        readBtn.textContent = !currentStatus ? 'Mark as Unread' : 'Mark as Read';
        
        // Reload messages
        loadMessages(currentMessageFilter);
        
    } catch (error) {
        console.error('Error updating read status:', error);
        alert('Error updating message status');
    }
}

async function replyToMessage() {
    if (!selectedMessageId) return;
    
    try {
        const doc = await db.collection('messages').doc(selectedMessageId).get();
        const data = doc.data();
        
        // Create mailto link
        const subject = encodeURIComponent(`Re: Your message to Byte Studio`);
        const body = encodeURIComponent(`Hi ${data.name},\n\nThank you for reaching out to Byte Studio.\n\n`);
        
        window.location.href = `mailto:${data.email}?subject=${subject}&body=${body}`;
        
        // Mark as replied
        await db.collection('messages').doc(selectedMessageId).update({
            replied: true
        });
        
        loadMessages(currentMessageFilter);
        
    } catch (error) {
        console.error('Error replying to message:', error);
    }
}

async function deleteMessage() {
    if (!selectedMessageId) return;
    
    if (!confirm('Are you sure you want to delete this message? This cannot be undone.')) {
        return;
    }
    
    try {
        await db.collection('messages').doc(selectedMessageId).delete();
        
        closeMessageDetail();
        loadMessages(currentMessageFilter);
        
        alert('Message deleted successfully');
        
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Error deleting message: ' + error.message);
    }
}

// ============================================
// MESSAGE FILTERS
// ============================================

document.querySelectorAll('[data-msg-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-msg-filter]').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        currentMessageFilter = e.target.getAttribute('data-msg-filter');
        loadMessages(currentMessageFilter);
    });
});

// ============================================
// UPDATE MESSAGE STATS
// ============================================

async function updateMessageStats() {
    try {
        const snapshot = await db.collection('messages').get();
        const unreadSnapshot = await db.collection('messages').where('read', '==', false).get();
        
        // Create or update message count display
        let messageCountEl = document.getElementById('messageCount');
        if (!messageCountEl) {
            const statsGrid = document.querySelector('.stats-grid');
            if (statsGrid) {
                const statCard = document.createElement('div');
                statCard.className = 'stat-card';
                statCard.innerHTML = `
                    <div class="stat-value" id="messageCount">${snapshot.size}</div>
                    <div class="stat-label">Messages</div>
                `;
                statsGrid.appendChild(statCard);
            }
        } else {
            messageCountEl.textContent = snapshot.size;
        }
        
        // Add unread count if there are unread messages
        if (unreadSnapshot.size > 0) {
            const messagesSection = document.querySelector('.messages-section .section-header h3');
            if (messagesSection && !messagesSection.querySelector('.unread-badge')) {
                const badge = document.createElement('span');
                badge.className = 'unread-badge';
                badge.style.cssText = `
                    display: inline-block;
                    background: var(--accent-pink);
                    color: #000;
                    padding: 0.25rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    margin-left: 0.5rem;
                    font-family: var(--font-mono);
                `;
                badge.textContent = unreadSnapshot.size;
                messagesSection.appendChild(badge);
            } else if (messagesSection) {
                const badge = messagesSection.querySelector('.unread-badge');
                if (badge) {
                    badge.textContent = unreadSnapshot.size;
                    if (unreadSnapshot.size === 0) badge.remove();
                }
            }
        }
        
    } catch (error) {
        console.error('Error updating message stats:', error);
    }
}

// ============================================
// CLOSE MODAL ON ESCAPE
// ============================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMessageDetail();
    }
});

// ============================================
// INITIALIZE
// ============================================

// Load messages when on admin dashboard
if (window.location.pathname.includes('admin-dashboard')) {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            loadMessages();
        }
    });
}