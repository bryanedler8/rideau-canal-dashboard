# Rideau Canal Skateway Monitoring Dashboard

## Overview

### Dashboard Features
- **Real-time Monitoring:** Live data updates from three Rideau Canal locations
- **Safety Status Indicators:** Color-coded safety badges (Safe/Caution/Unsafe) based on ice conditions
- **Interactive Charts:** Historical trends for ice thickness and temperature
- **Auto-refresh:** Automatic updates every 30 seconds
- **Responsive Design:** Works on desktop, tablet, and mobile devices
- **Data Table:** Detailed view of latest sensor readings
- **System Status:** Overall monitoring system health indicator

### Technologies Used
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Charts:** Chart.js for data visualization
- **Styling:** Bootstrap 5 for responsive design
- **Backend:** Node.js with Express.js
- **Database:** Azure Cosmos DB with @azure/cosmos SDK
- **Hosting:** Azure App Service
- **Icons:** Font Awesome 6

## Prerequisites

Before installation, ensure you have:
1. **Node.js 18+** and npm installed
2. **Azure Cosmos DB** account with:
   - Database: `RideauCanalDB`
   - Container: `SensorAggregations`
3. **Stream Analytics** job running with data flowing to Cosmos DB
4. **Modern web browser** (Chrome, Firefox, Edge, Safari)

## Installation

### Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/rideau-canal-dashboard.git
cd rideau-canal-dashboard

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

The dashboard will be available at: `http://localhost:3000`

### Production Installation
```bash
# Install dependencies
npm install --production

# Set environment variables (see Configuration section)
# Start server
npm start
```

## Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
COSMOS_DB_ENDPOINT=https://your-cosmos-account.documents.azure.com:443/
COSMOS_DB_KEY=your-primary-key-here
COSMOS_DB_DATABASE=RideauCanalDB
COSMOS_DB_CONTAINER=SensorAggregations
```

### Get Cosmos DB Credentials
1. Go to **Azure Portal** → **Cosmos DB account**
2. Copy **URI** from Overview page → `COSMOS_DB_ENDPOINT`
3. Go to **Keys** → Copy **PRIMARY KEY** → `COSMOS_DB_KEY`

### Optional Configuration
```env
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
```

## API Endpoints

### 1. Health Check
**GET** `/api/health`
- **Description:** Checks database connectivity and server status
- **Response:**
```json
{
  "status": "healthy",
  "cosmosDB": "connected",
  "timestamp": "2024-12-16T13:00:00.000Z"
}
```

### 2. Latest Data
**GET** `/api/data/latest`
- **Description:** Returns latest aggregated data for all three locations
- **Response:**
```json
[
  {
    "id": "dows-lake-2024-12-16T13:05:00",
    "location": "dows-lake",
    "timestamp": "2024-12-16T13:05:00",
    "avgIceThickness": 32.5,
    "minIceThickness": 30.2,
    "maxIceThickness": 34.8,
    "avgSurfaceTemperature": -2.5,
    "minSurfaceTemperature": -3.1,
    "maxSurfaceTemperature": -1.9,
    "maxSnowAccumulation": 8.7,
    "avgExternalTemperature": -1.8,
    "readingCount": 30,
    "safetyStatus": "Safe"
  }
]
```

### 3. Location Data
**GET** `/api/data/location/:location`
- **Description:** Returns historical data for a specific location (last hour)
- **Parameters:** `location` (dows-lake, fifth-avenue, nac)
- **Example:** `/api/data/location/dows-lake`
- **Response:** Array of data points for the specified location

### 4. System Status
**GET** `/api/status`
- **Description:** Returns overall system status and individual location statuses
- **Response:**
```json
{
  "overallStatus": "Safe",
  "lastUpdated": "2024-12-16T13:05:00.000Z",
  "locations": [
    {
      "location": "dows-lake",
      "status": "Safe",
      "timestamp": "2024-12-16T13:05:00"
    }
  ]
}
```

### 5. Historical Data
**GET** `/api/data/historical`
- **Description:** Returns all data from the last hour for chart visualization
- **Response:** Array of aggregated data points for all locations

## Deployment to Azure App Service

### Step-by-Step Deployment Guide

#### Prerequisites
1. **Azure Account** with active subscription
2. **Azure CLI** installed (optional but recommended)
3. **Git** installed

#### Method 1: Zip Deploy (Easiest)

1. **Create Zip File:**
```bash
# Exclude node_modules and .env
zip -r dashboard.zip . -x "node_modules/*" ".git/*" ".env"
```

2. **Deploy via Azure Portal:**
   - Go to: App Service → **Advanced Tools** → **Go** (Kudu)
   - Navigate to: **Zip Push Deploy**
   - Drag and drop `dashboard.zip`
   - Wait for deployment to complete

3. **Configure Environment Variables:**
   - App Service → **Environment Variables**
   - Add all 4 Cosmos DB variables from Configuration section

#### Method 2: Local Git Deployment (Recommended)

1. **Configure App Service for Git:**
```bash
az webapp deployment source config-local-git \
  --name rideau-canal-dashboard \
  --resource-group rideau-canal-rg
