import { tokenize } from '../src/tokenizer.js';
import { parse } from '../src/parser.js';

function systemLookup(name) {
    const systemSymbols = {
        'SIN': { type: 'function', arity: 1 },
        'COS': { type: 'function', arity: 1 },
        'PI': { type: 'constant', value: Math.PI },
        'E': { type: 'constant', value: Math.E }
    };
    return systemSymbols[name] || { type: 'identifier' };
}

function test(code, expectedType, description) {
    try {
        const tokens = tokenize(code);
        const ast = parse(tokens, systemLookup);
        
        // Handle case where code doesn't end with semicolon (like empty set)
        const actualType = ast[0].expression ? ast[0].expression.type : ast[0].type;
        
        if (actualType === expectedType) {
            console.log(`✓ ${description}: ${code} → ${actualType}`);
            return true;
        } else {
            console.log(`✗ ${description}: Expected ${expectedType}, got ${actualType}`);
            return false;
        }
    } catch (error) {
        console.log(`✗ ${description}: ${code} → Error: ${error.message}`);
        return false;
    }
}

function testError(code, expectedError, description) {
    try {
        const tokens = tokenize(code);
        parse(tokens, systemLookup);
        console.log(`✗ ${description}: Expected error but parsing succeeded`);
        return false;
    } catch (error) {
        if (error.message.includes(expectedError)) {
            console.log(`✓ ${description}: ${code} → ${expectedError}`);
            return true;
        } else {
            console.log(`✗ ${description}: Expected "${expectedError}", got "${error.message}"`);
            return false;
        }
    }
}

console.log('RiX Brace Container Integration Test');
console.log('===================================\n');

let passed = 0;
let total = 0;

// Set container tests
console.log('Set Containers:');
passed += test('{1, 2, 3};', 'Set', 'Numbers');
passed += test('{a, b, c};', 'Set', 'Identifiers');
passed += test('{x + 1, y * 2, z / 3};', 'Set', 'Expressions');
passed += test('{};', 'Set', 'Empty set');
total += 4;

// Map container tests
console.log('\nMap Containers:');
passed += test('{a := 4, b := 5};', 'Map', 'Simple assignments');
passed += test('{name := "John", age := 30};', 'Map', 'Mixed value types');
passed += test('{x := 5, y := x * 2, z := SIN(PI/4)};', 'Map', 'Expression values');
total += 3;

// PatternMatch container tests
console.log('\nPatternMatch Containers:');
passed += test('{(x) :=> x + 1};', 'PatternMatch', 'Single pattern');
passed += test('{(0) :=> "zero", (1) :=> "one"};', 'PatternMatch', 'Multiple patterns');
passed += test('{(n) :=> n^2, (m) :=> SIN(m)};', 'PatternMatch', 'Mathematical patterns');
total += 3;

// System container tests
console.log('\nSystem Containers:');
passed += test('{x :=: 3*x + 2; y :=: x};', 'System', 'Basic equations');
passed += test('{a :=: b + c; b :=: 2*a - 1; c :=: a/2};', 'System', 'Multiple equations');
passed += test('{x :>: 0; y :<: 10; z :=: x + y};', 'System', 'Mixed equation types');
total += 3;

// Error cases
console.log('\nError Cases:');
passed += testError('{a := 1, b, c := 3};', 'Map containers must contain only key-value pairs', 'Mixed map/set');
passed += testError('{(x) :=> x + 1, a := 2};', 'Cannot mix pattern matches', 'Mixed pattern/assignment');
passed += testError('{x :=: 3, a := 2};', 'System containers must contain only equations', 'Mixed equation/assignment');
passed += testError('{x :=: 3*x + 2, y :=: x};', 'System containers must contain only equations', 'System without semicolons');
total += 4;

console.log(`\n=== Test Results ===`);
console.log(`Passed: ${passed}/${total}`);
console.log(`Success Rate: ${Math.round((passed/total)*100)}%`);

if (passed === total) {
    console.log('\n🎉 All tests passed! Brace container implementation is working correctly.');
} else {
    console.log(`\n❌ ${total - passed} test(s) failed. Please review the implementation.`);
    process.exit(1);
}