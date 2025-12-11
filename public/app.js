class Dashboard {
    constructor() {
        this.locations = ['dows-lake', 'fifth-avenue', 'nac'];
        this.charts = {};
        this.refreshInterval = 30000; // 30 seconds
        this.refreshTimer = 30;
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initCharts();
        this.loadData();
        this.startAutoRefresh();
    }
    
    setupEventListeners() {
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadData();
        });
    }
    
    initCharts() {
        // Ice Thickness Chart
        const iceCtx = document.getElementById('iceChart').getContext('2d');
        this.charts.ice = new Chart(iceCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Dow\'s Lake',
                        data: [],
                        borderColor: '#0d6efd',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Fifth Avenue',
                        data: [],
                        borderColor: '#6f42c1',
                        backgroundColor: 'rgba(111, 66, 193, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'NAC',
                        data: [],
                        borderColor: '#20c997',
                        backgroundColor: 'rgba(32, 201, 151, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.raw} cm`
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Ice Thickness (cm)'
                        },
                        suggestedMin: 20,
                        suggestedMax: 40
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                }
            }
        });
        
        // Temperature Chart
        const tempCtx = document.getElementById('tempChart').getContext('2d');
        this.charts.temp = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Surface Temperature',
                        data: [],
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'External Temperature',
                        data: [],
                        borderColor: '#fd7e14',
                        backgroundColor: 'rgba(253, 126, 20, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        },
                        suggestedMin: -10,
                        suggestedMax: 5
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                }
            }
        });
    }
    
    async loadData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        document.getElementById('refresh-btn').disabled = true;
        
        try {
            // Load all data in parallel
            const [latestData, systemStatus, historicalData] = await Promise.all([
                this.fetchData('/api/data/latest'),
                this.fetchData('/api/status'),
                this.fetchData('/api/data/historical')
            ]);
            
            this.updateLocationCards(latestData);
            this.updateSystemStatus(systemStatus);
            this.updateDataTable(latestData);
            this.updateCharts(historicalData);
            this.updateLastUpdated();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load data. Please check connection.');
        } finally {
            this.isLoading = false;
            document.getElementById('refresh-btn').disabled = false;
            this.resetRefreshTimer();
        }
    }
    
    async fetchData(endpoint) {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    }
    
    updateLocationCards(data) {
        const container = document.getElementById('location-cards');
        container.innerHTML = '';
        
        const template = document.getElementById('location-card-template');
        
        this.locations.forEach(location => {
            const locationData = data.find(item => item.location === location);
            const card = template.content.cloneNode(true);
            
            // Update card content
            const cardElement = card.querySelector('.location-card');
            const locationName = card.querySelector('.location-name');
            const statusBadge = card.querySelector('.status-badge');
            const iceValue = card.querySelector('.ice-value');
            const tempValue = card.querySelector('.temp-value');
            const snowValue = card.querySelector('.snow-value');
            const extTempValue = card.querySelector('.ext-temp-value');
            const updateTime = card.querySelector('.update-time');
            
            locationName.textContent = this.formatLocationName(location);
            
            if (locationData) {
                // Update status and styling
                const status = locationData.safetyStatus;
                cardElement.classList.add(status);
                statusBadge.textContent = status;
                statusBadge.className = `status-badge badge bg-${status.toLowerCase()}`;
                
                // Update sensor readings
                iceValue.textContent = `${locationData.avgIceThickness} cm`;
                tempValue.textContent = `${locationData.avgSurfaceTemperature} °C`;
                snowValue.textContent = `${locationData.maxSnowAccumulation} cm`;
                extTempValue.textContent = `${locationData.avgExternalTemperature} °C`;
                
                // Update time
                const time = new Date(locationData.timestamp);
                updateTime.textContent = time.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                // Add color indicators
                iceValue.style.color = this.getIceColor(locationData.avgIceThickness);
                tempValue.style.color = this.getTempColor(locationData.avgSurfaceTemperature);
            } else {
                // No data available
                statusBadge.textContent = 'No Data';
                statusBadge.className = 'status-badge badge bg-secondary';
                iceValue.textContent = '-- cm';
                tempValue.textContent = '-- °C';
                snowValue.textContent = '-- cm';
                extTempValue.textContent = '-- °C';
                updateTime.textContent = '--:--';
            }
            
            container.appendChild(card);
        });
    }
    
    updateSystemStatus(status) {
        const systemStatusEl = document.getElementById('system-status');
        const lastUpdatedEl = document.getElementById('last-updated');
        
        systemStatusEl.textContent = status.overallStatus;
        systemStatusEl.className = `badge bg-${status.overallStatus.toLowerCase()}`;
        
        const time = new Date(status.lastUpdated);
        lastUpdatedEl.textContent = time.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    updateDataTable(data) {
        const tbody = document.getElementById('table-body');
        tbody.innerHTML = '';
        
        data.forEach(item => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td><strong>${this.formatLocationName(item.location)}</strong></td>
                <td>
                    <span class="badge ${this.getIceBadgeClass(item.avgIceThickness)}">
                        ${item.avgIceThickness} cm
                    </span>
                </td>
                <td>${item.avgSurfaceTemperature} °C</td>
                <td>${item.maxSnowAccumulation} cm</td>
                <td>${item.avgExternalTemperature} °C</td>
                <td>${item.readingCount}</td>
                <td>
                    <span class="badge bg-${item.safetyStatus.toLowerCase()}">
                        ${item.safetyStatus}
                    </span>
                </td>
                <td>${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    updateCharts(historicalData) {
        // Group data by location
        const groupedData = {};
        this.locations.forEach(location => {
            groupedData[location] = historicalData.filter(item => item.location === location);
        });
        
        // Prepare chart data
        const timeLabels = [...new Set(historicalData.map(item => 
            new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        ))].sort();
        
        // Update Ice Chart
        this.charts.ice.data.labels = timeLabels;
        this.charts.ice.data.datasets[0].data = this.getChartData(groupedData['dows-lake'], 'avgIceThickness', timeLabels.length);
        this.charts.ice.data.datasets[1].data = this.getChartData(groupedData['fifth-avenue'], 'avgIceThickness', timeLabels.length);
        this.charts.ice.data.datasets[2].data = this.getChartData(groupedData['nac'], 'avgIceThickness', timeLabels.length);
        this.charts.ice.update();
        
        // Update Temperature Chart (using first location as example)
        if (groupedData['dows-lake'].length > 0) {
            this.charts.temp.data.labels = timeLabels;
            this.charts.temp.data.datasets[0].data = this.getChartData(groupedData['dows-lake'], 'avgSurfaceTemperature', timeLabels.length);
            this.charts.temp.data.datasets[1].data = this.getChartData(groupedData['dows-lake'], 'avgExternalTemperature', timeLabels.length);
            this.charts.temp.update();
        }
    }
    
    getChartData(dataArray, property, expectedLength) {
        if (!dataArray || dataArray.length === 0) {
            return Array(expectedLength).fill(null);
        }
        
        // Map data to chart format
        const result = dataArray.map(item => item[property]);
        
        // Pad with nulls if needed
        while (result.length < expectedLength) {
            result.unshift(null);
        }
        
        return result.slice(-expectedLength);
    }
    
    updateLastUpdated() {
        const now = new Date();
        document.getElementById('last-updated').textContent = 
            now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    
    startAutoRefresh() {
        setInterval(() => {
            this.refreshTimer--;
            document.getElementById('refresh-timer').textContent = this.refreshTimer;
            
            if (this.refreshTimer <= 0) {
                this.loadData();
            }
        }, 1000);
    }
    
    resetRefreshTimer() {
        this.refreshTimer = 30;
        document.getElementById('refresh-timer').textContent = this.refreshTimer;
    }
    
    formatLocationName(location) {
        const names = {
            'dows-lake': 'Dow\'s Lake',
            'fifth-avenue': 'Fifth Avenue',
            'nac': 'NAC (National Arts Centre)'
        };
        return names[location] || location;
    }
    
    getIceColor(thickness) {
        if (thickness >= 30) return '#28a745'; // Safe - green
        if (thickness >= 25) return '#ffc107'; // Caution - yellow
        return '#dc3545'; // Unsafe - red
    }
    
    getTempColor(temp) {
        if (temp <= -2) return '#0d6efd'; // Very cold - blue
        if (temp <= 0) return '#ffc107'; // Cold - yellow
        return '#dc3545'; // Above freezing - red
    }
    
    getIceBadgeClass(thickness) {
        if (thickness >= 30) return 'bg-success';
        if (thickness >= 25) return 'bg-warning';
        return 'bg-danger';
    }
    
    showError(message) {
        // Create or update error alert
        let alert = document.querySelector('.alert.alert-danger');
        if (!alert) {
            alert = document.createElement('div');
            alert.className = 'alert alert-danger alert-dismissible fade show';
            alert.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            document.querySelector('.container-fluid').prepend(alert);
        } else {
            alert.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();
    window.dashboard = dashboard; // Make accessible for debugging
});