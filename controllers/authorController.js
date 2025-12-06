// LibraryBackend/controllers/authorController.js

const db = require('../config/database');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ============================================
// UPLOAD BOOK FILE TO CLOUDINARY
// ============================================
exports.uploadBookFile = async (req, res) => {
    try {
        console.log('📤 Upload request received');
        
        if (!req.file) {
            console.error('❌ No file in request');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        console.log('📁 File details:', {
            name: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'raw', // For PDFs
                    folder: 'library_books',
                    public_id: `book_${Date.now()}`,
                    format: 'pdf'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            uploadStream.end(req.file.buffer);
        });

        const filePath = result.secure_url; // This is the Cloudinary URL

        console.log('✅ File uploaded to Cloudinary:', filePath);

        res.json({
            success: true,
            filePath: filePath,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            message: 'File uploaded successfully'
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload file',
            error: error.message
        });
    }
};

// ============================================
// GET AUTHOR BY USER ID
// ============================================
exports.getAuthorByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`👤 Getting author for user ${userId}...`);

        const [authors] = await db.query('SELECT * FROM Authors WHERE user_id = ?', [userId]);

        if (authors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Author not found'
            });
        }

        console.log('✅ Author found:', authors[0].author_id);
        res.json({
            success: true,
            author: authors[0]
        });
    } catch (error) {
        console.error('❌ Get author error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get author',
            error: error.message
        });
    }
};

// ============================================
// ADD NEW BOOK - UPDATED WITH CATEGORIES
// ============================================
exports.addBook = async (req, res) => {
    try {
        const { title, numPages, publicationDate, availabilityType, canBorrow,
                publisher, extraNotes, pdfPath, authorId, categories } = req.body;

        console.log(`📚 Adding new book: ${title}`);
        console.log('📋 Book data:', req.body);

        // Validate required fields
        if (!title || !authorId || !numPages) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, authorId, numPages'
            });
        }

        // Require PDF for online/both
        if ((availabilityType === 'online' || availabilityType === 'both') && !pdfPath) {
            return res.status(400).json({
                success: false,
                message: 'PDF file is required for online and both availability types'
            });
        }

        // Insert book
        const [result] = await db.query(`
            INSERT INTO Books (
                title, author_id, publication_date, num_pages,
                availability_type, can_borrow, pdf_path, publisher, 
                extra_notes, is_published, is_hidden
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, FALSE)
        `, [
            title, 
            authorId, 
            publicationDate || null, 
            numPages, 
            availabilityType || 'both', 
            canBorrow !== false,
            pdfPath || null, 
            publisher || null, 
            extraNotes || null
        ]);

        const bookId = result.insertId;
        console.log(`✅ Book added with ID: ${bookId}`);

        // ✅ INSERT CATEGORIES
        if (categories && categories.length > 0) {
            console.log(`📚 Adding ${categories.length} categories...`);
            
            for (const categoryId of categories) {
                await db.query(`
                    INSERT INTO BookCategories (book_id, category_id)
                    VALUES (?, ?)
                `, [bookId, categoryId]);
            }
            
            console.log('✅ Categories added');
        }

        res.json({
            success: true,
            bookId: bookId,
            message: 'Book submitted for approval'
        });

    } catch (error) {
        console.error('❌ Add book error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add book',
            error: error.message
        });
    }
};

// ============================================
// GET AUTHOR'S BOOKS
// ============================================
exports.getAuthorBooks = async (req, res) => {
    try {
        const { authorId } = req.params;
        console.log(`📚 Getting books for author ${authorId}...`);

        const [books] = await db.query(`
            SELECT 
                b.*,
                pr.status as publish_status,
                pr.request_date,
                pr.reviewed_date
            FROM Books b
            LEFT JOIN PublishingRequests pr ON b.book_id = pr.book_id
            WHERE b.author_id = ?
            ORDER BY b.created_at DESC
        `, [authorId]);

        console.log(`✅ Found ${books.length} books`);

        res.json({
            success: true,
            books: books
        });

    } catch (error) {
        console.error('❌ Get author books error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get books',
            error: error.message
        });
    }
};

