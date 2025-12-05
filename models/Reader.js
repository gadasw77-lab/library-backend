// ============================================
// FILE: models/Reader.js
// ============================================

const db = require('../config/database');

class Reader {
    static async findByUserId(userId) {
        const [readers] = await db.query(
            'SELECT * FROM Readers WHERE user_id = ?',
            [userId]
        );
        return readers[0];
    }

    static async findById(readerId) {
        const [readers] = await db.query(
            'SELECT * FROM Readers WHERE reader_id = ?',
            [readerId]
        );
        return readers[0];
    }

    static async create(userId) {
        const [result] = await db.query(
            'INSERT INTO Readers (user_id) VALUES (?)',
            [userId]
        );
        return result.insertId;
    }

    static async getStatistics(readerId) {
        const [stats] = await db.query(
            'SELECT * FROM ReaderStatistics WHERE reader_id = ?',
            [readerId]
        );
        return stats[0];
    }

    static async updateWarningCount(readerId, count) {
        await db.query(
            'UPDATE Readers SET warning_count = ? WHERE reader_id = ?',
            [count, readerId]
        );
    }
}

module.exports = Reader;