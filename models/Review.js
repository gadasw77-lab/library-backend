// ============================================
// FILE: models/Review.js
// ============================================

const db = require('../config/database');

class Review {
    static async findByBook(bookId) {
        const [reviews] = await db.query(`
            SELECT r.*, u.full_name as user_name
            FROM Reviews r
            JOIN Users u ON r.user_id = u.user_id
            WHERE r.book_id = ?
            ORDER BY r.review_date DESC
        `, [bookId]);
        return reviews;
    }

    static async findByUser(userId) {
        const [reviews] = await db.query(`
            SELECT r.*, b.title as book_title
            FROM Reviews r
            JOIN Books b ON r.book_id = b.book_id
            WHERE r.user_id = ?
            ORDER BY r.review_date DESC
        `, [userId]);
        return reviews;
    }

    static async create(reviewData) {
        const { bookId, userId, rating, reviewText } = reviewData;
        const [result] = await db.query(
            'INSERT INTO Reviews (book_id, user_id, rating, review_text) VALUES (?, ?, ?, ?)',
            [bookId, userId, rating, reviewText]
        );
        return result.insertId;
    }

    static async update(reviewId, reviewData) {
        const { rating, reviewText } = reviewData;
        await db.query(
            'UPDATE Reviews SET rating = ?, review_text = ? WHERE review_id = ?',
            [rating, reviewText, reviewId]
        );
    }

    static async delete(reviewId) {
        await db.query('DELETE FROM Reviews WHERE review_id = ?', [reviewId]);
    }
}

module.exports = Review;