// LibraryBackend/check-exports.js
// Run this to check if all controller functions are properly exported

console.log('🔍 Checking Controller Exports...\n');

try {
    // Check Reader Controller
    console.log('📖 Checking readerController.js...');
    const readerController = require('./controllers/readerController');
    const readerFunctions = [
        'getReaderByUserId',
        'getReaderStats',
        'borrowBook',
        'getReaderBorrowings',
        'returnBook',
        'addReview',
        'getReaderReviews',
        'submitFeedback'
    ];
    
    readerFunctions.forEach(func => {
        if (typeof readerController[func] === 'function') {
            console.log(`   ✅ ${func}`);
        } else {
            console.log(`   ❌ ${func} - MISSING OR NOT A FUNCTION!`);
        }
    });

    // Check Author Controller
    console.log('\n✍️  Checking authorController.js...');
    const authorController = require('./controllers/authorController');
    const authorFunctions = [
        'getAuthorByUserId',
        'addBook',
        'getAuthorBooks',
        'getAuthorStats',
        'updateBook',
        'deleteBook',
        'submitFeedback'
    ];
    
    authorFunctions.forEach(func => {
        if (typeof authorController[func] === 'function') {
            console.log(`   ✅ ${func}`);
        } else {
            console.log(`   ❌ ${func} - MISSING OR NOT A FUNCTION!`);
        }
    });

    // Check Owner Controller
    console.log('\n👤 Checking ownerController.js...');
    const ownerController = require('./controllers/ownerController');
    const ownerFunctions = [
        'getStatistics',
        'getPendingRequests',
        'approveBook',
        'rejectBook',
        'getOverdueBorrowings',
        'getAllBorrowings',
        'getEmployees',
        'getSuggestions',
        'getIssues',
        'getStatisticsByDate'
    ];
    
    ownerFunctions.forEach(func => {
        if (typeof ownerController[func] === 'function') {
            console.log(`   ✅ ${func}`);
        } else {
            console.log(`   ❌ ${func} - MISSING OR NOT A FUNCTION!`);
        }
    });

    console.log('\n✅ All checks complete!');

} catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
}