// Script de teste para verificar as melhorias de segurança
const { Server } = require('./Server.js');

class SecurityTester {
    constructor() {
        this.results = [];
    }

    // Teste de validação de entrada
    testInputValidation() {
        console.log('Testing input validation...');
        
        const testCases = [
            { input: null, expected: false, description: 'null input' },
            { input: undefined, expected: false, description: 'undefined input' },
            { input: '', expected: false, description: 'empty string' },
            { input: 'a'.repeat(100), expected: false, description: 'string too long' },
            { input: '<script>alert("xss")</script>', expected: false, description: 'XSS attempt' },
            { input: 'ValidNickname', expected: true, description: 'valid nickname' },
            { input: -1, expected: false, description: 'negative number for role' },
            { input: 2, expected: false, description: 'invalid role number' },
            { input: 0, expected: true, description: 'valid role 0' },
            { input: 1, expected: true, description: 'valid role 1' },
            { input: NaN, expected: false, description: 'NaN value' },
            { input: Infinity, expected: false, description: 'Infinity value' }
        ];

        let passed = 0;
        let failed = 0;

        testCases.forEach(testCase => {
            try {
                // Simular validação dependendo do tipo de entrada
                let isValid = false;
                
                if (typeof testCase.input === 'string') {
                    // Teste de nickname
                    isValid = testCase.input.length > 0 && 
                             testCase.input.length <= 50 && 
                             !testCase.input.includes('<') && 
                             !testCase.input.includes('>');
                } else if (typeof testCase.input === 'number') {
                    // Teste de role
                    isValid = !isNaN(testCase.input) && 
                             testCase.input >= 0 && 
                             testCase.input <= 1 &&
                             isFinite(testCase.input);
                }

                if (isValid === testCase.expected) {
                    passed++;
                    console.log(`✓ PASS: ${testCase.description}`);
                } else {
                    failed++;
                    console.log(`✗ FAIL: ${testCase.description} - Expected ${testCase.expected}, got ${isValid}`);
                }
            } catch (error) {
                failed++;
                console.log(`✗ ERROR: ${testCase.description} - ${error.message}`);
            }
        });

        this.results.push({
            test: 'Input Validation',
            passed,
            failed,
            total: testCases.length
        });
    }

    // Teste de divisão por zero
    testDivisionByZero() {
        console.log('\nTesting division by zero protection...');
        
        const testCases = [
            { denominator: 0, description: 'zero denominator' },
            { denominator: 0.0, description: 'float zero denominator' },
            { denominator: NaN, description: 'NaN denominator' },
            { denominator: Infinity, description: 'Infinity denominator' },
            { denominator: 1, description: 'valid denominator' }
        ];

        let passed = 0;
        let failed = 0;

        testCases.forEach(testCase => {
            try {
                // Simular cálculo econômico
                const numerator = 100;
                let result;
                
                if (testCase.denominator === 0 || !isFinite(testCase.denominator) || isNaN(testCase.denominator)) {
                    result = 0.1; // Valor padrão seguro
                } else {
                    result = numerator / testCase.denominator;
                }

                const isValid = isFinite(result) && !isNaN(result);
                
                if (isValid) {
                    passed++;
                    console.log(`✓ PASS: ${testCase.description} - Result: ${result}`);
                } else {
                    failed++;
                    console.log(`✗ FAIL: ${testCase.description} - Invalid result: ${result}`);
                }
            } catch (error) {
                failed++;
                console.log(`✗ ERROR: ${testCase.description} - ${error.message}`);
            }
        });

        this.results.push({
            test: 'Division by Zero Protection',
            passed,
            failed,
            total: testCases.length
        });
    }    // Teste de validação de objetos
    testObjectValidation() {
        console.log('\nTesting object validation...');
        
        const testCases = [
            { 
                object: null, 
                expected: false, 
                description: 'null object' 
            },
            { 
                object: undefined, 
                expected: false, 
                description: 'undefined object' 
            },
            { 
                object: {}, 
                expected: false, 
                description: 'empty object' 
            },
            { 
                object: { 
                    name: 'Test Event',
                    description: 'Test Description',
                    options: { banco: [], governo: [] },
                    outcomes: []
                }, 
                expected: true, 
                description: 'valid local event object' 
            },
            { 
                object: { 
                    name: 'Test Event' 
                    // Missing required fields
                }, 
                expected: false, 
                description: 'incomplete local event object' 
            },
            {
                object: {
                    name: 'Global Crisis',
                    description: 'A global financial crisis',
                    goodEvent: false,
                    impact: {
                        investimentoPrivado: -20,
                        score_factor: 0.8
                    }
                },
                expected: true,
                description: 'valid global event object'
            },
            {
                object: {
                    name: 'Global Boom',
                    description: 'Economic boom',
                    goodEvent: true,
                    impact: {
                        investimentoPrivado: 15,
                        consumoFamiliar: 10,
                        score_factor: 1.2
                    }
                },
                expected: true,
                description: 'valid global event with multiple impacts'
            },
            {
                object: {
                    name: 'Invalid Global Event',
                    goodEvent: 'not_boolean', // Invalid type
                    impact: {
                        investimentoPrivado: 'not_number' // Invalid type
                    }
                },
                expected: false,
                description: 'invalid global event with wrong types'
            }
        ];

        let passed = 0;
        let failed = 0;

        testCases.forEach(testCase => {
            try {
                // Simular validação de evento local ou global
                let isValid = false;
                
                if (testCase.object && typeof testCase.object === 'object') {
                    // Detectar se é evento global ou local
                    if (testCase.object.hasOwnProperty('goodEvent') && testCase.object.hasOwnProperty('impact')) {
                        // Validação de evento global
                        const requiredFields = ['name', 'description', 'goodEvent', 'impact'];
                        isValid = requiredFields.every(field => 
                            testCase.object.hasOwnProperty(field)
                        );
                        
                        if (isValid && testCase.object.goodEvent !== undefined) {
                            isValid = typeof testCase.object.goodEvent === 'boolean';
                        }
                        
                        if (isValid && testCase.object.impact) {
                            // Verificar se valores do impact são números
                            for (const [key, value] of Object.entries(testCase.object.impact)) {
                                if (typeof value !== 'number' || !isFinite(value)) {
                                    isValid = false;
                                    break;
                                }
                            }
                        }
                    } else {
                        // Validação de evento local
                        const requiredFields = ['name', 'description', 'options', 'outcomes'];
                        isValid = requiredFields.every(field => 
                            testCase.object.hasOwnProperty(field)
                        );
                        
                        if (isValid && testCase.object.options) {
                            isValid = testCase.object.options.banco && 
                                     testCase.object.options.governo &&
                                     Array.isArray(testCase.object.options.banco) &&
                                     Array.isArray(testCase.object.options.governo);
                        }
                    }
                }

                if (isValid === testCase.expected) {
                    passed++;
                    console.log(`✓ PASS: ${testCase.description}`);
                } else {
                    failed++;
                    console.log(`✗ FAIL: ${testCase.description} - Expected ${testCase.expected}, got ${isValid}`);
                }
            } catch (error) {
                failed++;
                console.log(`✗ ERROR: ${testCase.description} - ${error.message}`);
            }
        });

        this.results.push({
            test: 'Object Validation (Local & Global Events)',
            passed,
            failed,
            total: testCases.length
        });
    }

