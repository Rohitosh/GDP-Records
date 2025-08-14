class GDPManager {
    constructor() {
        this.baseURL = '/api/gdp'; // adapt if your API path differs
        this.currentEditId = null;
        this.allRecords = [];
        this.elementsReady = false;

        // Wait for DOM ready before binding events
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // build references to DOM controls (if they exist)
        this.cacheElements();
        this.bindEvents();
        // attempt first load
        this.loadGDPRecords();
        this.loadStatistics();

        // expose for debug in console
        window.gdpManager = this;
    }

    cacheElements() {
        // Store references; may be null if element missing
        this.el = {
            addBtn: document.getElementById('addBtn'),
            modal: document.getElementById('modal'),
            closeBtn: document.querySelector('.close'),
            cancelBtn: document.getElementById('cancelBtn'),
            gdpForm: document.getElementById('gdpForm'),
            searchCountry: document.getElementById('searchCountry'),
            filterRegion: document.getElementById('filterRegion'),
            filterYear: document.getElementById('filterYear'),
            resetFilters: document.getElementById('resetFilters'),
            tableBody: document.querySelector('#gdpTable tbody'),
            statsContainer: document.getElementById('statsContainer'),
            loadingEl: document.getElementById('loading')
        };
    }

    bindEvents() {
        // Only bind if element exists. Use arrow functions so `this` is lexical (the instance).
        if (this.el.addBtn) {
            this.el.addBtn.addEventListener('click', () => this.openModal());
        }

        if (this.el.closeBtn) {
            this.el.closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (this.el.cancelBtn) {
            this.el.cancelBtn.addEventListener('click', () => this.closeModal());
        }

        if (this.el.gdpForm) {
            this.el.gdpForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        if (this.el.searchCountry) {
            this.el.searchCountry.addEventListener('input', () => this.filterRecords());
        }
        if (this.el.filterRegion) {
            this.el.filterRegion.addEventListener('change', () => this.filterRecords());
        }
        if (this.el.filterYear) {
            this.el.filterYear.addEventListener('change', () => this.filterRecords());
        }
        if (this.el.resetFilters) {
            this.el.resetFilters.addEventListener('click', () => this.resetFilters());
        }

        // Close modal on click outside content
        if (this.el.modal) {
            this.el.modal.addEventListener('click', (e) => {
                if (e.target === this.el.modal) this.closeModal();
            });
        }
    }

    // ---------------------------
    // Data loading & rendering
    // ---------------------------
    async loadGDPRecords() {
        try {
            this.showLoading(true);
            const response = await fetch(this.baseURL);
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const data = await response.json();

            // Expecting { success: true, data: [...] }
            if (data && data.success && Array.isArray(data.data)) {
                this.allRecords = data.data;
            } else if (Array.isArray(data)) {
                // fallback if API returns array directly
                this.allRecords = data;
            } else {
                this.allRecords = [];
            }

            this.renderTable(this.allRecords);
        } catch (error) {
            console.error('loadGDPRecords error:', error);
            this.showError('Failed to load GDP records.');
            this.renderTable([]); // clear table
        } finally {
            this.showLoading(false);
        }
    }

    async loadStatistics() {
        // Example: compute simple stats on records currently loaded
        try {
            if (!this.allRecords || this.allRecords.length === 0) {
                // optionally fetch if not loaded
                await this.loadGDPRecords();
            }

            const records = this.allRecords || [];
            const total = records.length;
            const years = [...new Set(records.map(r => r.year))].length;
            const regions = [...new Set(records.map(r => r.region))].length;

            this.renderStatistics({ total, years, regions });
        } catch (error) {
            console.error('loadStatistics error:', error);
            this.renderStatistics({ total: 0, years: 0, regions: 0 });
        }
    }

    renderStatistics({ total = 0, years = 0, regions = 0 } = {}) {
        if (!this.el.statsContainer) return;
        this.el.statsContainer.innerHTML = `
            <div class="stat-card glass">
                <h3>${total}</h3>
                <p>Total records</p>
            </div>
            <div class="stat-card glass">
                <h3>${years}</h3>
                <p>Distinct years</p>
            </div>
            <div class="stat-card glass">
                <h3>${regions}</h3>
                <p>Distinct regions</p>
            </div>
        `;
    }

    renderTable(records = []) {
        // records: array of objects { _id, country, year, gdp, region, ... }
        if (!this.el.tableBody) return;
        const tbody = this.el.tableBody;
        tbody.innerHTML = '';

        if (!records.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:1.5rem;">No records found</td></tr>`;
            return;
        }

        // Build rows
        const rows = records.map(r => {
            const id = r._id || r.id || '';
            const country = r.country || r.name || '-';
            const year = r.year || '-';
            const gdp = r.gdp ?? r.value ?? '-';
            const region = r.region || '-';

            return `
                <tr data-id="${id}">
                    <td>${country}</td>
                    <td>${region}</td>
                    <td>${year}</td>
                    <td>${gdp}</td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-edit" data-action="edit" data-id="${id}">Edit</button>
                            <button class="btn btn-danger" data-action="delete" data-id="${id}">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('\n');

        tbody.innerHTML = rows;

        // attach per-row buttons
        tbody.querySelectorAll('button[data-action]').forEach(btn => {
            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');
            if (action === 'edit') {
                btn.addEventListener('click', () => this.editRecord(id));
            } else if (action === 'delete') {
                btn.addEventListener('click', () => this.deleteRecord(id));
            }
        });
    }

    // ---------------------------
    // CRUD operations
    // ---------------------------
    async editRecord(id) {
        if (!id) return;
        try {
            const response = await fetch(`${this.baseURL}/${id}`);
            if (!response.ok) throw new Error('Failed to fetch record');
            const data = await response.json();
            if (data && data.success) {
                this.openModal(data.data);
            } else {
                this.showError('Failed to load record for editing');
            }
        } catch (error) {
            console.error('editRecord error:', error);
            this.showError('Error loading record');
        }
    }

    async deleteRecord(id) {
        if (!id) return;
        if (!confirm('Are you sure you want to delete this GDP record?')) return;

        try {
            const response = await fetch(`${this.baseURL}/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result && result.success) {
                this.showSuccess('Record deleted successfully');
                await this.loadGDPRecords();
                await this.loadStatistics();
            } else {
                this.showError(result?.message || 'Delete failed');
            }
        } catch (error) {
            console.error('deleteRecord error:', error);
            this.showError('Error deleting record');
        }
    }

    // ---------------------------
    // Modal & Form
    // ---------------------------
    openModal(data = null) {
        // Show modal and fill form if data passed
        if (!this.el.modal) return;
        this.el.modal.classList.remove('hidden');

        // populate form fields if any
        if (data && this.el.gdpForm) {
            // map known fields if present
            const f = this.el.gdpForm;
            if (f.querySelector('[name="country"]')) f.querySelector('[name="country"]').value = data.country || '';
            if (f.querySelector('[name="region"]')) f.querySelector('[name="region"]').value = data.region || '';
            if (f.querySelector('[name="year"]')) f.querySelector('[name="year"]').value = data.year || '';
            if (f.querySelector('[name="gdp"]')) f.querySelector('[name="gdp"]').value = data.gdp ?? data.value ?? '';
            this.currentEditId = data._id || data.id || null;
        } else {
            this.currentEditId = null;
            if (this.el.gdpForm) this.el.gdpForm.reset();
        }
    }

    closeModal() {
        if (!this.el.modal) return;
        this.el.modal.classList.add('hidden');
        this.currentEditId = null;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        if (!this.el.gdpForm) return;

        const formData = new FormData(this.el.gdpForm);
        const payload = {};
        for (const [k, v] of formData.entries()) payload[k] = v;

        try {
            const method = this.currentEditId ? 'PUT' : 'POST';
            const url = this.currentEditId ? `${this.baseURL}/${this.currentEditId}` : this.baseURL;
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result && result.success) {
                this.showSuccess(this.currentEditId ? 'Updated successfully' : 'Created successfully');
                this.closeModal();
                await this.loadGDPRecords();
                await this.loadStatistics();
            } else {
                this.showError(result?.message || 'Save failed');
            }
        } catch (error) {
            console.error('handleFormSubmit error:', error);
            this.showError('Error saving record');
        }
    }

    // ---------------------------
    // Filters
    // ---------------------------
    filterRecords() {
        const country = this.el.searchCountry?.value?.toLowerCase()?.trim() || '';
        const region = this.el.filterRegion?.value || '';
        const year = this.el.filterYear?.value || '';

        let filtered = [...this.allRecords];

        if (country) {
            filtered = filtered.filter(r => (r.country || '').toLowerCase().includes(country));
        }
        if (region) {
            filtered = filtered.filter(r => (r.region || '') === region);
        }
        if (year) {
            filtered = filtered.filter(r => String(r.year) === String(year));
        }

        this.renderTable(filtered);
    }

    resetFilters() {
        if (this.el.searchCountry) this.el.searchCountry.value = '';
        if (this.el.filterRegion) this.el.filterRegion.value = '';
        if (this.el.filterYear) this.el.filterYear.value = '';
        this.renderTable(this.allRecords);
    }

    // ---------------------------
    // UI helpers
    // ---------------------------
    showLoading(flag) {
        if (!this.el.loadingEl) return;
        this.el.loadingEl.classList.toggle('hidden', !flag);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle')}"></i>
            <span style="margin-left:0.5rem">${message}</span>
        `;
        notification.style.position = 'fixed';
        notification.style.right = '20px';
        notification.style.bottom = '20px';
        notification.style.padding = '0.8rem 1rem';
        notification.style.borderRadius = '8px';
        notification.style.background = type === 'success' ? 'rgba(34,197,94,0.95)' : (type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(59,130,246,0.95)');
        notification.style.color = '#fff';
        notification.style.zIndex = 9999;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// initialize
new GDPManager();
