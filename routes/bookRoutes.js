const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

router.get('/', bookController.getAllBooks);
router.get('/search', bookController.searchBooks);
router.get('/:bookId', bookController.getBookById);
router.get('/:bookId/reviews', bookController.getBookReviews);

module.exports = router;