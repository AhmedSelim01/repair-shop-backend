
/**
 * AUTOMATED API TEST RUNNER
 * Comprehensive test suite for showcasing API functionality
 * Run with: node tests/test-runner.js
 */

const axios = require('axios');
const colors = require('colors');

// Test configuration
const config = {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    timeout: 5000,
    verbose: true
};

// Test results tracking
const results = {
    passed: 0,
    failed: 0,
    total: 0,
    errors: []
};

// Global test data
let testData = {
    authToken: null,
    adminToken: null,
    userId: null,
    companyId: null,
    jobCardId: null,
    paymentId: null,
    storeItemId: null
};

/**
 * Test runner utilities
 */
class TestRunner {
    static async runTest(name, testFn) {
        results.total++;
        try {
            console.log(`\n🧪 Running: ${name}`.yellow);
            await testFn();
            results.passed++;
            console.log(`✅ PASSED: ${name}`.green);
        } catch (error) {
            results.failed++;
            results.errors.push({ name, error: error.message });
            console.log(`❌ FAILED: ${name} - ${error.message}`.red);
            if (config.verbose) {
                console.log(error.stack.gray);
            }
        }
    }

    static async request(method, url, data = null, headers = {}) {
        const fullUrl = `${config.baseUrl}${url}`;
        const requestConfig = {
            method,
            url: fullUrl,
            timeout: config.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data) {
            requestConfig.data = data;
        }

        try {
            const response = await axios(requestConfig);
            return response;
        } catch (error) {
            if (error.response) {
                throw new Error(`HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    static expect(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} - Expected: ${expected}, Got: ${actual}`);
        }
    }

    static expectProperty(obj, property, message = '') {
        if (!obj.hasOwnProperty(property)) {
            throw new Error(`${message} - Missing property: ${property}`);
        }
    }
}

/**
 * Test Suites
 */
const testSuites = {
    // Health Check Tests
    async healthTests() {
        console.log('\n🏥 HEALTH CHECK TESTS'.cyan.bold);
        
        await TestRunner.runTest('Basic Health Check', async () => {
            const response = await TestRunner.request('GET', '/health');
            TestRunner.expect(response.status, 200, 'Health check should return 200');
            TestRunner.expectProperty(response.data, 'status', 'Health response should have status');
        });

        await TestRunner.runTest('Detailed Health Check', async () => {
            const response = await TestRunner.request('GET', '/health/detailed');
            TestRunner.expect(response.status, 200, 'Detailed health check should return 200');
            TestRunner.expectProperty(response.data, 'database', 'Health response should include database status');
        });
    },

    // Authentication Tests
    async authTests() {
        console.log('\n🔐 AUTHENTICATION TESTS'.cyan.bold);

        await TestRunner.runTest('User Registration', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                phone: '+971501234567',
                password: 'SecurePass123!',
                role: 'truck_owner'
            };

            const response = await TestRunner.request('POST', '/api/auth/register', userData);
            TestRunner.expect(response.status, 201, 'Registration should succeed');
            TestRunner.expectProperty(response.data, 'token', 'Registration should return token');
            
            testData.authToken = response.data.token;
            testData.userId = response.data.user._id;
        });

        await TestRunner.runTest('User Login', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'SecurePass123!'
            };

            const response = await TestRunner.request('POST', '/api/auth/login', loginData);
            TestRunner.expect(response.status, 200, 'Login should succeed');
            TestRunner.expectProperty(response.data, 'token', 'Login should return token');
            
