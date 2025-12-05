// TEST FILE: LibraryBackend/test-endpoints.js
// Run this to test if your endpoints work

const axios = require('axios');

const API_URL = 'http://localhost:8080/api';

async function testEndpoints() {
    console.log('🧪 Testing Backend Endpoints...\n');

    // Test 1: Statistics
    try {
        console.log('📊 Testing /owner/statistics...');
        const response = await axios.get(`${API_URL}/owner/statistics`);
        console.log('✅ Success:', response.data);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 2: Pending Requests
    try {
        console.log('\n📝 Testing /owner/pending-requests...');
        const response = await axios.get(`${API_URL}/owner/pending-requests`);
        console.log('✅ Success:', response.data);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 3: Overdue Borrowings
    try {
        console.log('\n⚠️  Testing /owner/overdue-borrowings...');
        const response = await axios.get(`${API_URL}/owner/overdue-borrowings`);
        console.log('✅ Success:', response.data);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 4: All Borrowings
    try {
        console.log('\n📚 Testing /owner/all-borrowings...');
        const response = await axios.get(`${API_URL}/owner/all-borrowings`);
        console.log('✅ Success:', response.data);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 5: Employees
    try {
        console.log('\n👥 Testing /owner/employees...');
        const response = await axios.get(`${API_URL}/owner/employees`);
        console.log('✅ Success:', response.data);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 6: Suggestions
    try {
        console.log('\n💡 Testing /owner/suggestions...');
        const response = await axios.get(`${API_URL}/owner/suggestions`);
        console.log('✅ Success:', response.data);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }

    // Test 7: Issues
    try {
        console.log('\n🐛 Testing /owner/issues...');
        const response = await axios.get(`${API_URL}/owner/issues`);
        console.log('✅ Success:', response.data);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
}

testEndpoints();