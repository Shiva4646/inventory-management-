function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function exportToExcel() {
    const stocks = JSON.parse(localStorage.getItem('stocks')) || [];
    const currentDate = formatDate(new Date());
    const fileName = `report-${currentDate}.xlsx`;

    // Create workbook data
    const workbookData = [
        // Header row
        ['Part Number', 'Description', 'Stock In', 'Stock Out', 'Scrap', 'Current Stock', 'Last Updated', 'Scrap Reason']
    ];

    // Add data rows
    stocks.forEach(item => {
        workbookData.push([
            item.partNumber,
            item.description,
            item.stockIn || 0,
            item.stockOut || 0,
            item.scrap || 0,
            (item.stockIn || 0) - (item.stockOut || 0) - (item.scrap || 0),
            new Date().toLocaleDateString(),
            item.scrapReason || ''
        ]);
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(workbookData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Report');

    // Save file
    XLSX.writeFile(wb, fileName);
}

document.addEventListener('DOMContentLoaded', function() {
    loadReportData();
    setupFilterListeners();

    // Mobile menu toggle
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenu?.contains(e.target) && 
            !mobileMenuButton?.contains(e.target) && 
            !mobileMenu?.classList.contains('hidden')) {
            mobileMenu?.classList.add('hidden');
        }
    });

    // Add export button handler
    document.getElementById('exportBtn')?.addEventListener('click', exportToExcel);
});

function loadReportData() {
    const stocks = JSON.parse(localStorage.getItem('stocks')) || [];
    const tbody = document.querySelector('#reportTableBody');
    
    if (!tbody) return;
    tbody.innerHTML = '';

    stocks.forEach(item => {
        // Show stock in entries
        if (item.stockIn > 0) {
            addTableRow(tbody, {
                partNo: item.partNumber,
                description: item.description,
                quantity: item.stockIn,
                date: item.date || new Date().toLocaleDateString(),
                movement: 'in',
                unit: 'PC',
                status: 'Stock In'
            });
        }

        // Show stock out entries
        if (item.stockOut > 0) {
            addTableRow(tbody, {
                partNo: item.partNumber,
                description: item.description,
                quantity: -item.stockOut,
                date: item.date || new Date().toLocaleDateString(),
                movement: 'out',
                unit: 'PC',
                status: 'Stock Out'
            });
        }

        // Show scrapped entries with reason
        if (item.scrap && item.scrap > 0) {
            addTableRow(tbody, {
                partNo: item.partNumber,
                description: item.description,
                quantity: -item.scrap,
                date: item.scrapDate || new Date().toLocaleDateString(),
                movement: 'scrap',
                unit: 'PC',
                status: 'Scrapped',
                reason: item.scrapReason || 'No reason provided'
            });
        }
    });
}

function addTableRow(tbody, data) {
    const tr = document.createElement('tr');
    tr.classList.add('hover:bg-gray-50');
    
    tr.innerHTML = `
        <td class="px-6 py-4">${data.partNo}</td>
        <td class="px-6 py-4">${data.description || '-'}</td>
        <td class="px-6 py-4">${data.date}</td>
        <td class="px-6 py-4 text-center">
            <span class="status-badge status-${data.movement}">
                ${data.quantity >= 0 ? '+' : ''}${data.quantity}
            </span>
        </td>
        <td class="px-6 py-4">${data.unit}</td>
        <td class="px-6 py-4 text-center">
            ${data.movement === 'scrap' ? 
                `<span class="status-badge status-${data.movement} tooltip" data-tooltip="${data.reason}">
                    ${data.status}
                </span>` : 
                `<span class="status-badge status-${data.movement}">
                    ${data.status}
                </span>`
            }
        </td>
    `;
    
    tbody.appendChild(tr);
}

function setupFilterListeners() {
    const searchInput = document.getElementById('searchInput');
    const movementFilter = document.getElementById('movementFilter');
    const dateFilter = document.getElementById('dateFilter');
    const applyFilters = document.getElementById('applyFilters');

    if (searchInput) searchInput.addEventListener('input', filterReportData);
    if (movementFilter) movementFilter.addEventListener('change', filterReportData);
    if (dateFilter) dateFilter.addEventListener('change', filterReportData);
    if (applyFilters) applyFilters.addEventListener('click', filterReportData);
}

function filterReportData() {
    const searchText = document.getElementById('searchInput')?.value.trim();
    const typeFilter = document.getElementById('movementFilter')?.value;
    const stocks = JSON.parse(localStorage.getItem('stocks')) || [];
    const tbody = document.querySelector('#reportTableBody');
    
    if (!tbody) return;
    tbody.innerHTML = '';
    
    stocks.forEach(item => {
        // Strict part number matching
        if (searchText && item.partNumber !== searchText) {
            return;
        }

        // Apply movement type filter
        switch(typeFilter) {
            case 'in':
                if (item.stockIn > 0) {
                    addTableRow(tbody, {
                        partNo: item.partNumber,
                        description: item.description,
                        quantity: item.stockIn,
                        date: item.date || new Date().toLocaleDateString(),
                        movement: 'in',
                        unit: 'PC',
                        status: 'Stock In'
                    });
                }
                break;
            case 'out':
                if (item.stockOut > 0) {
                    addTableRow(tbody, {
                        partNo: item.partNumber,
                        description: item.description,
                        quantity: -item.stockOut,
                        date: item.date || new Date().toLocaleDateString(),
                        movement: 'out',
                        unit: 'PC',
                        status: 'Stock Out'
                    });
                }
                break;
            case 'scrap':
                if (item.scrap && item.scrap > 0) {
                    addTableRow(tbody, {
                        partNo: item.partNumber,
                        description: item.description,
                        quantity: -item.scrap,
                        date: item.scrapDate || new Date().toLocaleDateString(),
                        movement: 'scrap',
                        unit: 'PC',
                        status: 'Scrapped',
                        reason: item.scrapReason || 'No reason provided'
                    });
                }
                break;
            default:
                // Show all movements for this item
                if (item.stockIn > 0) {
                    addTableRow(tbody, {
                        partNo: item.partNumber,
                        description: item.description,
                        quantity: item.stockIn,
                        date: item.date || new Date().toLocaleDateString(),
                        movement: 'in',
                        unit: 'PC',
                        status: 'Stock In'
                    });
                }
                if (item.stockOut > 0) {
                    addTableRow(tbody, {
                        partNo: item.partNumber,
                        description: item.description,
                        quantity: -item.stockOut,
                        date: item.date || new Date().toLocaleDateString(),
                        movement: 'out',
                        unit: 'PC',
                        status: 'Stock Out'
                    });
                }
                if (item.scrap && item.scrap > 0) {
                    addTableRow(tbody, {
                        partNo: item.partNumber,
                        description: item.description,
                        quantity: -item.scrap,
                        date: item.scrapDate || new Date().toLocaleDateString(),
                        movement: 'scrap',
                        unit: 'PC',
                        status: 'Scrapped',
                        reason: item.scrapReason || 'No reason provided'
                    });
                }
        }
    });

    // Show "No results found" if table is empty
    if (!tbody.children.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    No matching records found
                </td>
            </tr>
        `;
    }
}

// Add input event listener for real-time filtering
document.getElementById('searchInput')?.addEventListener('input', filterReportData);