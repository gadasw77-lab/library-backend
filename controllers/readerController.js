// LibraryBackend/controllers/readerController.js - COMPLETE FIXED VERSION

const db = require('../config/database');


// ============================================
// GET READER BY USER ID
// ============================================
exports.getReaderByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`👤 Getting reader for user ${userId}...`);

        const [readers] = await db.query(
            'SELECT * FROM Readers WHERE user_id = ?',
            [userId]
        );

        if (readers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reader not found'
            });
        }

        console.log('✅ Reader found:', readers[0].reader_id);
        res.json({
            success: true,
            reader: readers[0]
        });
    } catch (error) {
        console.error('❌ Get reader error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get reader',
            error: error.message
        });
    }
};

// Get reader stats
exports.getReaderStats = async (req, res) => {
    try {
        const { readerId } = req.params;

        const [stats] = await db.query(
            'SELECT * FROM ReaderStatistics WHERE reader_id = ?',
            [readerId]
        );

        if (stats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reader not found'
            });
        }

        res.json({
            success: true,
            stats: stats[0]
        });
    } catch (error) {
        console.error('Get reader stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
};

// Borrow book
exports.borrowBook = async (req, res) => {
    try {
        const { bookId, readerId, dueDate } = req.body;

        const [result] = await db.query(`
            INSERT INTO BorrowingRecords (book_id, reader_id, borrow_date, due_date)
            VALUES (?, ?, CURRENT_DATE, ?)
        `, [bookId, readerId, dueDate]);

        res.json({
            success: true,
            borrowId: result.insertId,
            message: 'Book borrowed successfully'
        });
    } catch (error) {
        console.error('Borrow book error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to borrow book',
            error: error.message
        });
    }
};

// Get reader borrowings
exports.getReaderBorrowings = async (req, res) => {
    try {
        const { readerId } = req.params;

        const [borrowings] = await db.query(`
            SELECT br.*, b.title as book_title
            FROM BorrowingRecords br
            JOIN Books b ON br.book_id = b.book_id
            WHERE br.reader_id = ? AND br.status = 'active'
            ORDER BY br.borrow_date DESC
        `, [readerId]);

        res.json({
            success: true,
            borrowings: borrowings
        });
    } catch (error) {
        console.error('Get borrowings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get borrowings',
            error: error.message
        });
    }
};

// Return book
exports.returnBook = async (req, res) => {
    try {
        const { borrowId } = req.params;

        console.log(`📖 Returning borrow ${borrowId}...`);

        // Get book and reader info before updating
        const [borrowInfo] = await db.query(`
            SELECT book_id, reader_id 
            FROM BorrowingRecords 
            WHERE borrow_id = ?
        `, [borrowId]);

        if (borrowInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Borrowing record not found'
            });
        }

        const { book_id, reader_id } = borrowInfo[0];

        // Update borrowing record
        await db.query(`
            UPDATE BorrowingRecords 
            SET return_date = CURRENT_DATE, status = 'returned'
            WHERE borrow_id = ?
        `, [borrowId]);

        console.log('✅ Borrowing record updated');

        // ✅ MANUALLY increment Books.total_readers (since trigger isn't doing it)
        await db.query(`
            UPDATE Books 
            SET total_readers = total_readers + 1 
            WHERE book_id = ?
        `, [book_id]);

        console.log('✅ Book total_readers incremented');

        res.json({
            success: true,
            message: 'Book returned successfully'
        });
    } catch (error) {
        console.error('❌ Return book error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to return book',
            error: error.message
        });
    }
};

// Add review
exports.addReview = async (req, res) => {
    try {
        const { bookId, userId, rating, reviewText } = req.body;

        const [result] = await db.query(`
            INSERT INTO Reviews (book_id, user_id, rating, review_text)
            VALUES (?, ?, ?, ?)
        `, [bookId, userId, rating, reviewText]);

        res.json({
            success: true,
            reviewId: result.insertId,
            message: 'Review submitted successfully'
        });
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit review',
            error: error.message
        });
    }
};