```

2. **Get Git URL:**
```bash
az webapp deployment source show-local-git \
  --name rideau-canal-dashboard \
  --resource-group rideau-canal-rg
```

3. **Deploy from Local Repository:**
```bash
git remote add azure https://rideau-canal-dashboard.scm.azurewebsites.net:443/rideau-canal-dashboard.git
git push azure main
```

#### Method 3: Azure CLI Quick Deploy

```bash
# Login to Azure
az login

# Deploy from current directory
az webapp up \
  --name rideau-canal-dashboard \
  --resource-group rideau-canal-rg \
  --runtime "NODE:18LTS" \
  --sku F1
```

### Configuration Settings for Azure App Service

#### Required Application Settings:
| Setting | Value | Description |
|---------|-------|-------------|
| `COSMOS_DB_ENDPOINT` | Your Cosmos DB URI | Database endpoint |
| `COSMOS_DB_KEY` | Your Primary Key | Database access key |
| `COSMOS_DB_DATABASE` | `RideauCanalDB` | Database name |
| `COSMOS_DB_CONTAINER` | `SensorAggregations` | Container name |
| `WEBSITE_NODE_DEFAULT_VERSION` | `~18` | Node.js version |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` | Auto-build during deploy |

#### General Settings:
- **Runtime stack:** Node.js 18 LTS
- **Operating system:** Windows or Linux
- **Pricing tier:** F1 (Free) or B1 (Basic)
- **Always on:** Disabled (F1) / Enabled (B1+)

### Post-Deployment Verification

1. **Check Deployment Logs:**
   - App Service → **Deployment Center** → **Logs**
   - Should show "Deployment successful"

2. **Test Application:**
   ```bash
   # Check if app is running
   curl https://rideau-canal-dashboard.azurewebsites.net/api/health
   ```

3. **Monitor Application:**
   - App Service → **Log stream** for real-time logs
   - **Metrics** for CPU/Memory usage

## Dashboard Features

### Real-time Updates
- **Auto-refresh:** Updates every 30 seconds
- **Visual Timer:** Countdown display until next refresh
- **Manual Refresh:** Refresh button for immediate updates
- **Live Data:** Direct connection to Cosmos DB for fresh data

### Charts and Visualizations

#### Ice Thickness Trend Chart
- **Type:** Multi-line chart
- **Data:** Ice thickness for all three locations
- **Time Range:** Last hour (12 data points)
- **Features:** 
  - Interactive tooltips
  - Color-coded by location
  - Smooth line curves
  - Responsive scaling

#### Temperature Trends Chart
- **Type:** Dual-line chart
- **Data:** Surface vs External temperature
- **Time Range:** Last hour
- **Features:**
  - Two y-axes for different scales
  - Temperature threshold markers
  - Hover details

### Safety Status Indicators

