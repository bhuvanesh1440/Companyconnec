const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');

// --- Configuration & Constants ---
// CRITICAL FIX: The URI was missing the database name (frontlinesDirectoryDB) 
// and the connection options (?retryWrites=true&w=majority).
// This corrected URI points to your specific cluster and database.
const MONGO_URI = 'mongodb+srv://bhuvanesh1440:ANRbmBBgsBbVckz2@cluster0.yiwng64.mongodb.net/frontlinesDirectoryDB?retryWrites=true&w=majority'; 

// --- Mongoose Schema and Model ---
const companySchema = new mongoose.Schema({
    // Mongoose automatically creates a unique '_id' field
    name: { type: String, required: true },
    ceo: { type: String, required: true },
    industry: { type: String, required: true },
    location: { type: String, required: true },
    // Ensure data types align with frontend expectations (e.g., Number for sorting)
    employees: { type: Number, default: 0 },
    founded: { type: Number, default: new Date().getFullYear() },
    logoIcon: { type: String, default: 'Briefcase' },
}, { timestamps: true }); // Adds createdAt and updatedAt fields

const Company = mongoose.model('Company', companySchema);

// --- MongoDB Connection ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('[MongoDB] Connected successfully to Cloud Atlas.'))
    .catch(err => {
        console.error('[MongoDB] Connection error. Please verify your Atlas URI, network access, and credentials:', err.message);
        // Exit process if DB connection fails
        process.exit(1); 
    });


const app = express();
const port = 3002;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// --- Utility function to simulate a network delay (kept for consistency) ---
const artificialDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));


// --- CRUD Endpoints (Updated to use Mongoose) ---

/**
 * R - Read All Companies
 */
app.get('/api/companies', async (req, res) => {
    try {
        await artificialDelay(500);
        // Find all companies (Mongoose returns standard JSON objects)
        const companies = await Company.find(); 
        console.log(`[Backend] Served ${companies.length} companies.`);
        res.status(200).json(companies);
    } catch (error) {
        console.error('[Backend] Error fetching companies:', error);
        res.status(500).json({ message: 'Internal Server Error fetching data.' });
    }
});

/**
 * C - Create New Company
 */
app.post('/api/companies', async (req, res) => {
    try {
        await artificialDelay(300);
        // Use Mongoose .create() which handles schema validation
        const newCompany = await Company.create(req.body); 
        console.log(`[Backend] Created company: ${newCompany.name}`);
        res.status(201).json(newCompany);
    } catch (error) {
        console.error('[Backend] Error creating company:', error);
        // Send 400 for common validation errors
        res.status(400).json({ message: 'Invalid data provided.', error: error.message }); 
    }
});

/**
 * U - Update Existing Company
 */
app.put('/api/companies/:id', async (req, res) => {
    try {
        await artificialDelay(300);
        const id = req.params.id;
        
        // Use findByIdAndUpdate. { new: true } returns the updated document, 
        // { runValidators: true } ensures validation runs on updates.
        const updatedCompany = await Company.findByIdAndUpdate(
            id, 
            req.body, 
            { new: true, runValidators: true } 
        );

        if (!updatedCompany) {
            return res.status(404).json({ message: 'Company not found' });
        }

        console.log(`[Backend] Updated company: ${updatedCompany.name}`);
        res.status(200).json(updatedCompany);
    } catch (error) {
        console.error('[Backend] Error updating company:', error);
        res.status(500).json({ message: 'Internal Server Error updating data.' });
    }
});

/**
 * D - Delete Company
 */
app.delete('/api/companies/:id', async (req, res) => {
    try {
        await artificialDelay(300);
        const id = req.params.id;
        
        // Find by ID and delete
        const deletedCompany = await Company.findByIdAndDelete(id); 

        if (!deletedCompany) {
            return res.status(404).json({ message: 'Company not found' });
        }

        console.log(`[Backend] Deleted company with ID: ${id}`);
        // 204 No Content for successful deletion
        res.status(204).send(); 
    } catch (error) {
        console.error('[Backend] Error deleting company:', error);
        res.status(500).json({ message: 'Internal Server Error deleting data.' });
    }
});


// Basic health check
app.get('/', (req, res) => {
    res.send('Frontlines Media Backend API is running!');
});

// Start the server
app.listen(port, () => {
    console.log(`[Backend] Server running at http://localhost:${port}`);
    console.log(`[Backend] API Base URL: http://localhost:${port}/api/companies`);
});
