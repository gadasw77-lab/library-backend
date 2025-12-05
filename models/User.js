// ============================================
// FILE: models/User.js
// ============================================

const db = require('../config/database');

class User {
    static async findByEmail(email) {
        const [users] = await db.query(
            'SELECT * FROM Users WHERE email = ? AND is_active = TRUE',
            [email]
        );
        return users[0];
    }

    static async findById(userId) {
        const [users] = await db.query(
            'SELECT * FROM Users WHERE user_id = ?',
            [userId]
        );
        return users[0];
    }

    static async create(userData) {
        const { fullName, email, userType, passwordHash } = userData;
        const [result] = await db.query(
            'INSERT INTO Users (full_name, email, user_type, password_hash) VALUES (?, ?, ?, ?)',
            [fullName, email, userType, passwordHash]
        );
        return result.insertId;
    }

    static async updateLastLogin(userId) {
        await db.query(
            'UPDATE Users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
            [userId]
        );
    }

    static async findByType(userType) {
        const [users] = await db.query(
            'SELECT * FROM Users WHERE user_type = ? AND is_active = TRUE',
            [userType]
        );
        return users;
    }
}

module.exports = User;