// LibraryBackend/routes/authorRoutes.js - FIXED VERSION

const express = require('express');
const router = express.Router();
const authorController = require('../controllers/authorController');

console.log('✍️ Loading Author Routes...');

// Get author by user ID
router.get('/get-by-user/:userId', authorController.getAuthorByUserId);

// FILE UPLOAD - Check if uploadMiddleware exists
if (authorController.uploadMiddleware) {
    router.post('/upload-book',
        authorController.uploadMiddleware,
        authorController.uploadBookFile
    );
    console.log('✅ Upload route registered with middleware');
} else {
    // Fallback: no file upload
    console.log('⚠️ Upload middleware not found, skipping upload route');
}

// Books
router.post('/books', authorController.addBook);
router.get('/books/:authorId', authorController.getAuthorBooks);
router.put('/books/:bookId', authorController.updateBook);
router.delete('/books/:bookId', authorController.deleteBook);

// Statistics
router.get('/stats/:authorId', authorController.getAuthorStats);

// Notifications
router.get('/notifications/:authorId', authorController.getNotifications);

// Feedback
router.post('/feedback', authorController.submitFeedback);

console.log('✅ Author Routes loaded successfully');

module.exports = router;