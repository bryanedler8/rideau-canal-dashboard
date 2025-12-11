const express = require('express');
const cors = require('cors');
const { CosmosClient } = require('@azure/cosmos');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Cosmos DB Configuration
const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE;
const containerId = process.env.COSMOS_DB_CONTAINER;

// Validate environment variables
if (!endpoint || !key || !databaseId || !containerId) {
    console.error('Missing environment variables. Check your .env file.');
    process.exit(1);
}

// Create Cosmos DB client
const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);
const container = database.container(containerId);

// API Routes

// 1. Get latest data for all locations
app.get('/api/data/latest', async (req, res) => {
    try {
        const query = `
            SELECT TOP 3 * 
            FROM c 
            ORDER BY c.timestamp DESC
        `;
        
        const { resources: items } = await container.items
            .query(query)
            .fetchAll();
        
        res.json(items);
    } catch (error) {
        console.error('Error fetching latest data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// 2. Get data for specific location (last hour)
app.get('/api/data/location/:location', async (req, res) => {
    try {
        const { location } = req.params;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        const query = {
            query: `
                SELECT * 
                FROM c 
                WHERE c.location = @location 
                AND c.timestamp >= @oneHourAgo
                ORDER BY c.timestamp ASC
            `,
            parameters: [
                { name: '@location', value: location },
                { name: '@oneHourAgo', value: oneHourAgo }
            ]
        };
        
        const { resources: items } = await container.items
            .query(query)
            .fetchAll();
        
        res.json(items);
    } catch (error) {
        console.error(`Error fetching data for ${req.params.location}:`, error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// 3. Get system status overview
app.get('/api/status', async (req, res) => {
    try {
        const query = `
            SELECT TOP 3 * 
            FROM c 
            ORDER BY c.timestamp DESC
        `;
        
        const { resources: items } = await container.items
            .query(query)
            .fetchAll();
        
        // Calculate overall system status
        const statuses = items.map(item => item.safetyStatus);
        let overallStatus = 'Safe';
        
        if (statuses.includes('Unsafe')) {
            overallStatus = 'Unsafe';
        } else if (statuses.includes('Caution')) {
            overallStatus = 'Caution';
        }
        
        res.json({
            overallStatus,
            lastUpdated: new Date().toISOString(),
            locations: items.map(item => ({
                location: item.location,
                status: item.safetyStatus,
                timestamp: item.timestamp
            }))
        });
    } catch (error) {
        console.error('Error fetching system status:', error);
        res.status(500).json({ error: 'Failed to fetch system status' });
    }
});

// 4. Get historical data for charts (last 12 windows = 1 hour)
app.get('/api/data/historical', async (req, res) => {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        const query = {
            query: `
                SELECT * 
                FROM c 
                WHERE c.timestamp >= @oneHourAgo
                ORDER BY c.timestamp ASC
            `,
            parameters: [
                { name: '@oneHourAgo', value: oneHourAgo }
            ]
        };
        
        const { resources: items } = await container.items
            .query(query)
            .fetchAll();
        
        res.json(items);
    } catch (error) {
        console.error('Error fetching historical data:', error);
        res.status(500).json({ error: 'Failed to fetch historical data' });
    }
});

// Test database connection
app.get('/api/health', async (req, res) => {
    try {
        // Try to read container metadata to test connection
        await container.read();
        res.json({ 
            status: 'healthy',
            cosmosDB: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({ 
            status: 'unhealthy',
            cosmosDB: 'disconnected',
            error: error.message 
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Dashboard server running on port ${port}`);
    console.log(`Cosmos DB: ${databaseId}.${containerId}`);
    console.log(`Dashboard available at: http://localhost:${port}`);
});