const express = require('express');
const cors = require('cors');
const path = require('path');

// Load the mock data
const companies = require('./data.json'); 

const app = express();
const port = 3002; // Important: Frontend runs on 3000, so backend must use a different port

// Middleware
// Allow requests from the frontend (Vite's default port is 5173 or similar, but we'll allow all for Codespace ease)
app.use(cors({
    origin: '*', // Allow all origins for Codespace testing
}));
app.use(express.json());

/**
 * Endpoint to fetch all companies.
 * Includes a small delay to better simulate network latency 
 * and demonstrate the frontend's loading state.
 */
app.get('/api/companies', (req, res) => {
    // Artificial 500ms delay
    setTimeout(() => {
        console.log(`[Backend] Served ${companies.length} companies.`);
        res.status(200).json(companies);
    }, 500);
});

// Basic health check
app.get('/', (req, res) => {
    res.send('Frontlines Media Backend API is running!');
});

// Start the server
app.listen(port, () => {
    console.log(`[Backend] Server running at http://localhost:${port}`);
    console.log('[Backend] Endpoint: http://localhost:3001/api/companies');
});
