class NotificationSystem {
    constructor() {
        this.MAX_NOTIFICATIONS = 4; // Limit notifications to 4
        this.notifications = [];
        this.notificationBtn = document.getElementById('notification-btn');
        this.notificationCount = document.getElementById('notification-count');
        this.init();
    }

    init() {
        this.loadSavedNotifications();
        this.bindEventListeners();
        this.checkStockLevels(); // Initial stock check
    }

    loadSavedNotifications() {
        try {
            this.notifications = JSON.parse(localStorage.getItem('notifications')) || [];
            this.notifications = this.notifications.slice(0, this.MAX_NOTIFICATIONS);
            this.updateBadge();
        } catch (error) {
            console.error('Failed to load notifications:', error);
            this.notifications = [];
        }
    }

    bindEventListeners() {
        if (this.notificationBtn) {
            this.notificationBtn.addEventListener('click', () => this.toggleNotificationPanel());
        }

        // Listen for stock updates
        document.addEventListener('stockUpdated', (event) => {
            console.log('Stock update event received:', event.detail); // Debug log
            this.handleStockUpdate(event.detail);
        });
    }

    handleStockUpdate(data) {
        if (!data || !data.item) return;

        const { item, type, quantity } = data;
        const currentStock = parseInt(item.quantity) || 0;
        const description = item.description ? ` (${item.description})` : '';

        // Always create a notification for scrap
        if (type === 'scrap') {
            this.addNotification({
                message: `🗑️ Scrapped ${quantity} units of ${item.partNumber}${description}`,
                type: 'warning',
                timestamp: new Date().toISOString()
            });
        }

        // Check critical stock levels
        if (currentStock === 0) {
            this.addNotification({
                message: `❗ ${item.partNumber}${description} is OUT OF STOCK`,
                type: 'error',
                timestamp: new Date().toISOString()
            });
        } else if (currentStock <= 5) {
            this.addNotification({
                message: `⚠️ ${item.partNumber}${description} has only ${currentStock} units remaining`,
                type: 'warning',
                timestamp: new Date().toISOString()
            });
        }
    }

    addNotification(notification) {
        const newNotification = {
            id: Date.now(),
            message: notification.message,
            type: notification.type || 'info',
            timestamp: new Date().toISOString(),
            read: false
        };

        this.notifications.unshift(newNotification);
        this.notifications = this.notifications.slice(0, this.MAX_NOTIFICATIONS);
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
        this.updateBadge();
        this.refreshOpenPanel();
    }

    toggleNotificationPanel() {
        const existingPanel = document.getElementById('notification-panel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }
        this.showNotificationPanel();
    }

    showNotificationPanel() {
        const panel = document.createElement('div');
        panel.id = 'notification-panel';
        panel.className = 'fixed right-4 top-16 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200';

        panel.innerHTML = `
            <div class="p-3 border-b flex justify-between items-center bg-gray-50">
                <h3 class="font-semibold text-sm text-gray-700">
                    <i class="fas fa-bell text-teal-600 mr-2"></i>
                    Critical Updates
                </h3>
                <button onclick="notificationSystem.clearAll()" 
                        class="text-gray-400 hover:text-red-500 transition-colors">
                    <i class="fas fa-trash-alt text-sm"></i>
                </button>
            </div>
            <div class="max-h-[60vh] overflow-y-auto">
                ${this.renderNotifications()}
            </div>
        `;

        document.body.appendChild(panel);
    }

    renderNotifications() {
        if (!this.notifications.length) {
            return '<div class="p-4 text-center text-gray-500 text-sm">No critical updates</div>';
        }

        return this.notifications.map(notif => `
            <div class="p-3 border-b hover:bg-gray-50 cursor-pointer ${notif.read ? 'opacity-60' : ''}"
                 onclick="notificationSystem.markAsRead(${notif.id})">
                <div class="flex gap-2 items-start">
                    <i class="fas fa-${this.getIcon(notif.type)} text-${this.getColor(notif.type)} mt-1"></i>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-gray-700 mb-1">${notif.message}</p>
                        <span class="text-xs text-gray-400">${this.formatTime(notif.timestamp)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getIcon(type) {
        return {
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        }[type] || 'bell';
    }

    getColor(type) {
        return {
            error: 'red-500',
            warning: 'amber-500',
            info: 'blue-500'
        }[type] || 'gray-500';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    }

    markAsRead(id) {
        this.notifications = this.notifications.map(n => 
            n.id === id ? {...n, read: true} : n
        );
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
        this.updateBadge();
        this.refreshOpenPanel();
    }

    clearAll() {
        this.notifications = [];
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
        this.updateBadge();
        document.getElementById('notification-panel')?.remove();
    }

    updateBadge() {
        if (!this.notificationCount) return;
        const unread = this.notifications.filter(n => !n.read).length;
        this.notificationCount.textContent = unread;
        this.notificationCount.style.display = unread ? 'flex' : 'none';
    }

    refreshOpenPanel() {
        const panel = document.getElementById('notification-panel');
        if (panel) {
            this.showNotificationPanel();
        }
    }

    checkStockLevels() {
        const stocks = JSON.parse(localStorage.getItem('stocks')) || [];
        
        stocks.forEach(item => {
            const currentStock = parseInt(item.quantity) || 0;
            const description = item.description ? ` (${item.description})` : '';
            
            if (currentStock === 0) {
                this.addNotification({
                    message: `❗ ${item.partNumber}${description} is OUT OF STOCK`,
                    type: 'error',
                    timestamp: new Date().toISOString()
                });
            } else if (currentStock <= 5) {
                this.addNotification({
                    message: `⚠️ ${item.partNumber}${description} has only ${currentStock} units remaining`,
                    type: 'warning',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }
}

// Initialize the notification system
window.notificationSystem = new NotificationSystem();