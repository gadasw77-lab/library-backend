// LibraryBackend/controllers/ownerController.js - COMPLETE VERSION

const db = require('../config/database');

// ============================================
// STATISTICS
// ============================================

exports.getStatistics = async (req, res) => {
    try {
        console.log('📊 Getting statistics...');

        // Get total published books
        const [books] = await db.query(`
            SELECT COUNT(*) as count 
            FROM Books 
            WHERE is_published = TRUE
        `);

        // Get total readers
        const [readers] = await db.query(`
            SELECT COUNT(*) as count 
            FROM Readers
        `);

        // Get total authors
        const [authors] = await db.query(`
            SELECT COUNT(*) as count 
            FROM Authors
        `);

        // Get overdue books
        const [overdue] = await db.query(`
            SELECT COUNT(*) as count 
            FROM BorrowingRecords 
            WHERE status = 'overdue'
        `);

        const stats = {
            success: true,
            totalBooks: books[0].count,
            totalReaders: readers[0].count,
            totalAuthors: authors[0].count,
            overdueBooks: overdue[0].count
        };

        console.log('✅ Statistics:', stats);
        res.json(stats);

    } catch (error) {
        console.error('❌ Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
};

// ============================================
// PUBLISHING REQUESTS
// ============================================

exports.getPendingRequests = async (req, res) => {
    try {
        console.log('📝 Getting pending requests...');

        const [requests] = await db.query(`
            SELECT 
                pr.request_id,
                pr.book_id,
                pr.request_date,
                pr.status,
                b.title,
                b.num_pages,
                u.full_name as author_name,
                u.email as author_email,
                GROUP_CONCAT(DISTINCT c.category_name SEPARATOR ', ') as categories
            FROM PublishingRequests pr
            JOIN Books b ON pr.book_id = b.book_id
            JOIN Authors a ON b.author_id = a.author_id
            JOIN Users u ON a.user_id = u.user_id
            LEFT JOIN BookCategories bc ON b.book_id = bc.book_id
            LEFT JOIN Categories c ON bc.category_id = c.category_id
            WHERE pr.status = 'pending'
            GROUP BY pr.request_id, pr.book_id, pr.request_date, pr.status, 
                     b.title, b.num_pages, u.full_name, u.email
            ORDER BY pr.request_date ASC
        `);

        console.log(`✅ Found ${requests.length} pending requests`);

        res.json({
            success: true,
            requests: requests
        });

    } catch (error) {
        console.error('❌ Get pending requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pending requests',
            error: error.message
        });
    }
};

exports.approveBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        console.log(`✅ Approving book ${bookId}...`);

        // Update publishing request
        await db.query(`
            UPDATE PublishingRequests
            SET status = 'approved', reviewed_date = CURRENT_TIMESTAMP
            WHERE book_id = ? AND status = 'pending'
        `, [bookId]);

        // IMPORTANT: Publish the book!
        await db.query(`
            UPDATE Books
            SET is_published = TRUE, is_hidden = FALSE
            WHERE book_id = ?
        `, [bookId]);

        console.log(`✅ Book ${bookId} approved and published`);

        res.json({
            success: true,
            message: 'Book approved and published successfully'
        });

    } catch (error) {
        console.error('❌ Approve book error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve book',
            error: error.message
        });
    }
};

exports.rejectBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        console.log(`❌ Rejecting book ${bookId}...`);

        await db.query(`
            UPDATE PublishingRequests
            SET status = 'rejected', reviewed_date = CURRENT_TIMESTAMP
            WHERE book_id = ? AND status = 'pending'
        `, [bookId]);

        console.log(`✅ Book ${bookId} rejected`);

        res.json({
            success: true,
            message: 'Book rejected'
        });

    } catch (error) {
        console.error('❌ Reject book error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject book',
            error: error.message
        });
    }
};

// ============================================
// BORROWINGS
// ============================================

exports.getOverdueBorrowings = async (req, res) => {
    try {
        console.log('⚠️  Getting overdue borrowings...');

        const [borrowings] = await db.query(`
            SELECT 
                br.borrow_id,
                u.full_name AS reader_name,
                u.email AS reader_email,
                b.title AS book_title,
                b.book_id,
                br.borrow_date,
                br.due_date,
                DATEDIFF(CURRENT_DATE, br.due_date) AS days_overdue,
                r.warning_count
            FROM BorrowingRecords br
            JOIN Readers r ON br.reader_id = r.reader_id
            JOIN Users u ON r.user_id = u.user_id
            JOIN Books b ON br.book_id = b.book_id
            WHERE br.status = 'overdue' 
            AND br.return_date IS NULL
            ORDER BY days_overdue DESC
        `);

        console.log(`✅ Found ${borrowings.length} overdue borrowings`);

        res.json({
            success: true,
            borrowings: borrowings
        });

    } catch (error) {
        console.error('❌ Get overdue borrowings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get overdue borrowings',
            error: error.message
        });
    }
};