// Get reader reviews
exports.getReaderReviews = async (req, res) => {
    try {
        const { userId } = req.params;

        const [reviews] = await db.query(`
            SELECT r.*, b.title as book_title
            FROM Reviews r
            JOIN Books b ON r.book_id = b.book_id
            WHERE r.user_id = ?
            ORDER BY r.review_date DESC
        `, [userId]);

        res.json({
            success: true,
            reviews: reviews
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get reviews',
            error: error.message
        });
    }
};

// Submit feedback
exports.submitFeedback = async (req, res) => {
    try {
        const { userId, text, type } = req.body;

        if (type === 'suggestion') {
            await db.query('INSERT INTO Suggestions (user_id, suggestion_text) VALUES (?, ?)', [userId, text]);
        } else if (type === 'issue') {
            await db.query('INSERT INTO Issues (user_id, issue_text) VALUES (?, ?)', [userId, text]);
        }

        res.json({
            success: true,
            message: type === 'suggestion' ? 'Suggestion submitted' : 'Issue reported'
        });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback',
            error: error.message
        });
    }
};

// ============================================
// GET READER STATISTICS - FIXED!
// ============================================
exports.getReaderStats = async (req, res) => {
    try {
        const { readerId } = req.params;
        console.log(`📊 Getting stats for reader ${readerId}...`);

        // Get detailed statistics including current borrowings
        const [stats] = await db.query(`
            SELECT 
                r.reader_id,
                u.full_name AS reader_name,
                u.email,
                r.membership_date,
                r.books_borrowed,
                r.books_read,
                r.warning_count,
                r.is_banned,
                COUNT(DISTINCT CASE WHEN br.status = 'active' THEN br.borrow_id END) AS current_borrowed_books
            FROM Readers r
            JOIN Users u ON r.user_id = u.user_id
            LEFT JOIN BorrowingRecords br ON r.reader_id = br.reader_id
            WHERE r.reader_id = ?
            GROUP BY r.reader_id, u.full_name, u.email, r.membership_date, 
                     r.books_borrowed, r.books_read, r.warning_count, r.is_banned
        `, [readerId]);

        if (stats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reader not found'
            });
        }

        console.log('✅ Reader stats:', stats[0]);
        res.json({
            success: true,
            stats: stats[0]
        });
    } catch (error) {
        console.error('❌ Get reader stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
};

// ============================================
// BORROW BOOK
// ============================================
exports.borrowBook = async (req, res) => {
    try {
        const { bookId, readerId, dueDate } = req.body;
        console.log(`📚 Reader ${readerId} borrowing book ${bookId}...`);

        const [result] = await db.query(`
            INSERT INTO BorrowingRecords (book_id, reader_id, borrow_date, due_date)
            VALUES (?, ?, CURRENT_DATE, ?)
        `, [bookId, readerId, dueDate]);

        console.log(`✅ Book borrowed, borrow ID: ${result.insertId}`);
        res.json({
            success: true,
            borrowId: result.insertId,
            message: 'Book borrowed successfully'
        });
    } catch (error) {
        console.error('❌ Borrow book error:', error);
        res.status(500).json({
            success: false,
            message: error.message.includes('cannot borrow') ? error.message : 'Failed to borrow book',
            error: error.message
        });
    }
};

// ============================================
// GET READER BORROWINGS - FIXED!
// ============================================
exports.getReaderBorrowings = async (req, res) => {
    try {
        const { readerId } = req.params;
        console.log(`📚 Getting borrowings for reader ${readerId}...`);

        const [borrowings] = await db.query(`
            SELECT 
                br.borrow_id,
                br.book_id,
                br.borrow_date,
                br.due_date,
                br.return_date,
                br.status,
                b.title as book_title,
                b.author_id,
                u.full_name as author_name,
                DATEDIFF(br.due_date, CURRENT_DATE) as days_until_due
            FROM BorrowingRecords br
            JOIN Books b ON br.book_id = b.book_id
            JOIN Authors a ON b.author_id = a.author_id
            JOIN Users u ON a.user_id = u.user_id
            WHERE br.reader_id = ? AND br.status IN ('active', 'overdue')
            ORDER BY br.borrow_date DESC
        `, [readerId]);

        console.log(`✅ Found ${borrowings.length} active borrowings`);
        res.json({
            success: true,
            borrowings: borrowings
        });
    } catch (error) {
        console.error('❌ Get borrowings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get borrowings',
            error: error.message
        });
    }
};

