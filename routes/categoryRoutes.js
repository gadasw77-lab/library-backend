const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all categories
router.get('/', async (req, res) => {
    try {
        console.log('📚 Getting categories...');
        const [categories] = await db.query('SELECT * FROM Categories ORDER BY category_name');
        
        res.json({
            success: true,
            categories: categories
        });
    } catch (error) {
        console.error('❌ Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get categories',
            error: error.message
        });
    }
});

module.exports = router;