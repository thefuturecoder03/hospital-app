const { calculatePriority } = require('../src/services/priorityService');

/**
 * Simple test suite to verify medical priority logic
 */
const runTests = () => {
    console.log("--- Starting Patient Priority Tests ---");

    const cases = [
        {
            name: "High Risk Infectious Patient",
            data: { age: 75, condition: 'Infectious', isHighRisk: true },
            expectedMin: 75
        },
        {
            name: "Standard Young Patient",
            data: { age: 25, condition: 'Standard', isHighRisk: false },
            expectedMin: 0
        },
        {
            name: "Respiratory Middle-Aged Patient",
            data: { age: 50, condition: 'Respiratory', isHighRisk: false },
            expectedMin: 30
        }
    ];

    cases.forEach(test => {
        const score = calculatePriority(test.data);
        if (score >= test.expectedMin) {
            console.log(`✅ PASS: ${test.name} (Score: ${score})`);
        } else {
            console.log(`❌ FAIL: ${test.name} (Expected at least ${test.expectedMin}, got ${score})`);
        }
    });

    console.log("--- Tests Complete ---");
};

runTests();
