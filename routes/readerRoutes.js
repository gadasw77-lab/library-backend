// ============================================
// FILE 5: readerRoutes.js
// ============================================
const express = require('express');
const router = express.Router();
const readerController = require('../controllers/readerController');

router.get('/get-by-user/:userId', readerController.getReaderByUserId);
router.get('/stats/:readerId', readerController.getReaderStats);
router.post('/borrow', readerController.borrowBook);
router.get('/borrowings/:readerId', readerController.getReaderBorrowings);
router.put('/return/:borrowId', readerController.returnBook);
router.post('/review', readerController.addReview);
router.get('/reviews/:userId', readerController.getReaderReviews);
router.post('/feedback', readerController.submitFeedback);
router.post('/track-reading', readerController.trackOnlineReading);

router.post('/track-reading', readerController.trackOnlineReading);

module.exports = router;