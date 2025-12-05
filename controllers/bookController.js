// LibraryBackend/controllers/bookController.js - FIXED VERSION

const db = require('../config/database');

// ============================================
// GET ALL BOOKS - FIXED!
// ============================================
exports.getAllBooks = async (req, res) => {
    try {
        console.log('📚 Getting all books...');
        
        const [books] = await db.query(`
            SELECT 
                b.book_id,
                b.title,
                b.isbn,
                b.publication_date,
                b.num_pages,
                b.availability_type,
                b.can_borrow,
                b.avg_rating,
                b.total_reviews,
                b.publisher,
                b.extra_notes,
                u.full_name as author_name,
                a.author_id
            FROM Books b
            JOIN Authors a ON b.author_id = a.author_id
            JOIN Users u ON a.user_id = u.user_id
            WHERE b.is_published = TRUE AND b.is_hidden = FALSE
            ORDER BY b.created_at DESC
        `);

        console.log(`✅ Found ${books.length} books`);

        res.json({
            success: true,
            books: books
        });

    } catch (error) {
        console.error('❌ Get books error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get books',
            error: error.message
        });
    }
};

// ============================================
// SEARCH BOOKS - VERIFY THIS IN bookController.js
// ============================================
exports.searchBooks = async (req, res) => {
    try {
        const { term, category, availability, year, publisher } = req.query;
        console.log('🔍 Searching books with filters:', { term, category, availability, year, publisher });

        let query = `
            SELECT DISTINCT
                b.book_id,
                b.title,
                b.isbn,
                b.publication_date,
                b.num_pages,
                b.availability_type,
                b.can_borrow,
                b.avg_rating,
                b.total_reviews,
                b.publisher,
                b.extra_notes,
                u.full_name as author_name,
                a.author_id
            FROM Books b
            JOIN Authors a ON b.author_id = a.author_id
            JOIN Users u ON a.user_id = u.user_id
            LEFT JOIN BookCategories bc ON b.book_id = bc.book_id
            LEFT JOIN Categories c ON bc.category_id = c.category_id
            WHERE b.is_published = TRUE AND b.is_hidden = FALSE
        `;

        const params = [];

        if (term) {
            query += ` AND (b.title LIKE ? OR u.full_name LIKE ?)`;
            params.push(`%${term}%`, `%${term}%`);
        }

        if (category) {
            query += ` AND c.category_name = ?`;
            params.push(category);
        }

        if (availability) {
            query += ` AND b.availability_type = ?`;
            params.push(availability);
        }

        if (year) {
            query += ` AND YEAR(b.publication_date) = ?`;
            params.push(year);
        }

        if (publisher) {
            query += ` AND b.publisher LIKE ?`;
            params.push(`%${publisher}%`);
        }

        query += ` ORDER BY b.avg_rating DESC, b.title ASC`;

        console.log('📝 SQL Query:', query);
        console.log('📝 Params:', params);

        const [books] = await db.query(query, params);

        console.log(`✅ Found ${books.length} books`);

        res.json({
            success: true,
            books: books
        });

    } catch (error) {
        console.error('❌ Search books error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search books',
            error: error.message
        });
    }
};

// ============================================
// GET BOOK BY ID
// ============================================
exports.getBookById = async (req, res) => {
    try {
        const { bookId } = req.params;
        console.log('📖 Getting book:', bookId);

        const [books] = await db.query(`
            SELECT 
                b.*,
                u.full_name as author_name,
                u.email as author_email,
                a.author_id
            FROM Books b
            JOIN Authors a ON b.author_id = a.author_id
            JOIN Users u ON a.user_id = u.user_id
            WHERE b.book_id = ?
        `, [bookId]);

        if (books.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        console.log('✅ Book found:', books[0].title);

        res.json({
            success: true,
            book: books[0]
        });

    } catch (error) {
        console.error('❌ Get book error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get book',
            error: error.message
        });
    }
};

// ============================================
// GET BOOK REVIEWS
// ============================================
exports.getBookReviews = async (req, res) => {
    try {
        const { bookId } = req.params;
        console.log('⭐ Getting reviews for book:', bookId);

        const [reviews] = await db.query(`
            SELECT 
                r.review_id,
                r.rating,
                r.review_text,
                r.review_date,
                u.full_name as user_name
            FROM Reviews r
            JOIN Users u ON r.user_id = u.user_id
            WHERE r.book_id = ?
            ORDER BY r.review_date DESC
        `, [bookId]);

        console.log(`✅ Found ${reviews.length} reviews`);

        res.json({
            success: true,
            reviews: reviews
        });

    } catch (error) {
        console.error('❌ Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get reviews',
            error: error.message
        });
    }
};