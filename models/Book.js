// ============================================
// FILE: models/Book.js
// ============================================

const db = require('../config/database');

class Book {
    static async findAll() {
        const [books] = await db.query(`
            SELECT b.*, u.full_name as author_name
            FROM Books b
            JOIN Authors a ON b.author_id = a.author_id
            JOIN Users u ON a.user_id = u.user_id
            WHERE b.is_published = TRUE AND b.is_hidden = FALSE
            ORDER BY b.created_at DESC
        `);
        return books;
    }

    static async findById(bookId) {
        const [books] = await db.query(`
            SELECT b.*, u.full_name as author_name, u.email as author_email
            FROM Books b
            JOIN Authors a ON b.author_id = a.author_id
            JOIN Users u ON a.user_id = u.user_id
            WHERE b.book_id = ?
        `, [bookId]);
        return books[0];
    }

    static async findByAuthor(authorId) {
        const [books] = await db.query(
            'SELECT * FROM Books WHERE author_id = ? ORDER BY created_at DESC',
            [authorId]
        );
        return books;
    }

    static async create(bookData) {
        const { title, authorId, publicationDate, numPages, availabilityType, canBorrow, pdfPath, publisher, extraNotes } = bookData;
        const [result] = await db.query(`
            INSERT INTO Books (title, author_id, publication_date, num_pages, availability_type, can_borrow, pdf_path, publisher, extra_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [title, authorId, publicationDate, numPages, availabilityType, canBorrow, pdfPath, publisher, extraNotes]);
        return result.insertId;
    }

    static async update(bookId, bookData) {
        const { title, publicationDate, numPages, availabilityType, canBorrow, publisher, extraNotes, isHidden } = bookData;
        await db.query(`
            UPDATE Books 
            SET title = ?, publication_date = ?, num_pages = ?, availability_type = ?, 
                can_borrow = ?, publisher = ?, extra_notes = ?, is_hidden = ?
            WHERE book_id = ?
        `, [title, publicationDate, numPages, availabilityType, canBorrow, publisher, extraNotes, isHidden, bookId]);
    }

    static async delete(bookId) {
        await db.query('DELETE FROM Books WHERE book_id = ?', [bookId]);
    }

    static async search(filters) {
        let query = `
            SELECT b.*, u.full_name as author_name
            FROM Books b
            JOIN Authors a ON b.author_id = a.author_id
            JOIN Users u ON a.user_id = u.user_id
            WHERE b.is_published = TRUE AND b.is_hidden = FALSE
        `;
        const params = [];

        if (filters.term) {
            query += ` AND b.title LIKE ?`;
            params.push(`%${filters.term}%`);
        }
        if (filters.availability) {
            query += ` AND b.availability_type = ?`;
            params.push(filters.availability);
        }
        if (filters.year) {
            query += ` AND YEAR(b.publication_date) = ?`;
            params.push(filters.year);
        }
        if (filters.publisher) {
            query += ` AND b.publisher LIKE ?`;
            params.push(`%${filters.publisher}%`);
        }

        query += ` ORDER BY b.avg_rating DESC, b.title ASC`;

        const [books] = await db.query(query, params);
        return books;
    }
}

module.exports = Book;