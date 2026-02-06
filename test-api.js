#!/usr/bin/env node

/**
 * Backend API Test Script
 * Tests all critical endpoints to ensure they're working
 */

const axios = require('axios');

// Change this to your deployed URL or keep localhost for local testing
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, path, expectedStatus, data = null) {
    try {
        const url = `${BASE_URL}${path}`;
        log(`\nTesting: ${method} ${url}`, 'cyan');

        const config = {
            method,
            url,
            validateStatus: () => true // Don't throw on any status
        };

        if (data) {
            config.data = data;
            config.headers = { 'Content-Type': 'application/json' };
        }

        const response = await axios(config);

        if (response.status === expectedStatus) {
            log(`✅ PASS - Status: ${response.status}`, 'green');
            if (response.data) {
                console.log('Response:', JSON.stringify(response.data, null, 2));
            }
            return true;
        } else {
            log(`❌ FAIL - Expected ${expectedStatus}, got ${response.status}`, 'red');
            console.log('Response:', JSON.stringify(response.data, null, 2));
            return false;
        }
    } catch (error) {
        log(`❌ ERROR - ${error.message}`, 'red');
        return false;
    }
}

async function runTests() {
    log('\n🧪 Starting Backend API Tests', 'yellow');
    log(`📍 Base URL: ${BASE_URL}`, 'yellow');
    log('═'.repeat(60), 'yellow');

    const results = [];

    // Test 1: Health Check
    results.push(await testEndpoint('GET', '/health', 200));

    // Test 2: API Test Endpoint
    results.push(await testEndpoint('GET', '/api/test', 200));

    // Test 3: Auth Login (should fail with 400/401, not 404)
    results.push(await testEndpoint('POST', '/api/auth/login', 400, {
        email: 'invalid',
        password: 'invalid'
    }));

    // Test 4: Modules (should fail with 401, not 404)
    results.push(await testEndpoint('GET', '/api/modules', 401));

    // Test 5: Lessons (should fail with 401, not 404)
    results.push(await testEndpoint('GET', '/api/lessons', 401));

    // Test 6: Non-existent route (should be 404)
    results.push(await testEndpoint('GET', '/api/nonexistent', 404));

    // Summary
    log('\n═'.repeat(60), 'yellow');
    const passed = results.filter(r => r).length;
    const total = results.length;

    if (passed === total) {
        log(`\n✅ All tests passed! (${passed}/${total})`, 'green');
        process.exit(0);
    } else {
        log(`\n❌ Some tests failed (${passed}/${total})`, 'red');
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    log(`\n💥 Fatal error: ${error.message}`, 'red');
    process.exit(1);
});