// ============================================
// RETURN BOOK
// ============================================
exports.returnBook = async (req, res) => {
    try {
        const { borrowId } = req.params;
        console.log(`📖 Returning book, borrow ID: ${borrowId}...`);

        await db.query(`
            UPDATE BorrowingRecords
            SET return_date = CURRENT_DATE, status = 'returned'
            WHERE borrow_id = ?
        `, [borrowId]);

        console.log('✅ Book returned');
        res.json({
            success: true,
            message: 'Book returned successfully'
        });
    } catch (error) {
        console.error('❌ Return book error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to return book',
            error: error.message
        });
    }
};

// ============================================
// ADD REVIEW
// ============================================
exports.addReview = async (req, res) => {
    try {
        const { bookId, userId, rating, reviewText } = req.body;
        console.log(`⭐ Adding review for book ${bookId}...`);

        const [result] = await db.query(`
            INSERT INTO Reviews (book_id, user_id, rating, review_text)
            VALUES (?, ?, ?, ?)
        `, [bookId, userId, rating, reviewText]);

        console.log(`✅ Review added, ID: ${result.insertId}`);
        res.json({
            success: true,
            reviewId: result.insertId,
            message: 'Review submitted successfully'
        });
    } catch (error) {
        console.error('❌ Add review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit review',
            error: error.message
        });
    }
};

// ============================================
// GET READER REVIEWS
// ============================================
exports.getReaderReviews = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`⭐ Getting reviews for user ${userId}...`);

        const [reviews] = await db.query(`
            SELECT 
                r.review_id,
                r.book_id,
                r.rating,
                r.review_text,
                r.review_date,
                b.title as book_title
            FROM Reviews r
            JOIN Books b ON r.book_id = b.book_id
            WHERE r.user_id = ?
            ORDER BY r.review_date DESC
        `, [userId]);

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

// ============================================
// SUBMIT FEEDBACK - FIXED!
// ============================================
exports.submitFeedback = async (req, res) => {
    try {
        const { userId, text, type } = req.body;
        console.log(`💭 Submitting ${type} from user ${userId}...`);
        console.log(`📝 Text: ${text}`);

        if (!userId || !text || !type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, text, type'
            });
        }

        let result;
        if (type === 'suggestion') {
            [result] = await db.query(
                'INSERT INTO Suggestions (user_id, suggestion_text, submission_date, status) VALUES (?, ?, CURRENT_TIMESTAMP, "new")', 
                [userId, text]
            );
            console.log(`✅ Suggestion inserted with ID: ${result.insertId}`);
        } else if (type === 'issue') {
            [result] = await db.query(
                'INSERT INTO Issues (user_id, issue_text, submission_date, status) VALUES (?, ?, CURRENT_TIMESTAMP, "new")', 
                [userId, text]
            );
            console.log(`✅ Issue inserted with ID: ${result.insertId}`);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid type. Must be "suggestion" or "issue"'
            });
        }

        res.json({
            success: true,
            id: result.insertId,
            message: type === 'suggestion' ? 'Suggestion submitted' : 'Issue reported'
        });
    } catch (error) {
        console.error('❌ Submit feedback error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback',
            error: error.message
        });
    }
};


