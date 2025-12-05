const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Hash password
const hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        console.log('🔐 Login attempt:', { email, role });

        // Validate inputs
        if (!email || !role) {
            return res.status(400).json({
                success: false,
                message: 'Email and role are required'
            });
        }

        // Get user
        const [users] = await db.query(
            'SELECT * FROM Users WHERE email = ? AND user_type = ? AND is_active = TRUE',
            [email, role]
        );

        if (users.length === 0) {
            console.log('❌ User not found:', email, 'as', role);
            return res.status(401).json({
                success: false,
                message: 'User not found or invalid role'
            });
        }

        const user = users[0];
        console.log('✅ User found:', user.full_name);

        // For readers, no password check needed
        if (role === 'reader') {
            console.log('👤 Reader login - no password required');
            
            // Update last login
            await db.query(
                'UPDATE Users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
                [user.user_id]
            );

            // Generate token
            const token = jwt.sign(
                { userId: user.user_id, email: user.email, role: user.user_type },
                process.env.JWT_SECRET || 'default-secret-key',
                { expiresIn: '24h' }
            );

            console.log('✅ Reader login successful');

            return res.json({
                success: true,
                user: {
                    userId: user.user_id,
                    name: user.full_name,
                    email: user.email,
                    role: user.user_type
                },
                token: token
            });
        }

        // For owner and author, verify password
        if (!password) {
            console.log('❌ Password required for', role);
            return res.status(401).json({
                success: false,
                message: 'Password required for ' + role
            });
        }

        // Verify password
        const isPasswordValid = bcrypt.compareSync(password, user.password_hash);

        if (!isPasswordValid) {
            console.log('❌ Invalid password');
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        // Update last login
        await db.query(
            'UPDATE Users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
            [user.user_id]
        );

        // Generate token
        const token = jwt.sign(
            { userId: user.user_id, email: user.email, role: user.user_type },
            process.env.JWT_SECRET || 'default-secret-key',
            { expiresIn: '24h' }
        );

        console.log('✅ Login successful:', role);

        res.json({
            success: true,
            user: {
                userId: user.user_id,
                name: user.full_name,
                email: user.email,
                role: user.user_type
            },
            token: token
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};


// Register
exports.register = async (req, res) => {
    try {
        const { name, email, role, password, phone, interests } = req.body;

        console.log('📝 Registration attempt:', { name, email, role });

        // Validate required fields
        if (!name || !email || !role) {
            console.error('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, email, role'
            });
        }

        // Check if user already exists
        const [existing] = await db.query(
            'SELECT * FROM Users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            console.log('⚠️ Email already registered:', email);
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Hash password (use default for readers)
        const hashedPassword = password ? hashPassword(password) : hashPassword('reader123');

        console.log('💾 Inserting user...');

        // Insert user
        const [result] = await db.query(
            'INSERT INTO Users (full_name, email, user_type, password_hash) VALUES (?, ?, ?, ?)',
            [name, email, role, hashedPassword]
        );

        const userId = result.insertId;
        console.log('✅ User created with ID:', userId);

        // Create role-specific profile
        if (role === 'author') {
            console.log('📝 Creating author profile...');
            await db.query(
                'INSERT INTO Authors (user_id, phone) VALUES (?, ?)',
                [userId, phone || null]
            );
            console.log('✅ Author profile created');
        } else if (role === 'reader') {
            console.log('📝 Creating reader profile...');
            await db.query(
                'INSERT INTO Readers (user_id) VALUES (?)',
                [userId]
            );
            console.log('✅ Reader profile created');
        }

        console.log('✅ Registration successful');

        res.json({
            success: true,
            message: 'Registration successful',
            userId: userId
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        console.error('Error details:', error.message);
        console.error('SQL State:', error.sqlState);
        console.error('SQL Message:', error.sqlMessage);
        
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }
};