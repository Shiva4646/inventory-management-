// Initialize stocks data
let stocks = JSON.parse(localStorage.getItem('stocks')) || [];

// Helper function to ensure numeric values
function ensureNumber(value) {
    const num = parseInt(value);
    return isNaN(num) ? 0 : num;
}

// Calculate total quantity
function calculateQuantity(item) {
    const stockIn = ensureNumber(item.stockIn);
    const stockOut = ensureNumber(item.stockOut);
    const scrap = ensureNumber(item.scrap);
    return Math.max(0, stockIn - stockOut - scrap);
}

// Update the table function
function updateTable() {
    const tableBody = document.getElementById('stockTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    stocks.forEach((item, index) => {
        const stockIn = ensureNumber(item.stockIn);
        const stockOut = ensureNumber(item.stockOut);
        const scrap = ensureNumber(item.scrap);
        const quantity = calculateQuantity(item);

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';

        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-500">${index + 1}</td>
            <td class="px-6 py-4 text-sm font-medium text-gray-900">${item.partNumber}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${item.description}</td>
            <td class="px-6 py-4 text-sm ${quantity <= 5 ? 'text-red-600' : 'text-gray-900'} font-semibold">
                ${quantity}
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center space-x-2">
                    <span class="text-emerald-600">${stockIn}</span>
                    <button onclick="editStockType(${index}, 'stockIn')" 
                            class="text-emerald-600 hover:text-emerald-800 edit-button">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center space-x-2">
                    <span class="text-amber-600">${stockOut}</span>
                    <button onclick="editStockType(${index}, 'stockOut')" 
                            class="text-amber-600 hover:text-amber-800 edit-button">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center space-x-2">
                    <div class="flex flex-col">
                        <span class="text-red-600">${scrap}</span>
                        ${item.scrapReason ? 
                            `<span class="text-xs text-gray-500">${item.scrapReason}</span>` : 
                            ''}
                    </div>
                    <button onclick="editStockType(${index}, 'scrap')" 
                            class="text-red-600 hover:text-red-800 edit-button"
                            title="${item.scrapReason || 'No reason provided'}">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
            <td class="px-6 py-4 text-center">
                <button onclick="deleteItem(${index})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Update stock type function
function editStockType(index, type) {
    const item = stocks[index];
    const currentValue = ensureNumber(item[type]);
    
    const getTypeConfig = (type) => {
        switch(type) {
            case 'stockIn':
                return {
                    title: 'Stock In',
                    color: 'emerald',
                    icon: 'arrow-down',
                    placeholder: 'Enter stock in quantity'
                };
            case 'stockOut':
                return {
                    title: 'Stock Out',
                    color: 'amber',
                    icon: 'arrow-up',
                    placeholder: 'Enter stock out quantity'
                };
            case 'scrap':
                return {
                    title: 'Scrap Stock',
                    color: 'red',
                    icon: 'trash-alt',
                    placeholder: 'Enter scrap quantity'
                };
        }
    };

    const config = getTypeConfig(type);
    
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200';
    
    // Template for the modal
    const dialogContent = `
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-95 opacity-0">
            <div class="p-6">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-${config.color}-100 flex items-center justify-center">
                            <i class="fas fa-${config.icon} text-${config.color}-600"></i>
                        </div>
                        <h3 class="text-xl font-semibold text-gray-800">Edit ${config.title}</h3>
                    </div>
                    <button onclick="closeEditDialog()" 
                            class="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <!-- Current Stock Info -->
                <div class="bg-gray-50 rounded-lg p-4 mb-6">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-500">Part Number</label>
                            <p class="mt-1 font-semibold text-gray-700">${item.partNumber}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-500">Current Stock</label>
                            <p class="mt-1 font-semibold text-gray-700">${calculateQuantity(item)}</p>
                        </div>
                    </div>
                </div>

                <!-- Form Fields -->
                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            New ${config.title} Quantity
                        </label>
                        <div class="relative">
                            <input type="number" 
                                   id="editQuantity" 
                                   value="${currentValue}"
                                   min="0"
                                   placeholder="${config.placeholder}"
                                   class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-${config.color}-500 focus:border-${config.color}-500 transition-colors">
                            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <i class="fas fa-box text-gray-400"></i>
                            </div>
                        </div>
                    </div>

                    ${type === 'scrap' ? `
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Reason for Scrapping
                            </label>
                            <textarea id="editReason" 
                                    rows="3"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-${config.color}-500 focus:border-${config.color}-500 transition-colors resize-none"
                                    placeholder="Please provide a reason for scrapping">${item.scrapReason || ''}</textarea>
                        </div>
                    ` : ''}
                </div>

                <!-- Actions -->
                <div class="flex justify-end gap-3 mt-8 pt-6 border-t">
                    <button onclick="closeEditDialog()" 
                            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onclick="saveStockEdit(${index}, '${type}')"
                            class="px-6 py-2 text-sm font-medium text-black bg-${config.color}-600 hover:bg-${config.color}-700 rounded-lg transition-colors flex items-center gap-2">
                        <i class="fas fa-save"></i>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    `;

    dialog.innerHTML = dialogContent;
    document.body.appendChild(dialog);

    // Animate in
    requestAnimationFrame(() => {
        dialog.querySelector('.scale-95').classList.remove('scale-95', 'opacity-0');
    });

    // Add click outside to close
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            closeEditDialog();
        }
    });

    // Add escape key listener
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            closeEditDialog();
            document.removeEventListener('keydown', escapeHandler);
        }
    });

    // Focus the input
    setTimeout(() => {
        document.getElementById('editQuantity').focus();
    }, 100);
}

