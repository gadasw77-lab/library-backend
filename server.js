// LibraryBackend/server.js - COMPLETE VERSION WITH DEBUGGING 

 


const express = require('express'); 

const cors = require('cors'); 

const bodyParser = require('body-parser'); 

require('dotenv').config(); 

const path = require('path'); 

 

const app = express(); 

const PORT = process.env.PORT || 8080; 

 

// Middleware 

app.use(cors()); 

app.use(bodyParser.json()); 

app.use(bodyParser.urlencoded({ extended: true })); 

 

// Request Logger 

app.use((req, res, next) => { 

    console.log(`\n🔵 ${req.method} ${req.path}`); 

    if (Object.keys(req.query).length > 0) { 

        console.log('   Query:', req.query); 

    } 

    if (Object.keys(req.body).length > 0) { 

        console.log('   Body:', req.body); 

    } 

    next(); 

}); 

 

// Routes 

console.log('\n📦 Loading Routes...'); 

const authRoutes = require('./routes/authRoutes'); 

const bookRoutes = require('./routes/bookRoutes'); 

const ownerRoutes = require('./routes/ownerRoutes'); 

const authorRoutes = require('./routes/authorRoutes'); 

const readerRoutes = require('./routes/readerRoutes'); 

const categoryRoutes = require('./routes/categoryRoutes');



app.use('/api/auth', authRoutes); 

app.use('/api/books', bookRoutes); 

app.use('/api/owner', ownerRoutes); 

app.use('/api/author', authorRoutes); 

app.use('/api/reader', readerRoutes); 

app.use('/api/categories', categoryRoutes);

 

console.log('✅ All routes loaded\n'); 

// Test endpoint 

app.get('/api/test', (req, res) => { 

    res.json({ 

        status: 'success', 

        message: 'Library API is running!', 

        timestamp: new Date().toISOString(), 

        endpoints: { 

            auth: '/api/auth/login, /api/auth/register', 

            books: '/api/books, /api/books/search', 

            owner: '/api/owner/statistics, /api/owner/pending-requests, etc.', 

            author: '/api/author/books, /api/author/stats', 

            reader: '/api/reader/stats, /api/reader/borrow' 

        } 

    }); 

}); 

 

// List all routes 

app.get('/api/routes', (req, res) => { 

    const routes = []; 

    app._router.stack.forEach((middleware) => { 

        if (middleware.route) { 

            routes.push({ 

                path: middleware.route.path, 

                methods: Object.keys(middleware.route.methods) 

            }); 

        } else if (middleware.name === 'router') { 

            middleware.handle.stack.forEach((handler) => { 

                if (handler.route) { 

                    routes.push({ 

                        path: handler.route.path, 

                        methods: Object.keys(handler.route.methods) 

                    }); 

                } 

            }); 

        } 

    }); 

    res.json({ routes }); 

}); 

 

// IMPORTANT: Serve uploaded files 

app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

 

// Error handling middleware 

app.use((err, req, res, next) => { 

    console.error('❌ Error:', err.stack); 

    res.status(500).json({ 

        success: false, 

        message: 'Something went wrong!', 

        error: err.message 

    }); 

}); 

 

// 404 handler 

app.use((req, res) => { 

    console.log('❌ 404 Not Found:', req.path); 

    res.status(404).json({ 

        success: false, 

        message: 'Endpoint not found', 

        path: req.path 

    }); 

}); 

 

// Start server 

app.listen(PORT, () => { 

    console.log('================================'); 

    console.log('🚀 Library Backend Started!'); 

    console.log(`📡 Server: http://localhost:${PORT}`); 

    console.log(`🧪 Test: http://localhost:${PORT}/api/test`); 

    console.log(`📋 Routes: http://localhost:${PORT}/api/routes`); 

    console.log('================================\n'); 

});