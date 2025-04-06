document.addEventListener('DOMContentLoaded', function() {
    // Get all modal elements and buttons
    const inwardBtn = document.getElementById('inwardBtn');
    const withdrawBtn = document.getElementById('withdrawBtn');
    const scrapBtn = document.getElementById('scrapBtn');
    const inwardModal = document.getElementById('inwardModal');
    const withdrawModal = document.getElementById('withdrawModal');
    const scrapModal = document.getElementById('scrapModal');
    const inwardForm = document.getElementById('inwardForm');
    const submitBtn = document.getElementById('submitBtn');
    const withdrawForm = document.getElementById('withdrawForm');
    const withdrawSubmitBtn = document.getElementById('withdrawSubmitBtn');

    // Debug log to verify script is running
    console.log('Script initialized, scrap button:', scrapBtn); // Debug log

    // Event listener for inward button
    inwardBtn.addEventListener('click', function() {
        inwardModal.classList.add('show');
    });

    // Event listener for withdraw button
    withdrawBtn.addEventListener('click', function() {
        console.log('Withdraw button clicked'); // Debug log
        withdrawModal.classList.add('show');
        console.log('Withdraw modal opened'); // Debug log
    });

    // Event listener for scrap button
    if (scrapBtn) {
        scrapBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Scrap button clicked'); // Debug log
            scrapModal.classList.add('show');
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === inwardModal) {
            closeModal();
        }
        if (e.target === withdrawModal) {
            closeWithdrawModal();
        }
        if (e.target === scrapModal) {
            closeScrapModal();
        }
    });

    // Update the inward form submission handler
    document.getElementById('inwardForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form elements first
        const partNumberInput = document.getElementById('partNumber');
        const descriptionInput = document.getElementById('materialDesc');
        const quantityInput = document.getElementById('quantity');

        // Debug logging
        console.log('Form Values:', {
            partNumber: partNumberInput?.value,
            description: descriptionInput?.value,
            quantity: quantityInput?.value,
            elements: {
                partNumberExists: !!partNumberInput,
                descriptionExists: !!descriptionInput,
                quantityExists: !!quantityInput
            }
        });

        // Check if elements exist
        if (!partNumberInput || !descriptionInput || !quantityInput) {
            console.error('Form elements not found');
            return;
        }

        // Get values and trim whitespace
        const partNumber = partNumberInput.value.trim();
        const description = descriptionInput.value.trim();
        const quantityStr = quantityInput.value.trim();

        // Validate individual fields with specific messages
        if (!partNumber) {
           
            partNumberInput.focus();
            return;
        }

        if (!description) {
            alert('Please enter a description');
            descriptionInput.focus();
            return;
        }

        if (!quantityStr) {
            alert('Please enter a quantity');
            quantityInput.focus();
            return;
        }

        // Parse and validate quantity
        const quantity = parseInt(quantityStr);
        if (isNaN(quantity) || quantity <= 0) {
            alert('Please enter a valid positive quantity');
            quantityInput.focus();
            return;
        }

        // Initialize stocks array
        if (!window.stocks) {
            window.stocks = JSON.parse(localStorage.getItem('stocks')) || [];
        }

        // Check for duplicates
        const existingItem = stocks.find(item => 
            item.partNumber.toLowerCase() === partNumber.toLowerCase()
        );

        if (existingItem) {
            // Update existing item
            existingItem.stockIn = (parseInt(existingItem.stockIn) || 0) + quantity;
            existingItem.description = description;
            existingItem.quantity = (parseInt(existingItem.quantity) || 0) + quantity;
        } else {
            // Add new item
            const newItem = {
                partNumber,
                description,
                stockIn: quantity,
                stockOut: 0,
                scrap: 0,
                quantity: quantity,
                scrapReason: ''
            };
            stocks.push(newItem);
        }

        // Save to localStorage
        localStorage.setItem('stocks', JSON.stringify(stocks));
        
        // Update table
        updateTable();
        
        // Show success message
        alert('Stock added successfully!');
        
        // Close modal and reset form
        closeModal();
        this.reset();
    });

    // Handle withdraw form submission
    withdrawForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted'); // Debug log
        
        withdrawSubmitBtn.classList.add('loading');
        withdrawSubmitBtn.disabled = true;

        try {
            const partNumber = document.getElementById('withdrawPartNumber').value;
            const quantity = parseInt(document.getElementById('withdrawQuantity').value);

            // Validate if part exists and has enough quantity
            const row = findStockRow(partNumber);
            if (!row) {
                throw new Error('Part number not found');
            }

            const currentQuantity = parseInt(row.cells[3].textContent);
            if (currentQuantity < quantity) {
                throw new Error('Insufficient stock');
            }

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update table
            updateStockOut(row, quantity);

            // Show success state
            withdrawSubmitBtn.classList.remove('loading');
            withdrawSubmitBtn.classList.add('success');
            withdrawSubmitBtn.innerHTML = '<i class="fas fa-check"></i><span>Withdrawn!</span>';

            // Close modal and reset form
            setTimeout(() => {
                closeWithdrawModal();
                withdrawForm.reset();
            }, 1500);

        } catch (error) {
            console.error('Error:', error);
            withdrawSubmitBtn.classList.remove('loading');
            withdrawSubmitBtn.classList.add('error');
            withdrawSubmitBtn.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${error.message}</span>`;
        } finally {
            setTimeout(() => {
                withdrawSubmitBtn.disabled = false;
                withdrawSubmitBtn.classList.remove('success', 'error');
                withdrawSubmitBtn.innerHTML = '<i class="fas fa-minus"></i><span>Withdraw Stock</span>';
            }, 2000);
        }
    });

    // Handle scrap form submission
    const scrapForm = document.getElementById('scrapForm');
    if (scrapForm) {
        scrapForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const scrapSubmitBtn = document.getElementById('scrapSubmitBtn');
            
            try {
                // Start loading state
                scrapSubmitBtn.classList.add('loading');
                scrapSubmitBtn.disabled = true;

                const partNumber = document.getElementById('scrapPartNumber').value;
                const quantity = parseInt(document.getElementById('scrapQuantity').value);
                const reason = document.getElementById('scrapReason').value;

                // Validate inputs
                if (!partNumber || !quantity || !reason) {
                    throw new Error('All fields are required');
                }

                // Validate if part exists and has enough quantity
                const row = findStockRow(partNumber);
                if (!row) {
                    throw new Error('Part number not found');
                }

                const currentQuantity = parseInt(row.cells[3].textContent);
                if (currentQuantity < quantity) {
                    throw new Error('Insufficient stock');
                }

                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Update table
                updateScrapStock(row, quantity, reason);

                // Show success state
                scrapSubmitBtn.classList.remove('loading');
                scrapSubmitBtn.classList.add('success');
                scrapSubmitBtn.innerHTML = '<i class="fas fa-check"></i><span>Scrapped!</span>';

                // Close modal after delay
                setTimeout(() => {
                    closeScrapModal();
                    scrapForm.reset();
                }, 1500);

            } catch (error) {
                console.error('Error:', error);
                scrapSubmitBtn.classList.remove('loading');
                scrapSubmitBtn.classList.add('error');
                scrapSubmitBtn.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${error.message}</span>`;
            } finally {
                setTimeout(() => {
                    scrapSubmitBtn.disabled = false;
                    scrapSubmitBtn.classList.remove('success', 'error');
                    scrapSubmitBtn.innerHTML = '<i class="fas fa-trash-alt"></i><span>Scrap Stock</span>';
                }, 2000);
            }
        });
    }

    // Load table data when page loads
    loadTableFromStorage();

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            showTab(this.dataset.tab);
        });
    });

    // Form submissions
    document.getElementById('editStockInForm').addEventListener('submit', handleStockInEdit);
    document.getElementById('editStockOutForm').addEventListener('submit', handleStockOutEdit);
    document.getElementById('editScrapForm').addEventListener('submit', handleScrapEdit);
});