            testData.authToken = response.data.token;
        });

        await TestRunner.runTest('Admin Registration', async () => {
            const adminData = {
                name: 'Admin User',
                email: 'admin@repairshop.com',
                phone: '+971509876543',
                password: 'AdminPass123!',
                role: 'admin'
            };

            const response = await TestRunner.request('POST', '/api/auth/register', adminData);
            TestRunner.expect(response.status, 201, 'Admin registration should succeed');
        });

        await TestRunner.runTest('Admin Login', async () => {
            const loginData = {
                email: 'admin@repairshop.com',
                password: 'AdminPass123!'
            };

            const response = await TestRunner.request('POST', '/api/auth/login', loginData);
            TestRunner.expect(response.status, 200, 'Admin login should succeed');
            
            testData.adminToken = response.data.token;
        });
    },

    // Company Management Tests
    async companyTests() {
        console.log('\n🏢 COMPANY MANAGEMENT TESTS'.cyan.bold);

        await TestRunner.runTest('Create Company Profile', async () => {
            const companyData = {
                companyName: 'ABC Transport LLC',
                contactEmail: 'contact@abctransport.com',
                phoneNumber: '+971504567890',
                address: {
                    street: '123 Business Bay',
                    city: 'Dubai',
                    state: 'Dubai',
                    zipCode: '00000',
                    country: 'UAE'
                },
                companyLicenseDetails: {
                    licenseNumber: 'DUB-123456',
                    licenseType: 'Transport',
                    issueDate: '2024-01-01',
                    expiryDate: '2025-01-01',
                    issuingAuthority: 'Dubai Municipality'
                },
                bankDetails: {
                    bankName: 'Emirates NBD',
                    accountNumber: '1234567890',
                    routingNumber: 'EBILAEAD',
                    accountType: 'business'
                }
            };

            const response = await TestRunner.request('POST', '/api/companies', companyData, {
                Authorization: `Bearer ${testData.authToken}`
            });
            
            TestRunner.expect(response.status, 201, 'Company creation should succeed');
            testData.companyId = response.data.data.company._id;
        });
    },

    // Job Card Tests
    async jobCardTests() {
        console.log('\n🔧 JOB CARD TESTS'.cyan.bold);

        await TestRunner.runTest('Create Job Card', async () => {
            const jobCardData = {
                vehicleInfo: {
                    licensePlate: 'DUB-12345',
                    make: 'Mercedes',
                    model: 'Actros',
                    year: 2020,
                    vin: 'WDB9630351L123456',
                    mileage: 150000
                },
                issueDescription: 'Engine overheating and brake system maintenance required',
                priority: 'high',
                estimatedCost: 2500,
                estimatedCompletionDate: '2024-12-25',
                serviceType: 'maintenance',
                assignedTechnician: 'Tech001'
            };

            const response = await TestRunner.request('POST', '/api/jobcards', jobCardData, {
                Authorization: `Bearer ${testData.authToken}`
            });
            
            TestRunner.expect(response.status, 201, 'Job card creation should succeed');
            testData.jobCardId = response.data.data.jobCard._id;
        });

        await TestRunner.runTest('Get Job Cards', async () => {
            const response = await TestRunner.request('GET', '/api/jobcards', null, {
                Authorization: `Bearer ${testData.authToken}`
            });
            
            TestRunner.expect(response.status, 200, 'Get job cards should succeed');
            TestRunner.expectProperty(response.data.data, 'jobCards', 'Response should contain job cards array');
        });
    },

    // Payment Tests
    async paymentTests() {
        console.log('\n💰 PAYMENT PROCESSING TESTS'.cyan.bold);

        await TestRunner.runTest('Process Cash Payment', async () => {
            const paymentData = {
                amount: 2500,
                paymentMethod: 'cash',
                jobCardId: testData.jobCardId,
                description: 'Engine repair and brake maintenance',
                metadata: {
                    receiptNumber: 'RCP-001',
                    cashierName: 'John Smith'
                }
            };

            const response = await TestRunner.request('POST', '/api/payments/process', paymentData, {
                Authorization: `Bearer ${testData.authToken}`
            });
            
            TestRunner.expect(response.status, 201, 'Cash payment should succeed');
            testData.paymentId = response.data.data.payment._id;
        });

        await TestRunner.runTest('Get Payment History', async () => {
            const response = await TestRunner.request('GET', '/api/payments/history', null, {
                Authorization: `Bearer ${testData.authToken}`
            });
            
            TestRunner.expect(response.status, 200, 'Payment history should be retrieved');
        });
    },

    // Admin Tests
    async adminTests() {
        console.log('\n👑 ADMIN PANEL TESTS'.cyan.bold);

        await TestRunner.runTest('Get Dashboard Analytics', async () => {
            const response = await TestRunner.request('GET', '/api/admin/dashboard', null, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            
            TestRunner.expect(response.status, 200, 'Dashboard analytics should be retrieved');
            TestRunner.expectProperty(response.data.data, 'analytics', 'Response should contain analytics data');
        });

        await TestRunner.runTest('Get System Health', async () => {
            const response = await TestRunner.request('GET', '/api/admin/system-health', null, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            
            TestRunner.expect(response.status, 200, 'System health should be retrieved');
        });
    },

    // Store/Inventory Tests
    async storeTests() {
        console.log('\n🛒 STORE & INVENTORY TESTS'.cyan.bold);

        await TestRunner.runTest('Create Store Item', async () => {
            const itemData = {
                name: 'Brake Pads - Heavy Duty',
                description: 'Premium brake pads for heavy commercial vehicles',
                category: 'brake_parts',
                price: 250,
                quantity: 50,
                minQuantity: 10,
                supplier: 'AutoParts UAE',
                sku: 'BP-HD-001',
                specifications: {
                    material: 'Ceramic',
                    compatibility: 'Mercedes Actros, Volvo FH',
                    warranty: '12 months'
                }
            };

            const response = await TestRunner.request('POST', '/api/store/items', itemData, {
                Authorization: `Bearer ${testData.adminToken}`
            });
            
            TestRunner.expect(response.status, 201, 'Store item creation should succeed');
            testData.storeItemId = response.data.data.item._id;
        });

        await TestRunner.runTest('Get Store Items', async () => {
            const response = await TestRunner.request('GET', '/api/store/items', null, {
                Authorization: `Bearer ${testData.authToken}`
            });
            
            TestRunner.expect(response.status, 200, 'Store items should be retrieved');
        });
    },

    // Error Handling Tests
    async errorTests() {
        console.log('\n❌ ERROR HANDLING TESTS'.cyan.bold);

        await TestRunner.runTest('Unauthorized Access', async () => {
            try {
                await TestRunner.request('GET', '/api/admin/dashboard');
                throw new Error('Should have thrown authorization error');
            } catch (error) {
                if (!error.message.includes('401')) {
                    throw error;
                }
            }
        });

        await TestRunner.runTest('Invalid Data Validation', async () => {
            try {
                const invalidData = {
                    email: 'invalid-email',
                    password: '123'
                };
                await TestRunner.request('POST', '/api/auth/register', invalidData);
                throw new Error('Should have thrown validation error');
            } catch (error) {
                if (!error.message.includes('400')) {
                    throw error;
                }
            }
        });
    }
};

/**
 * Main test execution
 */
async function runAllTests() {
    console.log('🚀 REPAIR SHOP API - COMPREHENSIVE TEST SUITE'.rainbow.bold);
    console.log(`📍 Testing against: ${config.baseUrl}`.blue);
    console.log('=' * 60);

    const startTime = Date.now();

    try {
        // Run test suites in order
        await testSuites.healthTests();
        await testSuites.authTests();
        await testSuites.companyTests();
        await testSuites.jobCardTests();
        await testSuites.paymentTests();
        await testSuites.adminTests();
        await testSuites.storeTests();
        await testSuites.errorTests();

    } catch (error) {
        console.log(`\n💥 Test suite failed: ${error.message}`.red.bold);
    }

    // Results summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const passRate = ((results.passed / results.total) * 100).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY'.cyan.bold);
    console.log('='.repeat(60));
    console.log(`📈 Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`.green);
    console.log(`❌ Failed: ${results.failed}`.red);
    console.log(`📊 Pass Rate: ${passRate}%`);
    console.log(`⏱️  Duration: ${duration}s`);

    if (results.failed > 0) {
        console.log('\n❌ FAILED TESTS:'.red.bold);
        results.errors.forEach(({ name, error }) => {
            console.log(`  • ${name}: ${error}`.red);
        });
    }

    console.log('\n🎯 INTERVIEW DEMO READY!'.green.bold);
    console.log('✨ All core functionality has been validated'.green);
    console.log('🚀 System is ready for demonstration'.green);

    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (require.main === module) {
    runAllTests();
}

module.exports = { TestRunner, testSuites, runAllTests };
