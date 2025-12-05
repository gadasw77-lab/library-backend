// ============================================
// FILE 3: ownerRoutes.js
// ============================================
const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');

router.get('/statistics', ownerController.getStatistics);
router.get('/statistics-by-date', ownerController.getStatisticsByDate);
router.get('/pending-requests', ownerController.getPendingRequests);
router.put('/approve-book/:bookId', ownerController.approveBook);
router.put('/reject-book/:bookId', ownerController.rejectBook);
router.get('/overdue-borrowings', ownerController.getOverdueBorrowings);
router.get('/all-borrowings', ownerController.getAllBorrowings);
router.get('/employees', ownerController.getEmployees);
router.get('/suggestions', ownerController.getSuggestions);
router.get('/issues', ownerController.getIssues);

module.exports = router;