exports.getAllBorrowings = async (req, res) => {
    try {
        console.log('📚 Getting all borrowings...');

        const [borrowings] = await db.query(`
            SELECT 
                br.borrow_id,
                u.full_name AS reader_name,
                b.title AS book_title,
                b.book_id,
                br.borrow_date,
                br.due_date,
                br.return_date,
                br.status
            FROM BorrowingRecords br
            JOIN Readers r ON br.reader_id = r.reader_id
            JOIN Users u ON r.user_id = u.user_id
            JOIN Books b ON br.book_id = b.book_id
            ORDER BY br.borrow_date DESC
        `);

        console.log(`✅ Found ${borrowings.length} borrowings`);

        res.json({
            success: true,
            borrowings: borrowings
        });

    } catch (error) {
        console.error('❌ Get all borrowings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get borrowings',
            error: error.message
        });
    }
};

// ============================================
// EMPLOYEES
// ============================================

exports.getEmployees = async (req, res) => {
    try {
        console.log('👥 Getting employees...');

        const [employees] = await db.query(`
            SELECT 
                employee_id,
                full_name,
                email,
                position,
                work_evaluation,
                warning_count_3months,
                total_holidays,
                CASE 
                    WHEN warning_count_3months >= 5 THEN 'danger'
                    WHEN warning_count_3months >= 3 THEN 'warning'
                    WHEN warning_count_3months >= 1 THEN 'yellow'
                    ELSE 'success'
                END AS warning_status_color
            FROM Employees
            ORDER BY full_name ASC
        `);

        console.log(`✅ Found ${employees.length} employees`);

        res.json({
            success: true,
            employees: employees
        });

    } catch (error) {
        console.error('❌ Get employees error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get employees',
            error: error.message
        });
    }
};

// ============================================
// FEEDBACK - SUGGESTIONS & ISSUES
// ============================================

exports.getSuggestions = async (req, res) => {
    try {
        console.log('💡 Getting suggestions...');

        const [suggestions] = await db.query(`
            SELECT 
                s.suggestion_id,
                s.user_id,
                s.suggestion_text,
                s.submission_date,
                s.status,
                u.full_name as user_name,
                u.email
            FROM Suggestions s
            JOIN Users u ON s.user_id = u.user_id
            ORDER BY s.submission_date DESC
        `);

        console.log(`✅ Found ${suggestions.length} suggestions`);

        res.json({
            success: true,
            suggestions: suggestions
        });

    } catch (error) {
        console.error('❌ Get suggestions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get suggestions',
            error: error.message
        });
    }
};

exports.getIssues = async (req, res) => {
    try {
        console.log('🐛 Getting issues...');

        const [issues] = await db.query(`
            SELECT 
                i.issue_id,
                i.user_id,
                i.issue_text,
                i.submission_date,
                i.status,
                i.resolution_notes,
                u.full_name as user_name,
                u.email
            FROM Issues i
            JOIN Users u ON i.user_id = u.user_id
            ORDER BY i.submission_date DESC
        `);

        console.log(`✅ Found ${issues.length} issues`);

        res.json({
            success: true,
            issues: issues
        });

    } catch (error) {
        console.error('❌ Get issues error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get issues',
            error: error.message
        });
    }
};

// ============================================
// STATISTICS BY DATE RANGE
// ============================================

exports.getStatisticsByDate = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        console.log(`📈 Getting statistics from ${startDate} to ${endDate}...`);

        // Reader statistics
        const [readerStats] = await db.query(`
            SELECT 
                COUNT(DISTINCT r.reader_id) AS total_readers,
                COUNT(DISTINCT br.borrow_id) AS total_borrows,
                COALESCE(AVG(r.books_borrowed), 0) AS avg_books_per_reader
            FROM Readers r
            LEFT JOIN BorrowingRecords br ON r.reader_id = br.reader_id
                AND br.borrow_date BETWEEN ? AND ?
        `, [startDate, endDate]);

        // Author statistics
        const [authorStats] = await db.query(`
            SELECT 
                COUNT(DISTINCT a.author_id) AS total_authors,
                COUNT(DISTINCT b.book_id) AS books_published,
                COALESCE(AVG(a.avg_rating), 0) AS avg_author_rating
            FROM Authors a
            LEFT JOIN Books b ON a.author_id = b.author_id
                AND b.created_at BETWEEN ? AND ?
                AND b.is_published = TRUE
        `, [startDate, endDate]);

        // Review statistics
        const [reviewStats] = await db.query(`
            SELECT 
                COUNT(*) AS total_reviews,
                COALESCE(AVG(rating), 0) AS avg_rating
            FROM Reviews
            WHERE review_date BETWEEN ? AND ?
        `, [startDate, endDate]);

        console.log('✅ Statistics calculated');

        res.json({
            success: true,
            readerStats: readerStats[0],
            authorStats: authorStats[0],
            reviewStats: reviewStats[0]
        });

    } catch (error) {
        console.error('❌ Get statistics by date error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
};