// Close modal functions
function closeModal() {
    const modal = document.getElementById('inwardModal');
    modal.classList.remove('show');
    document.getElementById('inwardForm').reset();
}

function closeWithdrawModal() {
    const modal = document.getElementById('withdrawModal');
    modal.classList.remove('show');
    document.getElementById('withdrawForm').reset();
}

function closeScrapModal() {
    const modal = document.getElementById('scrapModal');
    const form = document.getElementById('scrapForm');
    if (modal) {
        modal.classList.remove('show');
    }
    if (form) {
        form.reset();
    }
}

function addToTable(partNumber, materialDesc, quantity) {
    // Normalize the part number (trim spaces and convert to lowercase)
    const normalizedPartNumber = partNumber.trim().toLowerCase();

    // Check for duplicates
    const existingData = JSON.parse(localStorage.getItem('stockData')) || [];
    const duplicate = existingData.find(item => item.partNumber.trim().toLowerCase() === normalizedPartNumber);

    if (duplicate) {
        alert('This part number already exists in the inventory!');
        return false; // Stop further execution
    }

    const tbody = document.getElementById('stockTableBody');
    if (!tbody) return false;

    const tr = document.createElement('tr');
    tr.classList.add('hover:bg-gray-50', 'transition-colors');

    // Create new row with initial values
    const newRow = {
        partNumber: normalizedPartNumber,
        materialDesc: materialDesc,
        total: quantity,
        stockIn: quantity,
        stockOut: 0,
        scrapped: 0
    };

    // Add to local storage
    existingData.push(newRow);
    localStorage.setItem('stockData', JSON.stringify(existingData));

    // Update UI with template literal
    tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${tbody.children.length + 1}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${newRow.partNumber}</td>
        <td class="px-6 py-4 text-sm text-gray-600">${newRow.materialDesc}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${newRow.total < 0 ? 'text-red-600' : 'text-gray-900'}">${newRow.total}</td>
        <td class="px-6 py-4 text-center text-sm text-emerald-600">${newRow.stockIn}</td>
        <td class="px-6 py-4 text-center text-sm text-amber-600">${newRow.stockOut}</td>
        <td class="px-6 py-4 text-center text-sm text-red-600">${newRow.scrapped}</td>
        <td class="px-6 py-4 text-center">
            <button onclick="editStock('${newRow.partNumber}')" class="text-blue-600 hover:text-blue-800 mx-1">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteStock('${newRow.partNumber}')" class="text-red-600 hover:text-red-800 mx-1">
                <i class="fas fa-trash-alt"></i>
            </button>
        </td>
    `;

    tbody.appendChild(tr);
    console.log('Row added successfully:', newRow);
    return true;
}

function updateStockOut(row, quantity) {
    const partNumber = row.cells[1].textContent;
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const itemIndex = stockData.findIndex(item => item.partNumber === partNumber);
    
    if (itemIndex !== -1) {
        // Update memory object
        stockData[itemIndex].stockOut += quantity;
        stockData[itemIndex].total = stockData[itemIndex].stockIn - stockData[itemIndex].stockOut + stockData[itemIndex].scrapped;
        
        // Update localStorage
        localStorage.setItem('stockData', JSON.stringify(stockData));
        
        // Update UI
        row.cells[5].textContent = stockData[itemIndex].stockOut;
        row.cells[3].textContent = stockData[itemIndex].total;
        
        // Update color coding
        if (stockData[itemIndex].total < 0) {
            row.cells[3].classList.add('text-red-600');
        } else {
            row.cells[3].classList.remove('text-red-600');
        }
    }
}

function updateScrapStock(row, quantity, reason) {
    const partNumber = row.cells[1].textContent;
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const itemIndex = stockData.findIndex(item => item.partNumber === partNumber);
    
    if (itemIndex !== -1) {
        // Update memory object
        stockData[itemIndex].scrapped += quantity;
        stockData[itemIndex].total = stockData[itemIndex].stockIn - stockData[itemIndex].stockOut + stockData[itemIndex].scrapped;
        
        // Update localStorage
        localStorage.setItem('stockData', JSON.stringify(stockData));
        
        // Update UI
        row.cells[6].textContent = stockData[itemIndex].scrapped;
        row.cells[3].textContent = stockData[itemIndex].total;
        
        // Update color coding
        if (stockData[itemIndex].total < 0) {
            row.cells[3].classList.add('text-red-600');
        } else {
            row.cells[3].classList.remove('text-red-600');
        }
    }
}

function findStockRow(partNumber) {
    const rows = document.getElementById('stockTableBody').getElementsByTagName('tr');
    for (let row of rows) {
        if (row.cells[1].textContent === partNumber) {
            return row;
        }
    }
    return null;
}

// Update the loadTableFromStorage function
function loadTableFromStorage() {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const tbody = document.getElementById('stockTableBody');
    
    if (!tbody) return;
    tbody.innerHTML = '';
    
    stockData.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.classList.add('hover:bg-gray-50');
        
        tr.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-900">${index + 1}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${item.partNumber}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${item.materialDesc}</td>
            <td class="px-6 py-4 text-sm font-medium ${item.total < 0 ? 'text-red-600' : 'text-gray-900'}">${item.total}</td>
            
            <!-- Stock In Column with Edit Button -->
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center space-x-2">
                    <span class="text-emerald-600">${item.stockIn || 0}</span>
                    <button onclick="editStockInline('${item.partNumber}', 'stockIn')" 
                            class="text-emerald-600 hover:text-emerald-800">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
            
            <!-- Stock Out Column with Edit Button -->
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center space-x-2">
                    <span class="text-amber-600">${item.stockOut || 0}</span>
                    <button onclick="editStockInline('${item.partNumber}', 'stockOut')" 
                            class="text-amber-600 hover:text-amber-800">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
            
            <!-- Scrap Column with Edit Button -->
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center space-x-2">
                    <span class="text-red-600">${item.scrapped || 0}</span>
                    <button onclick="editStockInline('${item.partNumber}', 'scrap')" 
                            class="text-red-600 hover:text-red-800">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
            
            <td class="px-6 py-4 text-center">
                <button onclick="deleteStock('${item.partNumber}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Add the inline editing function
function editStockInline(partNumber, type) {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const item = stockData.find(item => item.partNumber === partNumber);
    
    if (!item) return;

    // Open the appropriate popup based on type
    const popup = document.getElementById(`${type}EditPopup`);
    if (popup) {
        // Set the part number in the hidden input
        popup.querySelector('#quickEditPartNo').value = partNumber;
        
        // Set the current quantity in the input field
        switch(type) {
            case 'stockIn':
                popup.querySelector('#quickEditStockIn').value = item.stockIn || 0;
                break;
            case 'stockOut':
                popup.querySelector('#quickEditStockOut').value = item.stockOut || 0;
                break;
            case 'scrap':
                popup.querySelector('#quickEditScrap').value = item.scrapped || 0;
                popup.querySelector('#quickEditScrapReason').value = item.scrapReason || '';
                break;
        }
        
        // Show the popup
        popup.classList.remove('hidden');
    }
}

// Add close quick edit function
function closeQuickEdit(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.classList.add('hidden');
        // Reset the form if it exists
        const form = popup.querySelector('form');
        if (form) form.reset();
    }
}

// Add form submission handlers for quick edits
document.addEventListener('DOMContentLoaded', function() {
    // Stock In quick edit
    document.getElementById('quickStockInEdit').addEventListener('submit', async function(e) {
        e.preventDefault();
        const partNumber = this.querySelector('#quickEditPartNo').value;
        const newQuantity = parseInt(this.querySelector('#quickEditStockIn').value);
        await updateStockData(partNumber, 'stockIn', newQuantity);
        closeQuickEdit('stockInEditPopup');
    });

    // Stock Out quick edit
    document.getElementById('quickStockOutEdit').addEventListener('submit', async function(e) {
        e.preventDefault();
        const partNumber = this.querySelector('#quickEditPartNo').value;
        const newQuantity = parseInt(this.querySelector('#quickEditStockOut').value);
        await updateStockData(partNumber, 'stockOut', newQuantity);
        closeQuickEdit('stockOutEditPopup');
    });

    // Scrap quick edit
    document.getElementById('quickScrapEdit').addEventListener('submit', async function(e) {
        e.preventDefault();
        const partNumber = this.querySelector('#quickEditPartNo').value;
        const newQuantity = parseInt(this.querySelector('#quickEditScrap').value);
        const reason = this.querySelector('#quickEditScrapReason').value;
        await updateStockData(partNumber, 'scrapped', newQuantity, reason);
        closeQuickEdit('scrapEditPopup');
    });
});

function saveTableToStorage() {
    const tbody = document.getElementById('stockTableBody');
    const stockData = Array.from(tbody.rows).map(row => ({
        partNumber: row.cells[1].textContent,
        stockOut: parseInt(row.cells[5].textContent),
        scrapped: parseInt(row.cells[6].textContent)
    }));
    localStorage.setItem('stockData', JSON.stringify(stockData));
}

function deleteStock(partNumber) {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const newData = stockData.filter(item => item.partNumber !== partNumber);
    localStorage.setItem('stockData', JSON.stringify(newData));
    loadTableFromStorage();
}

// Update the editStock function
function editStock(partNumber, type) {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const item = stockData.find(item => item.partNumber === partNumber);
    
    if (item) {
        // Set the common hidden input
        document.getElementById(`edit${type}ItemId`).value = partNumber;
        
        // Set the quantity based on type
        switch(type) {
            case 'stockIn':
                document.getElementById('editStockInQuantity').value = item.stockIn;
                break;
            case 'stockOut':
                document.getElementById('editStockOutQuantity').value = item.stockOut;
                break;
            case 'scrap':
                document.getElementById('editScrapQuantity').value = item.scrapped;
                document.getElementById('editScrapReason').value = item.scrapReason || '';
                break;
        }
        
        // Show modal and correct tab
        document.getElementById('editModal').classList.add('show');
        showTab(type);
    }
}

// Handle form submissions for each tab
async function handleStockInEdit(e) {
    e.preventDefault();
    const partNumber = document.getElementById('editStockInItemId').value;
    const newQuantity = parseInt(document.getElementById('editStockInQuantity').value);
    const submitBtn = document.getElementById('editStockInBtn');
    
    try {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        await updateStockData(partNumber, 'stockIn', newQuantity);
        
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
        submitBtn.innerHTML = '<i class="fas fa-check"></i><span>Updated!</span>';
        
        setTimeout(() => {
            closeEditModal();
        }, 1500);
    } catch (error) {
        console.error('Error:', error);
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('error');
        submitBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Error</span>';
    }
}

async function handleStockOutEdit(e) {
    e.preventDefault();
    const partNumber = document.getElementById('editStockOutItemId').value;
    const newQuantity = parseInt(document.getElementById('editStockOutQuantity').value);
    const submitBtn = document.getElementById('editStockOutBtn');
    
    try {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        await updateStockData(partNumber, 'stockOut', newQuantity);
        
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
        submitBtn.innerHTML = '<i class="fas fa-check"></i><span>Updated!</span>';
        
        setTimeout(() => {
            closeEditModal();
        }, 1500);
    } catch (error) {
        console.error('Error:', error);
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('error');
        submitBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Error</span>';
    }
}

async function handleScrapEdit(e) {
    e.preventDefault();
    const partNumber = document.getElementById('editScrapItemId').value;
    const newQuantity = parseInt(document.getElementById('editScrapQuantity').value);
    const reason = document.getElementById('editScrapReason').value;
    const submitBtn = document.getElementById('editScrapBtn');
    
    try {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        await updateStockData(partNumber, 'scrapped', newQuantity, reason);
        
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
        submitBtn.innerHTML = '<i class="fas fa-check"></i><span>Updated!</span>';
        
        setTimeout(() => {
            closeEditModal();
        }, 1500);
    } catch (error) {
        console.error('Error:', error);
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('error');
        submitBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Error</span>';
    }
}

// Update the updateStockData function
async function updateStockData(partNumber, type, newQuantity, reason = '') {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const itemIndex = stockData.findIndex(item => item.partNumber === partNumber);
    
    if (itemIndex === -1) throw new Error('Part not found');
    
    // Update the quantity based on type
    switch(type) {
        case 'stockIn':
            stockData[itemIndex].stockIn = newQuantity;
            break;
        case 'stockOut':
            stockData[itemIndex].stockOut = newQuantity;
            break;
        case 'scrapped':
            stockData[itemIndex].scrapped = newQuantity;
            if (reason) stockData[itemIndex].scrapReason = reason;
            break;
    }
    
    // Recalculate total
    stockData[itemIndex].total = 
        stockData[itemIndex].stockIn - 
        stockData[itemIndex].stockOut - 
        stockData[itemIndex].scrapped;
    
    // Save to localStorage and update UI
    localStorage.setItem('stockData', JSON.stringify(stockData));
    loadTableFromStorage();
    return true;
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.getElementById('editStockInForm').reset();
    document.getElementById('editStockOutForm').reset();
    document.getElementById('editScrapForm').reset();
}

document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const withdrawBtn = document.querySelector('#withdrawBtn');
    const withdrawModal = document.querySelector('#withdrawModal');
    
    console.log('Withdraw button:', withdrawBtn); // Debug log
    console.log('Withdraw modal:', withdrawModal); // Debug log

    // Add click event listener to withdraw button
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Withdraw button clicked'); // Debug log
            if (withdrawModal) {
                withdrawModal.classList.add('show');
                console.log('Added show class to modal'); // Debug log
            }
        });
    }

    // Close modal when clicking outside
    if (withdrawModal) {
        withdrawModal.addEventListener('click', function(e) {
            if (e.target === withdrawModal) {
                closeWithdrawModal();
            }
        });
    }

    // Handle withdraw form submission
    const withdrawForm = document.querySelector('#withdrawForm');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', handleWithdrawSubmit);
    }

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            showTab(this.dataset.tab);
        });
    });

    // Form submissions
    document.getElementById('editStockInForm').addEventListener('submit', handleStockInEdit);
    document.getElementById('editStockOutForm').addEventListener('submit', handleStockOutEdit);
    document.getElementById('editScrapForm').addEventListener('submit', handleScrapEdit);
});

async function handleWithdrawSubmit(e) {
    e.preventDefault();
    const withdrawSubmitBtn = document.querySelector('#withdrawSubmitBtn');
    
    try {
        withdrawSubmitBtn.classList.add('loading');
        withdrawSubmitBtn.disabled = true;

        const partNumber = document.querySelector('#withdrawPartNumber').value;
        const quantity = parseInt(document.querySelector('#withdrawQuantity').value);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Show success state
        withdrawSubmitBtn.classList.remove('loading');
        withdrawSubmitBtn.classList.add('success');
        withdrawSubmitBtn.innerHTML = '<i class="fas fa-check"></i><span>Withdrawn!</span>';

        // Close modal after delay
        setTimeout(closeWithdrawModal, 1500);

    } catch (error) {
        console.error('Error:', error);
        withdrawSubmitBtn.classList.remove('loading');
        withdrawSubmitBtn.classList.add('error');
        withdrawSubmitBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Error</span>';
    }
}

function closeWithdrawModal() {
    const modal = document.querySelector('#withdrawModal');
    const form = document.querySelector('#withdrawForm');
    if (modal) {
        modal.classList.remove('show');
    }
    if (form) {
        form.reset();
    }
}

function updateTable() {
    const tableBody = document.getElementById('stockTableBody');
    tableBody.innerHTML = '';
    
    stocks.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${index + 1}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.partNumber}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.description}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">${item.quantity}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-emerald-600">
                ${item.stockIn || 0}
                <button onclick="editStockIn(${index})" class="text-emerald-600 hover:text-emerald-800 ml-2">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-amber-600">
                ${item.stockOut || 0}
                <button onclick="editStockOut(${index})" class="text-amber-600 hover:text-amber-800 ml-2">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600">
                ${item.scrap || 0}
                <button onclick="editScrap(${index})" class="text-red-600 hover:text-red-800 ml-2">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm">
                <button onclick="deleteItem(${index})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Add edit functions for each type
function editStockIn(index) {
    const item = stocks[index];
    document.getElementById('editStockInItemId').value = index;
}

// Edit functions for each type
function editStockIn(partNumber) {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const item = stockData.find(item => item.partNumber === partNumber);
    
    if (item) {
        document.getElementById('editStockInItemId').value = partNumber;
        document.getElementById('editStockInQuantity').value = item.stockIn;
        document.getElementById('editModal').classList.add('show');
        showTab('stockIn');
    }
}

function editStockOut(partNumber) {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const item = stockData.find(item => item.partNumber === partNumber);
    
    if (item) {
        document.getElementById('editStockOutItemId').value = partNumber;
        document.getElementById('editStockOutQuantity').value = item.stockOut;
        document.getElementById('editModal').classList.add('show');
        showTab('stockOut');
    }
}

function editScrap(partNumber) {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const item = stockData.find(item => item.partNumber === partNumber);
    
    if (item) {
        document.getElementById('editScrapItemId').value = partNumber;
        document.getElementById('editScrapQuantity').value = item.scrapped;
        document.getElementById('editScrapReason').value = item.scrapReason || '';
        document.getElementById('editModal').classList.add('show');
        showTab('scrap');
    }
}

// Handle form submissions for each edit type
async function handleStockInEdit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('editStockInBtn');
    
    try {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const partNumber = document.getElementById('editStockInItemId').value;
        const newQuantity = parseInt(document.getElementById('editStockInQuantity').value);
        
        await updateStockQuantity(partNumber, 'stockIn', newQuantity);
        
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
        submitBtn.innerHTML = '<i class="fas fa-check"></i><span>Updated!</span>';
        
        setTimeout(closeEditModal, 1500);
    } catch (error) {
        showError(submitBtn, error.message);
    }
}

async function handleStockOutEdit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('editStockOutBtn');
    
    try {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const partNumber = document.getElementById('editStockOutItemId').value;
        const newQuantity = parseInt(document.getElementById('editStockOutQuantity').value);
        
        await updateStockQuantity(partNumber, 'stockOut', newQuantity);
        
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
        submitBtn.innerHTML = '<i class="fas fa-check"></i><span>Updated!</span>';
        
        setTimeout(closeEditModal, 1500);
    } catch (error) {
        showError(submitBtn, error.message);
    }
}

async function handleScrapEdit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('editScrapBtn');
    
    try {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const partNumber = document.getElementById('editScrapItemId').value;
        const newQuantity = parseInt(document.getElementById('editScrapQuantity').value);
        const reason = document.getElementById('editScrapReason').value;
        
        await updateStockQuantity(partNumber, 'scrapped', newQuantity, reason);
        
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
        submitBtn.innerHTML = '<i class="fas fa-check"></i><span>Updated!</span>';
        
        setTimeout(closeEditModal, 1500);
    } catch (error) {
        showError(submitBtn, error.message);
    }
}

// Helper functions
async function updateStockQuantity(partNumber, type, newQuantity, reason = '') {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const itemIndex = stockData.findIndex(item => item.partNumber === partNumber);
    
    if (itemIndex === -1) throw new Error('Part not found');
    
    // Update the quantity
    stockData[itemIndex][type] = newQuantity;
    
    // Update reason for scrap
    if (reason) {
        stockData[itemIndex].scrapReason = reason;
    }
    
    // Recalculate total
    stockData[itemIndex].total = 
        stockData[itemIndex].stockIn - 
        stockData[itemIndex].stockOut - 
        stockData[itemIndex].scrapped;
    
    // Save and update UI
    localStorage.setItem('stockData', JSON.stringify(stockData));
    loadTableFromStorage();
}

function showError(button, message) {
    button.classList.remove('loading');
    button.classList.add('error');
    button.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${message}</span>`;
    
    setTimeout(() => {
        button.classList.remove('error');
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-save"></i><span>Update</span>';
    }, 2000);
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
        tab.classList.remove('active');
    });
    
    // Deactivate all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}Tab`).classList.remove('hidden');
    document.getElementById(`${tabName}Tab`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.remove('show');
    }
    document.getElementById('editStockInForm').reset();
    document.getElementById('editStockOutForm').reset();
    document.getElementById('editScrapForm').reset();
}