// ============================================
// GET AUTHOR STATISTICS
// ============================================
exports.getAuthorStats = async (req, res) => {
    try {
        const { authorId } = req.params;
        console.log(`📊 Getting stats for author ${authorId}...`);

        const [stats] = await db.query(`
            SELECT 
                a.author_id,
                u.full_name AS author_name,
                u.email,
                a.phone,
                a.total_books,
                a.avg_rating,
                a.total_readers,
                COUNT(DISTINCT b.book_id) AS published_books,
                COALESCE(SUM(b.total_reviews), 0) AS total_reviews
            FROM Authors a
            JOIN Users u ON a.user_id = u.user_id
            LEFT JOIN Books b ON a.author_id = b.author_id AND b.is_published = TRUE
            WHERE a.author_id = ?
            GROUP BY a.author_id, u.full_name, u.email, a.phone, 
                     a.total_books, a.avg_rating, a.total_readers
        `, [authorId]);

        if (stats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Author not found'
            });
        }

        console.log('✅ Stats retrieved');

        res.json({
            success: true,
            stats: stats[0]
        });

    } catch (error) {
        console.error('❌ Get author stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
};

// ============================================
// UPDATE BOOK
// ============================================
exports.updateBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        const { title, publicationDate, numPages, availabilityType, canBorrow,
                publisher, extraNotes, isHidden } = req.body;

        console.log(`✏️ Updating book ${bookId}...`);

        await db.query(`
            UPDATE Books
            SET title = COALESCE(?, title),
                publication_date = COALESCE(?, publication_date),
                num_pages = COALESCE(?, num_pages),
                availability_type = COALESCE(?, availability_type),
                can_borrow = COALESCE(?, can_borrow),
                publisher = COALESCE(?, publisher),
                extra_notes = COALESCE(?, extra_notes),
                is_hidden = COALESCE(?, is_hidden)
            WHERE book_id = ?
        `, [title, publicationDate, numPages, availabilityType, canBorrow,
            publisher, extraNotes, isHidden, bookId]);

        console.log('✅ Book updated');

        res.json({
            success: true,
            message: 'Book updated successfully'
        });

    } catch (error) {
        console.error('❌ Update book error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update book',
            error: error.message
        });
    }
};

// ============================================
// DELETE BOOK
// ============================================
exports.deleteBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        console.log(`🗑️ Deleting book ${bookId}...`);

        await db.query('DELETE FROM Books WHERE book_id = ?', [bookId]);

        console.log('✅ Book deleted');

        res.json({
            success: true,
            message: 'Book deleted successfully'
        });

    } catch (error) {
        console.error('❌ Delete book error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete book',
            error: error.message
        });
    }
};

// ============================================
// GET NOTIFICATIONS
// ============================================
exports.getNotifications = async (req, res) => {
    try {
        const { authorId } = req.params;
        console.log(`🔔 Getting notifications for author ${authorId}...`);

        // Get book approvals/rejections
        const [bookNotifications] = await db.query(`
            SELECT 
                pr.request_id,
                pr.book_id,
                pr.status,
                pr.reviewed_date,
                pr.reviewer_notes,
                b.title as book_title,
                'book_status' as notification_type
            FROM PublishingRequests pr
            JOIN Books b ON pr.book_id = b.book_id
            WHERE b.author_id = ? 
            AND pr.status IN ('approved', 'rejected')
            AND pr.reviewed_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY pr.reviewed_date DESC
        `, [authorId]);

        // Get recent reviews
        const [reviewNotifications] = await db.query(`
            SELECT 
                r.review_id,
                r.book_id,
                r.rating,
                r.review_text,
                r.review_date,
                b.title as book_title,
                u.full_name as reviewer_name,
                'new_review' as notification_type
            FROM Reviews r
            JOIN Books b ON r.book_id = b.book_id
            JOIN Users u ON r.user_id = u.user_id
            WHERE b.author_id = ?
            AND r.review_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY r.review_date DESC
        `, [authorId]);

        const notifications = [
            ...bookNotifications.map(n => ({
                ...n,
                date: n.reviewed_date,
                message: `Your book "${n.book_title}" has been ${n.status}`
            })),
            ...reviewNotifications.map(n => ({
                ...n,
                date: n.review_date,
                message: `${n.reviewer_name} reviewed "${n.book_title}" - ${n.rating}⭐`
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log(`✅ Found ${notifications.length} notifications`);

        res.json({
            success: true,
            notifications: notifications,
            unread_count: notifications.length
        });

    } catch (error) {
        console.error('❌ Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notifications',
            error: error.message
        });
    }
};

// ============================================
// SUBMIT FEEDBACK
// ============================================
exports.submitFeedback = async (req, res) => {
    try {
        const { userId, text, type } = req.body;
        console.log(`💭 Author submitting ${type} from user ${userId}...`);

        if (!userId || !text || !type) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        let result;
        if (type === 'suggestion') {
            [result] = await db.query(
                'INSERT INTO Suggestions (user_id, suggestion_text, submission_date, status) VALUES (?, ?, CURRENT_TIMESTAMP, "new")', 
                [userId, text]
            );
        } else if (type === 'issue') {
            [result] = await db.query(
                'INSERT INTO Issues (user_id, issue_text, submission_date, status) VALUES (?, ?, CURRENT_TIMESTAMP, "new")', 
                [userId, text]
            );
        }

        console.log(`✅ ${type} inserted with ID: ${result.insertId}`);

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