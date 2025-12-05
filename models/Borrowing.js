// ============================================
// FILE: models/Borrowing.js
// ============================================

const db = require('../config/database');

class Borrowing {
    static async create(borrowingData) {
        const { bookId, readerId, dueDate } = borrowingData;
        const [result] = await db.query(`
            INSERT INTO BorrowingRecords (book_id, reader_id, borrow_date, due_date)
            VALUES (?, ?, CURRENT_DATE, ?)
        `, [bookId, readerId, dueDate]);
        return result.insertId;
    }

    static async findByReader(readerId) {
        const [borrowings] = await db.query(`
            SELECT br.*, b.title as book_title, b.author_id
            FROM BorrowingRecords br
            JOIN Books b ON br.book_id = b.book_id
            WHERE br.reader_id = ? AND br.status = 'active'
            ORDER BY br.borrow_date DESC
        `, [readerId]);
        return borrowings;
    }

    static async findById(borrowId) {
        const [borrowings] = await db.query(
            'SELECT * FROM BorrowingRecords WHERE borrow_id = ?',
            [borrowId]
        );
        return borrowings[0];
    }

    static async returnBook(borrowId) {
        await db.query(`
            UPDATE BorrowingRecords 
            SET return_date = CURRENT_DATE, status = 'returned'
            WHERE borrow_id = ?
        `, [borrowId]);
    }

    static async findOverdue() {
        const [borrowings] = await db.query(`
            SELECT * FROM OverdueBorrowings
            ORDER BY days_overdue DESC
        `);
        return borrowings;
    }

    static async findAll() {
        const [borrowings] = await db.query(`
            SELECT * FROM LegendBorrowers
            ORDER BY borrow_date DESC
        `);
        return borrowings;
    }
}

module.exports = Borrowing;