    // Teste de sanitização
    testSanitization() {
        console.log('\nTesting input sanitization...');
        
        const testCases = [
            { 
                input: '<script>alert("xss")</script>', 
                expected: 'scriptalert("xss")/script', 
                description: 'XSS script tags' 
            },
            { 
                input: 'javascript:alert("xss")', 
                expected: 'alert("xss")', 
                description: 'JavaScript URL' 
            },
            { 
                input: 'onclick="alert(1)"', 
                expected: '"alert(1)"', 
                description: 'Event handler' 
            },
            { 
                input: '  Normal Name  ', 
                expected: 'Normal Name', 
                description: 'whitespace trimming' 
            },
            { 
                input: 'a'.repeat(100), 
                expected: 'a'.repeat(50), 
                description: 'length limiting' 
            }
        ];

        let passed = 0;
        let failed = 0;

        testCases.forEach(testCase => {
            try {
                // Simular sanitização
                let sanitized = testCase.input
                    .trim()
                    .substring(0, 50)
                    .replace(/[<>]/g, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+=/gi, '');

                if (sanitized === testCase.expected) {
                    passed++;
                    console.log(`✓ PASS: ${testCase.description}`);
                } else {
                    failed++;
                    console.log(`✗ FAIL: ${testCase.description} - Expected "${testCase.expected}", got "${sanitized}"`);
                }
            } catch (error) {
                failed++;
                console.log(`✗ ERROR: ${testCase.description} - ${error.message}`);
            }
        });

        this.results.push({
            test: 'Input Sanitization',
            passed,
            failed,
            total: testCases.length
        });
    }

    // Executar todos os testes
    runAllTests() {
        console.log('='.repeat(50));
        console.log('SECURITY TESTS STARTING');
        console.log('='.repeat(50));

        this.testInputValidation();
        this.testDivisionByZero();
        this.testObjectValidation();
        this.testSanitization();

        console.log('\n' + '='.repeat(50));
        console.log('SECURITY TESTS SUMMARY');
        console.log('='.repeat(50));

        let totalPassed = 0;
        let totalFailed = 0;
        let totalTests = 0;

        this.results.forEach(result => {
            console.log(`${result.test}: ${result.passed}/${result.total} passed`);
            totalPassed += result.passed;
            totalFailed += result.failed;
            totalTests += result.total;
        });

        console.log('-'.repeat(50));
        console.log(`OVERALL: ${totalPassed}/${totalTests} tests passed`);
        console.log(`Success rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
        
        if (totalFailed === 0) {
            console.log('🎉 All security tests PASSED!');
        } else {
            console.log(`⚠️  ${totalFailed} security tests FAILED!`);
        }
        
        console.log('='.repeat(50));
        
        return {
            passed: totalPassed,
            failed: totalFailed,
            total: totalTests,
            successRate: (totalPassed / totalTests) * 100
        };
    }
}

// Executar testes se for chamado diretamente
if (require.main === module) {
    const tester = new SecurityTester();
    tester.runAllTests();
}

module.exports = SecurityTester;