#### Safety Logic
```javascript
// Based on project requirements
if (iceThickness >= 30 && temperature <= -2) {
  status = "Safe";
} else if (iceThickness >= 25 && temperature <= 0) {
  status = "Caution";
} else {
  status = "Unsafe";
}
```

#### Visual Indicators
- **Safe:** Green badge with checkmark icon
- **Caution:** Yellow badge with warning icon
- **Unsafe:** Red badge with danger icon

#### Location Cards
Each location card displays:
- Location name and icon
- Current safety status badge
- Key metrics (ice thickness, temperatures, snow)
- Last update time
- Color-coded border matching safety status

### Additional Features
- **Responsive Design:** Adapts to mobile, tablet, and desktop
- **Data Table:** Sortable table with all readings
- **System Status:** Overall health indicator
- **Safety Guidelines:** Explanation of safety logic
- **Error Handling:** Graceful error messages
- **Loading States:** Spinners during data fetch

## Troubleshooting

### Common Issues and Fixes

#### Issue: Dashboard shows "Loading..." indefinitely
**Possible Causes:**
1. No data in Cosmos DB
2. Incorrect environment variables
3. Stream Analytics job not running

**Solutions:**
1. Check Cosmos DB for data:
   ```bash
   # Test connection
   curl https://rideau-canal-dashboard.azurewebsites.net/api/health
   ```
2. Verify environment variables in App Service
3. Ensure Stream Analytics job is "Running"

#### Issue: Charts not displaying
**Possible Causes:**
1. Chart.js not loading
2. No historical data
3. JavaScript errors

**Solutions:**
1. Check browser console for errors (F12 → Console)
2. Ensure `/api/data/historical` returns data
3. Wait 5+ minutes for historical data to accumulate

#### Issue: "Cannot connect to Cosmos DB"
**Error Message:** `Failed to fetch data` or database errors

**Solutions:**
1. Verify Cosmos DB credentials in App Service
2. Check Cosmos DB firewall allows Azure services
3. Test connection from Kudu console:
   ```
   https://rideau-canal-dashboard.scm.azurewebsites.net
   ```

#### Issue: Auto-refresh not working
**Possible Causes:**
1. JavaScript errors
2. Browser caching
3. Network issues

**Solutions:**
1. Clear browser cache (Ctrl+Shift+R)
2. Check JavaScript console for errors
3. Test manual refresh button

#### Issue: App Service deployment fails
**Error Messages:** Various deployment errors

**Solutions:**
1. Check `package.json` has correct start script
2. Ensure Node.js version is compatible (~18)
3. Review deployment logs in App Service
4. Try Zip deploy instead of Git

### Debugging Steps

#### 1. Check Application Logs
```bash
# Via Azure Portal
App Service → Log stream

# Via Kudu
https://rideau-canal-dashboard.scm.azurewebsites.net/api/logs
```

#### 2. Test API Endpoints
```bash
# Health check
curl https://rideau-canal-dashboard.azurewebsites.net/api/health

# Latest data
curl https://rideau-canal-dashboard.azurewebsites.net/api/data/latest
```

#### 3. Verify Database Connection
```bash
# From Kudu console (Debug console → CMD)
node -e "
const { CosmosClient } = require('@azure/cosmos');
const client = new CosmosClient({
  endpoint: process.env.COSMOS_DB_ENDPOINT,
  key: process.env.COSMOS_DB_KEY
});
console.log('Testing connection...');
"
```

#### 4. Browser Developer Tools
- **F12 → Console:** JavaScript errors
- **F12 → Network:** API request failures
- **F12 → Application:** LocalStorage issues

### Performance Optimization

#### If Dashboard is Slow:
1. **Reduce auto-refresh interval** (change from 30s to 60s)
2. **Limit historical data** (change from 1 hour to 30 minutes)
3. **Optimize Cosmos DB queries** with proper indexing

#### Code Changes:
```javascript
// In app.js, change refresh interval
this.refreshInterval = 60000; // 60 seconds instead of 30

// In server.js, reduce time range
const oneHourAgo = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
```