document.addEventListener('DOMContentLoaded', function() {
    // Get table body
    const tbody = document.getElementById('stockTableBody');
    
    // Load initial data
    loadTableFromStorage();
    
    // Add click handlers for edit buttons in the table
    tbody.addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (!target) return;
        
        if (target.classList.contains('edit-stock-in')) {
            const partNumber = target.dataset.part;
            editStockIn(partNumber);
        }
        else if (target.classList.contains('edit-stock-out')) {
            const partNumber = target.dataset.part;
            editStockOut(partNumber);
        }
        else if (target.classList.contains('edit-scrap')) {
            const partNumber = target.dataset.part;
            editScrap(partNumber);
        }
    });

    // Handle form submissions
    document.getElementById('editStockInForm').addEventListener('submit', handleStockInEdit);
    document.getElementById('editStockOutForm').addEventListener('submit', handleStockOutEdit);
    document.getElementById('editScrapForm').addEventListener('submit', handleScrapEdit);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => showTab(btn.dataset.tab));
    });
});

function loadTableFromStorage() {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const tbody = document.getElementById('stockTableBody');
    
    tbody.innerHTML = stockData.map((item, index) => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 text-sm text-gray-900">${index + 1}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${item.partNumber}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${item.materialDesc}</td>
            <td class="px-6 py-4 text-sm font-medium ${item.total < 0 ? 'text-red-600' : 'text-gray-900'}">${item.total}</td>
            <td class="px-6 py-4 text-center text-sm text-emerald-600">
                ${item.stockIn}
                <button class="edit-stock-in ml-2" data-part="${item.partNumber}">
                    <i class="fas fa-edit text-emerald-600 hover:text-emerald-800"></i>
                </button>
            </td>
            <td class="px-6 py-4 text-center text-sm text-amber-600">
                ${item.stockOut}
                <button class="edit-stock-out ml-2" data-part="${item.partNumber}">
                    <i class="fas fa-edit text-amber-600 hover:text-amber-800"></i>
                </button>
            </td>
            <td class="px-6 py-4 text-center text-sm text-red-600">
                ${item.scrapped}
                <button class="edit-scrap ml-2" data-part="${item.partNumber}">
                    <i class="fas fa-edit text-red-600 hover:text-red-800"></i>
                </button>
            </td>
            <td class="px-6 py-4 text-center">
                <button onclick="deleteStock('${item.partNumber}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function editStockIn(partNumber) {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const item = stockData.find(item => item.partNumber === partNumber);
    
    if (item) {
        document.getElementById('editStockInItemId').value = partNumber;
        document.getElementById('editStockInQuantity').value = item.stockIn;
        document.getElementById('editModal').classList.add('show');
        showTab('stockIn');
    }
}

function editStockOut(partNumber) {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const item = stockData.find(item => item.partNumber === partNumber);
    
    if (item) {
        document.getElementById('editStockOutItemId').value = partNumber;
        document.getElementById('editStockOutQuantity').value = item.stockOut;
        document.getElementById('editModal').classList.add('show');
        showTab('stockOut');
    }
}

function editScrap(partNumber) {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const item = stockData.find(item => item.partNumber === partNumber);
    
    if (item) {
        document.getElementById('editScrapItemId').value = partNumber;
        document.getElementById('editScrapQuantity').value = item.scrapped;
        document.getElementById('editScrapReason').value = item.scrapReason || '';
        document.getElementById('editModal').classList.add('show');
        showTab('scrap');
    }
}

async function updateStockData(partNumber, type, newQuantity, reason = '') {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const itemIndex = stockData.findIndex(item => item.partNumber === partNumber);
    
    if (itemIndex === -1) throw new Error('Part not found');
    
    stockData[itemIndex][type] = newQuantity;
    if (reason) stockData[itemIndex].scrapReason = reason;
    
    stockData[itemIndex].total = 
        stockData[itemIndex].stockIn - 
        stockData[itemIndex].stockOut - 
        stockData[itemIndex].scrapped;
    
    localStorage.setItem('stockData', JSON.stringify(stockData));
    loadTableFromStorage();
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${tabName}Tab`).classList.remove('hidden');
    document.getElementById(`${tabName}Tab`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.remove('show');
        document.getElementById('editStockInForm').reset();
        document.getElementById('editStockOutForm').reset();
        document.getElementById('editScrapForm').reset();
    }
}

// Form submission handlers
async function handleStockInEdit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const partNumber = document.getElementById('editStockInItemId').value;
        const newQuantity = parseInt(document.getElementById('editStockInQuantity').value);
        
        await updateStockData(partNumber, 'stockIn', newQuantity);
        
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
        submitBtn.innerHTML = '<i class="fas fa-check"></i><span>Updated!</span>';
        
        setTimeout(closeEditModal, 1500);
    } catch (error) {
        console.error('Error:', error);
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('error');
        submitBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Error</span>';
    }
}

async function handleStockOutEdit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const partNumber = document.getElementById('editStockOutItemId').value;
        const newQuantity = parseInt(document.getElementById('editStockOutQuantity').value);
        
        await updateStockData(partNumber, 'stockOut', newQuantity);
        
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
        submitBtn.innerHTML = '<i class="fas fa-check"></i><span>Updated!</span>';
        
        setTimeout(closeEditModal, 1500);
    } catch (error) {
        console.error('Error:', error);
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('error');
        submitBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Error</span>';
    }
}

async function handleScrapEdit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    try {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const partNumber = document.getElementById('editScrapItemId').value;
        const newQuantity = parseInt(document.getElementById('editScrapQuantity').value);
        const reason = document.getElementById('editScrapReason').value;
        
        await updateStockData(partNumber, 'scrapped', newQuantity, reason);
        
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('success');
        submitBtn.innerHTML = '<i class="fas fa-check"></i><span>Updated!</span>';
        
        setTimeout(closeEditModal, 1500);
    } catch (error) {
        console.error('Error:', error);
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('error');
        submitBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Error</span>';
    }
}

// Helper function to save stocks
function saveStocks() {
    localStorage.setItem('stocks', JSON.stringify(stocks));
}

// Helper function to close modal
function closeModal() {
    const modal = document.getElementById('inwardModal');
    if (modal) {
        modal.classList.remove('show');
    }
}