// Track when reader reads a book online
exports.trackOnlineReading = async (req, res) => {
    try {
        const { bookId, userId } = req.body;

        console.log(`📖 Tracking online reading: Book ${bookId}, User ${userId}`);

        // Get reader ID
        const [readers] = await db.query(
            'SELECT reader_id FROM Readers WHERE user_id = ?',
            [userId]
        );

        if (readers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reader not found'
            });
        }

        const readerId = readers[0].reader_id;

        // Check if this reader already read this book
        const [existing] = await db.query(`
            SELECT * FROM BorrowingRecords 
            WHERE reader_id = ? AND book_id = ? AND status = 'returned'
        `, [readerId, bookId]);

        // If not already counted, increment counters
        if (existing.length === 0) {
            // Insert a virtual borrowing record to mark as read
            await db.query(`
                INSERT INTO BorrowingRecords 
                (book_id, reader_id, borrow_date, due_date, return_date, status)
                VALUES (?, ?, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, 'returned')
            `, [bookId, readerId]);

            // This will trigger the after_book_return trigger which:
            // - Increments Books.total_readers
            // - Increments Authors.total_readers
            // - Increments Readers.books_read

            console.log('✅ Online reading tracked');
        } else {
            console.log('ℹ️  Reader already counted for this book');
        }

        res.json({
            success: true,
            message: 'Reading tracked'
        });

    } catch (error) {
        console.error('❌ Track reading error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track reading',
            error: error.message
        });
    }
};



// LibraryBackend/controllers/readerController.js

// Track online reading - FIXED VERSION
exports.trackOnlineReading = async (req, res) => {
    try {
        const { bookId, userId } = req.body;

        console.log('📖 trackOnlineReading called');
        console.log('   Book ID:', bookId);
        console.log('   User ID:', userId);

        if (!bookId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Missing bookId or userId'
            });
        }

        // Get reader ID from user ID
        const [readers] = await db.query(
            'SELECT reader_id FROM Readers WHERE user_id = ?',
            [userId]
        );

        if (readers.length === 0) {
            console.error('❌ Reader not found for user:', userId);
            return res.status(404).json({
                success: false,
                message: 'Reader not found'
            });
        }

        const readerId = readers[0].reader_id;
        console.log('   Reader ID:', readerId);

        // Check if already counted for this book
        const [existing] = await db.query(`
            SELECT * FROM BorrowingRecords 
            WHERE reader_id = ? AND book_id = ?
        `, [readerId, bookId]);

        if (existing.length > 0) {
            console.log('ℹ️  Reader already counted for this book');
            return res.json({
                success: true,
                message: 'Already counted',
                alreadyCounted: true
            });
        }

        // Insert borrowing record
        console.log('💾 Inserting borrowing record...');
        const [insertResult] = await db.query(`
            INSERT INTO BorrowingRecords 
            (book_id, reader_id, borrow_date, due_date, return_date, status)
            VALUES (?, ?, CURRENT_DATE, CURRENT_DATE, CURRENT_DATE, 'returned')
        `, [bookId, readerId]);

        console.log('✅ Borrowing record inserted, ID:', insertResult.insertId);

        // ✅ MANUALLY increment all counters (don't rely on trigger)
        await db.query(`
            UPDATE Books 
            SET total_readers = total_readers + 1 
            WHERE book_id = ?
        `, [bookId]);
        console.log('✅ Book total_readers incremented');

        await db.query(`
            UPDATE Authors a
            JOIN Books b ON a.author_id = b.author_id
            SET a.total_readers = a.total_readers + 1
            WHERE b.book_id = ?
        `, [bookId]);
        console.log('✅ Author total_readers incremented');

        await db.query(`
            UPDATE Readers 
            SET books_read = books_read + 1 
            WHERE reader_id = ?
        `, [readerId]);
        console.log('✅ Reader books_read incremented');

        res.json({
            success: true,
            message: 'Reading tracked successfully',
            borrowId: insertResult.insertId
        });

    } catch (error) {
        console.error('❌ trackOnlineReading error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track reading',
            error: error.message
        });
    }
};