// Add helper functions for the edit dialog
function closeEditDialog() {
    const dialog = document.querySelector('.fixed.inset-0');
    if (dialog) {
        // Add fade-out animation
        dialog.style.opacity = '0';
        setTimeout(() => {
            dialog.remove();
        }, 200); // Match transition duration
    }
}

function saveStockEdit(index, type) {
    const item = stocks[index];
    const newValue = parseInt(document.getElementById('editQuantity').value);
    
    if (!isNaN(newValue) && newValue >= 0) {
        // Update values
        item[type] = newValue;
        
        // Only update reason for scrap
        if (type === 'scrap') {
            const reason = document.getElementById('editReason').value.trim();
            item.scrapReason = reason;
        }
        
        item.quantity = calculateQuantity(item);
        
        // Save and update
        saveStocks();
        updateTable();
        
        // Trigger notification
        if (window.notificationSystem) {
            notificationSystem.handleStockUpdate({
                item: item,
                type: type,
                quantity: newValue,
                ...(type === 'scrap' && { reason: item.scrapReason })
            });
        }
        
        closeEditDialog();
    } else {
        alert('Please enter a valid positive number');
    }
}

// Save stocks to localStorage
function saveStocks() {
    localStorage.setItem('stocks', JSON.stringify(stocks));
}

