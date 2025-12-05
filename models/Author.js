// ============================================
// FILE: models/Author.js
// ============================================

const db = require('../config/database');

class Author {
    static async findByUserId(userId) {
        const [authors] = await db.query(
            'SELECT * FROM Authors WHERE user_id = ?',
            [userId]
        );
        return authors[0];
    }

    static async findById(authorId) {
        const [authors] = await db.query(
            'SELECT * FROM Authors WHERE author_id = ?',
            [authorId]
        );
        return authors[0];
    }

    static async create(authorData) {
        const { userId, phone, bio } = authorData;
        const [result] = await db.query(
            'INSERT INTO Authors (user_id, phone, bio) VALUES (?, ?, ?)',
            [userId, phone, bio || null]
        );
        return result.insertId;
    }

    static async getStatistics(authorId) {
        const [stats] = await db.query(
            'SELECT * FROM AuthorStatistics WHERE author_id = ?',
            [authorId]
        );
        return stats[0];
    }

    static async update(authorId, authorData) {
        const { phone, bio } = authorData;
        await db.query(
            'UPDATE Authors SET phone = ?, bio = ? WHERE author_id = ?',
            [phone, bio, authorId]
        );
    }
}

module.exports = Author;