// Add deleteItem function
function deleteItem(index) {
    const item = stocks[index];
    if (confirm(`Are you sure you want to delete ${item.partNumber}?\nThis action cannot be undone.`)) {
        // Remove item from array
        stocks.splice(index, 1);
        
        // Save updated stocks
        saveStocks();
        
        // Update table
        updateTable();
        
        // Trigger notification
        if (window.notificationSystem) {
            notificationSystem.handleStockUpdate({
                item: item,
                type: 'delete',
                message: `${item.partNumber} has been deleted`
            });
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Clean up any NaN values in existing data
    stocks = stocks.map(item => ({
        ...item,
        stockIn: ensureNumber(item.stockIn),
        stockOut: ensureNumber(item.stockOut),
        scrap: ensureNumber(item.scrap),
        quantity: calculateQuantity(item)
    }));
    
    saveStocks();
    updateTable();
});

// Update the inward form handler
document.getElementById('inwardForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const partNumber = document.getElementById('partNumber').value;
    const description = document.getElementById('materialDesc').value;
    const quantity = parseInt(document.getElementById('quantity').value) || 0;

    if (!partNumber || !description || quantity <= 0) {
        alert('Please fill all fields with valid values');
        return;
    }

    // Add or update stock
    const existingItem = stocks.find(item => item.partNumber === partNumber);
    if (existingItem) {
        existingItem.stockIn = (parseInt(existingItem.stockIn) || 0) + quantity;
        existingItem.quantity = calculateQuantity(existingItem);
    } else {
        // Create new item with all required properties
        stocks.push({
            partNumber,
            description,
            stockIn: quantity,
            stockOut: 0,
            scrap: 0,
            quantity: quantity,
            scrapReason: ''
        });
    }

    saveStocks();
    updateTable();
    closeModal();
    this.reset();
});

// Add this withdraw form handler after the inward form handler
document.getElementById('withdrawForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const partNumber = document.getElementById('withdrawPartNumber').value;
    const quantity = parseInt(document.getElementById('withdrawQuantity').value) || 0;

    if (!partNumber || quantity <= 0) {
        alert('Please enter valid part number and quantity');
        return;
    }

    // Find existing item
    const existingItem = stocks.find(item => item.partNumber === partNumber);
    if (!existingItem) {
        alert('Part number not found');
        return;
    }

    // Check if enough stock is available
    const currentStock = calculateQuantity(existingItem);
    if (currentStock < quantity) {
        alert('Not enough stock available');
        return;
    }

    // Update stock out
    existingItem.stockOut = (parseInt(existingItem.stockOut) || 0) + quantity;
    existingItem.quantity = calculateQuantity(existingItem);

    // Save and update
    saveStocks();
    updateTable();
    closeWithdrawModal();
    this.reset();

    // Trigger notification
    if (window.notificationSystem) {
        notificationSystem.handleStockUpdate({
            item: existingItem,
            type: 'stockOut',
            quantity: quantity
        });
    }
});

// Add this scrap form handler
document.getElementById('scrapForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const partNumber = document.getElementById('scrapPartNumber').value;
    const quantity = parseInt(document.getElementById('scrapQuantity').value) || 0;
    const reason = document.getElementById('scrapReason')?.value.trim();

    if (!partNumber || quantity <= 0) {
        alert('Please enter valid part number and quantity');
        return;
    }

    // Find existing item
    const existingItem = stocks.find(item => item.partNumber === partNumber);
    if (!existingItem) {
        alert('Part number not found');
        return;
    }

    // Check if enough stock is available
    const currentStock = calculateQuantity(existingItem);
    if (currentStock < quantity) {
        alert('Not enough stock available');
        return;
    }

    // Update scrap
    existingItem.scrap = (parseInt(existingItem.scrap) || 0) + quantity;
    existingItem.scrapReason = reason || 'No reason provided';
    existingItem.quantity = calculateQuantity(existingItem);

    // Save and update
    saveStocks();
    updateTable();
    closeScrapModal();
    this.reset();

    // Trigger notification
    if (window.notificationSystem) {
        notificationSystem.handleStockUpdate({
            item: existingItem,
            type: 'scrap',
            quantity: quantity,
            reason: reason
        });
    }
});

// Add these modal control functions if not already present
function closeWithdrawModal() {
    const modal = document.getElementById('withdrawModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function closeScrapModal() {
    const modal = document.getElementById('scrapModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Add click handlers for the modal buttons
document.getElementById('withdrawBtn')?.addEventListener('click', function() {
    const modal = document.getElementById('withdrawModal');
    if (modal) {
        modal.classList.add('show');
    }
});

document.getElementById('scrapBtn')?.addEventListener('click', function() {
    const modal = document.getElementById('scrapModal');
    if (modal) {
        modal.classList.add('show');
    }
});
