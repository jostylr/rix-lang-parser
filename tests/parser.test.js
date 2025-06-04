import { tokenize } from '../src/tokenizer.js';
import { parse } from '../src/parser.js';

// Test system lookup function
function testSystemLookup(name) {
    const systemSymbols = {
        // Mathematical functions
        'SIN': { type: 'function', arity: 1 },
        'COS': { type: 'function', arity: 1 },
        'TAN': { type: 'function', arity: 1 },
        'LOG': { type: 'function', arity: 1 },
        'EXP': { type: 'function', arity: 1 },
        'SQRT': { type: 'function', arity: 1 },
        'ABS': { type: 'function', arity: 1 },
        'MAX': { type: 'function', arity: -1 },
        'MIN': { type: 'function', arity: -1 },
        
        // Constants
        'PI': { type: 'constant', value: Math.PI },
        'E': { type: 'constant', value: Math.E },
        'INFINITY': { type: 'constant', value: Infinity },
        'I': { type: 'constant', description: 'imaginary unit' },
        
        // Logical operators
        'AND': { type: 'operator', precedence: 40, associativity: 'left', operatorType: 'infix' },
        'OR': { type: 'operator', precedence: 30, associativity: 'left', operatorType: 'infix' },
        'NOT': { type: 'operator', precedence: 110, operatorType: 'prefix' },
        'XOR': { type: 'operator', precedence: 35, associativity: 'left', operatorType: 'infix' },
        
        // Set operations
        'IN': { type: 'operator', precedence: 60, associativity: 'left', operatorType: 'infix' },
        'UNION': { type: 'operator', precedence: 50, associativity: 'left', operatorType: 'infix' },
        'INTERSECT': { type: 'operator', precedence: 50, associativity: 'left', operatorType: 'infix' },
        
        // Control structures
        'IF': { type: 'control', structure: 'conditional' },
        'ELSE': { type: 'control', structure: 'conditional' },
        'FOR': { type: 'control', structure: 'loop' },
        'WHILE': { type: 'control', structure: 'loop' },
        
        // Special forms
        'SELF': { type: 'special', form: 'self-reference' },
        'PRIMARY': { type: 'special', form: 'primary-operation' },
        'UNIT': { type: 'function', purpose: 'unit-conversion' },
        'LOAD': { type: 'function', purpose: 'module-loading' },
        'HELP': { type: 'function', purpose: 'documentation' }
    };
    
    return systemSymbols[name] || { type: 'identifier' };
}

// Test helper functions
function parseCode(code) {
    const tokens = tokenize(code);
    return parse(tokens, testSystemLookup);
}

function expectAST(code, expectedStructure) {
    const ast = parseCode(code);
    const simplified = simplifyAST(ast);
    if (JSON.stringify(simplified) !== JSON.stringify(expectedStructure)) {
        console.error('AST mismatch for:', code);
        console.error('Expected:', JSON.stringify(expectedStructure, null, 2));
        console.error('Actual:', JSON.stringify(simplified, null, 2));
        throw new Error('AST structure mismatch');
    }
}

function simplifyAST(ast) {
    return JSON.parse(JSON.stringify(ast, (key, value) => {
        if (key === 'pos' || key === 'original') return undefined;
        return value;
    }));
}

function runTest(name, testFn) {
    try {
        testFn();
        console.log(`✓ ${name}`);
    } catch (error) {
        console.error(`✗ ${name}: ${error.message}`);
        throw error;
    }
}

// Test suite
console.log('Running RiX Parser Tests...\n');

// Basic arithmetic tests
runTest('Basic addition', () => {
    expectAST('2 + 3;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: '+',
            left: { type: 'Number', value: '2' },
            right: { type: 'Number', value: '3' }
        }
    }]);
});

runTest('Operator precedence: multiplication before addition', () => {
    expectAST('2 + 3 * 4;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: '+',
            left: { type: 'Number', value: '2' },
            right: {
                type: 'BinaryOperation',
                operator: '*',
                left: { type: 'Number', value: '3' },
                right: { type: 'Number', value: '4' }
            }
        }
    }]);
});

runTest('Operator precedence: exponentiation before multiplication', () => {
    expectAST('2 * 3 ^ 4;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: '*',
            left: { type: 'Number', value: '2' },
            right: {
                type: 'BinaryOperation',
                operator: '^',
                left: { type: 'Number', value: '3' },
                right: { type: 'Number', value: '4' }
            }
        }
    }]);
});

runTest('Right associativity of exponentiation', () => {
    expectAST('2 ^ 3 ^ 4;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: '^',
            left: { type: 'Number', value: '2' },
            right: {
                type: 'BinaryOperation',
                operator: '^',
                left: { type: 'Number', value: '3' },
                right: { type: 'Number', value: '4' }
            }
        }
    }]);
});

runTest('Left associativity of addition', () => {
    expectAST('1 + 2 + 3;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: '+',
            left: {
                type: 'BinaryOperation',
                operator: '+',
                left: { type: 'Number', value: '1' },
                right: { type: 'Number', value: '2' }
            },
            right: { type: 'Number', value: '3' }
        }
    }]);
});

// Assignment tests
runTest('Simple assignment', () => {
    expectAST('x := 5;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: ':=',
            left: { type: 'UserIdentifier', name: 'x' },
            right: { type: 'Number', value: '5' }
        }
    }]);
});

runTest('Assignment with expression', () => {
    expectAST('result := a + b * c;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: ':=',
            left: { type: 'UserIdentifier', name: 'result' },
            right: {
                type: 'BinaryOperation',
                operator: '+',
                left: { type: 'UserIdentifier', name: 'a' },
                right: {
                    type: 'BinaryOperation',
                    operator: '*',
                    left: { type: 'UserIdentifier', name: 'b' },
                    right: { type: 'UserIdentifier', name: 'c' }
                }
            }
        }
    }]);
});

// Function call tests
runTest('Simple function call', () => {
    expectAST('f(x);', [{
        type: 'Statement',
        expression: {
            type: 'FunctionCall',
            function: { type: 'UserIdentifier', name: 'f' },
            arguments: [{ type: 'UserIdentifier', name: 'x' }]
        }
    }]);
});

runTest('Function call with multiple arguments', () => {
    expectAST('MAX(a, b, c);', [{
        type: 'Statement',
        expression: {
            type: 'FunctionCall',
            function: { 
                type: 'SystemIdentifier', 
                name: 'MAX',
                systemInfo: { type: 'function', arity: -1 }
            },
            arguments: [
                { type: 'UserIdentifier', name: 'a' },
                { type: 'UserIdentifier', name: 'b' },
                { type: 'UserIdentifier', name: 'c' }
            ]
        }
    }]);
});

runTest('Nested function calls', () => {
    expectAST('SIN(COS(x));', [{
        type: 'Statement',
        expression: {
            type: 'FunctionCall',
            function: {
                type: 'SystemIdentifier',
                name: 'SIN',
                systemInfo: { type: 'function', arity: 1 }
            },
            arguments: [{
                type: 'FunctionCall',
                function: {
                    type: 'SystemIdentifier',
                    name: 'COS',
                    systemInfo: { type: 'function', arity: 1 }
                },
                arguments: [{ type: 'UserIdentifier', name: 'x' }]
            }]
        }
    }]);
});

// Unary operator tests
runTest('Unary minus', () => {
    expectAST('-x;', [{
        type: 'Statement',
        expression: {
            type: 'UnaryOperation',
            operator: '-',
            operand: { type: 'UserIdentifier', name: 'x' }
        }
    }]);
});

runTest('Unary plus', () => {
    expectAST('+42;', [{
        type: 'Statement',
        expression: {
            type: 'UnaryOperation',
            operator: '+',
            operand: { type: 'Number', value: '42' }
        }
    }]);
});

runTest('Double unary', () => {
    expectAST('--x;', [{
        type: 'Statement',
        expression: {
            type: 'UnaryOperation',
            operator: '-',
            operand: {
                type: 'UnaryOperation',
                operator: '-',
                operand: { type: 'UserIdentifier', name: 'x' }
            }
        }
    }]);
});

// Grouping tests
runTest('Parentheses override precedence', () => {
    expectAST('(2 + 3) * 4;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: '*',
            left: {
                type: 'Grouping',
                expression: {
                    type: 'BinaryOperation',
                    operator: '+',
                    left: { type: 'Number', value: '2' },
                    right: { type: 'Number', value: '3' }
                }
            },
            right: { type: 'Number', value: '4' }
        }
    }]);
});

runTest('Nested parentheses', () => {
    expectAST('((a + b) * c);', [{
        type: 'Statement',
        expression: {
            type: 'Grouping',
            expression: {
                type: 'BinaryOperation',
                operator: '*',
                left: {
                    type: 'Grouping',
                    expression: {
                        type: 'BinaryOperation',
                        operator: '+',
                        left: { type: 'UserIdentifier', name: 'a' },
                        right: { type: 'UserIdentifier', name: 'b' }
                    }
                },
                right: { type: 'UserIdentifier', name: 'c' }
            }
        }
    }]);
});

// Array tests
runTest('Empty array', () => {
    expectAST('[];', [{
        type: 'Statement',
        expression: {
            type: 'Array',
            elements: []
        }
    }]);
});

runTest('Array with elements', () => {
    expectAST('[1, 2, 3];', [{
        type: 'Statement',
        expression: {
            type: 'Array',
            elements: [
                { type: 'Number', value: '1' },
                { type: 'Number', value: '2' },
                { type: 'Number', value: '3' }
            ]
        }
    }]);
});

runTest('Array with expressions', () => {
    expectAST('[a + b, c * d];', [{
        type: 'Statement',
        expression: {
            type: 'Array',
            elements: [
                {
                    type: 'BinaryOperation',
                    operator: '+',
                    left: { type: 'UserIdentifier', name: 'a' },
                    right: { type: 'UserIdentifier', name: 'b' }
                },
                {
                    type: 'BinaryOperation',
                    operator: '*',
                    left: { type: 'UserIdentifier', name: 'c' },
                    right: { type: 'UserIdentifier', name: 'd' }
                }
            ]
        }
    }]);
});

// Set tests
runTest('Empty set', () => {
    expectAST('{};', [{
        type: 'Statement',
        expression: {
            type: 'Set',
            elements: []
        }
    }]);
});

runTest('Set with elements', () => {
    expectAST('{a, b, c};', [{
        type: 'Statement',
        expression: {
            type: 'Set',
            elements: [
                { type: 'UserIdentifier', name: 'a' },
                { type: 'UserIdentifier', name: 'b' },
                { type: 'UserIdentifier', name: 'c' }
            ]
        }
    }]);
});

// Pipe operator tests
runTest('Simple pipe', () => {
    expectAST('x |> f;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: '|>',
            left: { type: 'UserIdentifier', name: 'x' },
            right: { type: 'UserIdentifier', name: 'f' }
        }
    }]);
});

runTest('Chained pipes', () => {
    expectAST('x |> f |> g |> h;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: '|>',
            left: {
                type: 'BinaryOperation',
                operator: '|>',
                left: {
                    type: 'BinaryOperation',
                    operator: '|>',
                    left: { type: 'UserIdentifier', name: 'x' },
                    right: { type: 'UserIdentifier', name: 'f' }
                },
                right: { type: 'UserIdentifier', name: 'g' }
            },
            right: { type: 'UserIdentifier', name: 'h' }
        }
    }]);
});

runTest('Different pipe operators', () => {
    expectAST('data ||> filter |>> map |>: reduce;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: '|>:',
            left: {
                type: 'BinaryOperation',
                operator: '|>>',
                left: {
                    type: 'BinaryOperation',
                    operator: '||>',
                    left: { type: 'UserIdentifier', name: 'data' },
                    right: { type: 'UserIdentifier', name: 'filter' }
                },
                right: { type: 'UserIdentifier', name: 'map' }
            },
            right: { type: 'UserIdentifier', name: 'reduce' }
        }
    }]);
});

// Equation solving tests
runTest('Simple equation', () => {
    expectAST('x :=: 5;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: ':=:',
            left: { type: 'UserIdentifier', name: 'x' },
            right: { type: 'Number', value: '5' }
        }
    }]);
});

runTest('Complex equation', () => {
    expectAST('x^2 + 2*x - 3 :=: 0;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: ':=:',
            left: {
                type: 'BinaryOperation',
                operator: '-',
                left: {
                    type: 'BinaryOperation',
                    operator: '+',
                    left: {
                        type: 'BinaryOperation',
                        operator: '^',
                        left: { type: 'UserIdentifier', name: 'x' },
                        right: { type: 'Number', value: '2' }
                    },
                    right: {
                        type: 'BinaryOperation',
                        operator: '*',
                        left: { type: 'Number', value: '2' },
                        right: { type: 'UserIdentifier', name: 'x' }
                    }
                },
                right: { type: 'Number', value: '3' }
            },
            right: { type: 'Number', value: '0' }
        }
    }]);
});

// Inequality tests
runTest('Greater than inequality', () => {
    expectAST('x :>: 5;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: ':>:',
            left: { type: 'UserIdentifier', name: 'x' },
            right: { type: 'Number', value: '5' }
        }
    }]);
});

runTest('Less than or equal inequality', () => {
    expectAST('2*x + 1 :<=: 10;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: ':<=:',
            left: {
                type: 'BinaryOperation',
                operator: '+',
                left: {
                    type: 'BinaryOperation',
                    operator: '*',
                    left: { type: 'Number', value: '2' },
                    right: { type: 'UserIdentifier', name: 'x' }
                },
                right: { type: 'Number', value: '1' }
            },
            right: { type: 'Number', value: '10' }
        }
    }]);
});

// System identifier tests
runTest('System constant', () => {
    expectAST('PI;', [{
        type: 'Statement',
        expression: {
            type: 'SystemIdentifier',
            name: 'PI',
            systemInfo: { type: 'constant', value: Math.PI }
        }
    }]);
});

runTest('System function with constant', () => {
    expectAST('SIN(PI);', [{
        type: 'Statement',
        expression: {
            type: 'FunctionCall',
            function: {
                type: 'SystemIdentifier',
                name: 'SIN',
                systemInfo: { type: 'function', arity: 1 }
            },
            arguments: [{
                type: 'SystemIdentifier',
                name: 'PI',
                systemInfo: { type: 'constant', value: Math.PI }
            }]
        }
    }]);
});

runTest('System logical operator', () => {
    expectAST('a AND b;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: 'AND',
            left: { type: 'UserIdentifier', name: 'a' },
            right: { type: 'UserIdentifier', name: 'b' }
        }
    }]);
});

// Number preservation tests
runTest('Integer numbers', () => {
    expectAST('42;', [{
        type: 'Statement',
        expression: { type: 'Number', value: '42' }
    }]);
});

runTest('Decimal numbers', () => {
    expectAST('3.14159;', [{
        type: 'Statement',
        expression: { type: 'Number', value: '3.14159' }
    }]);
});

runTest('Rational numbers', () => {
    expectAST('22/7;', [{
        type: 'Statement',
        expression: { type: 'Number', value: '22/7' }
    }]);
});

runTest('Mixed numbers', () => {
    expectAST('1..3/4;', [{
        type: 'Statement',
        expression: { type: 'Number', value: '1..3/4' }
    }]);
});

runTest('Numbers with units', () => {
    expectAST('3.5~m~;', [{
        type: 'Statement',
        expression: { type: 'Number', value: '3.5~m~' }
    }]);
});

runTest('Interval numbers', () => {
    expectAST('1:10;', [{
        type: 'Statement',
        expression: { type: 'Number', value: '1:10' }
    }]);
});

// String preservation tests
runTest('Quoted strings', () => {
    expectAST('"hello world";', [{
        type: 'Statement',
        expression: { 
            type: 'String', 
            value: 'hello world',
            kind: 'quote'
        }
    }]);
});

runTest('Backtick strings', () => {
    expectAST('`code snippet`;', [{
        type: 'Statement',
        expression: { 
            type: 'String', 
            value: 'code snippet',
            kind: 'backtick'
        }
    }]);
});

runTest('Comment strings', () => {
    expectAST('# this is a comment;', [{
        type: 'String', 
        value: ' this is a comment;',
        kind: 'comment'
    }]);
});

// Multiple statement tests
runTest('Multiple statements', () => {
    expectAST('x := 5; y := 10; result := x + y;', [
        {
            type: 'Statement',
            expression: {
                type: 'BinaryOperation',
                operator: ':=',
                left: { type: 'UserIdentifier', name: 'x' },
                right: { type: 'Number', value: '5' }
            }
        },
        {
            type: 'Statement',
            expression: {
                type: 'BinaryOperation',
                operator: ':=',
                left: { type: 'UserIdentifier', name: 'y' },
                right: { type: 'Number', value: '10' }
            }
        },
        {
            type: 'Statement',
            expression: {
                type: 'BinaryOperation',
                operator: ':=',
                left: { type: 'UserIdentifier', name: 'result' },
                right: {
                    type: 'BinaryOperation',
                    operator: '+',
                    left: { type: 'UserIdentifier', name: 'x' },
                    right: { type: 'UserIdentifier', name: 'y' }
                }
            }
        }
    ]);
});

// Property access tests
runTest('Simple property access', () => {
    expectAST('obj.prop;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: '.',
            left: { type: 'UserIdentifier', name: 'obj' },
            right: { type: 'UserIdentifier', name: 'prop' }
        }
    }]);
});

runTest('Chained property access', () => {
    expectAST('obj.prop.subprop;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: '.',
            left: {
                type: 'BinaryOperation',
                operator: '.',
                left: { type: 'UserIdentifier', name: 'obj' },
                right: { type: 'UserIdentifier', name: 'prop' }
            },
            right: { type: 'UserIdentifier', name: 'subprop' }
        }
    }]);
});

// Function definition tests
runTest('Simple function definition', () => {
    expectAST('f := x -> x + 1;', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: ':=',
            left: { type: 'UserIdentifier', name: 'f' },
            right: {
                type: 'BinaryOperation',
                operator: '->',
                left: { type: 'UserIdentifier', name: 'x' },
                right: {
                    type: 'BinaryOperation',
                    operator: '+',
                    left: { type: 'UserIdentifier', name: 'x' },
                    right: { type: 'Number', value: '1' }
                }
            }
        }
    }]);
});

// Error handling tests
runTest('Error: Unmatched opening parenthesis', () => {
    try {
        parseCode('(2 + 3;');
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('Expected closing parenthesis')) {
            throw new Error(`Wrong error message: ${error.message}`);
        }
    }
});

runTest('Error: Unmatched opening bracket', () => {
    try {
        parseCode('[1, 2, 3;');
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('Expected closing bracket')) {
            throw new Error(`Wrong error message: ${error.message}`);
        }
    }
});

runTest('Error: Unmatched opening brace', () => {
    try {
        parseCode('{a, b, c;');
        throw new Error('Should have thrown error');
    } catch (error) {
        if (!error.message.includes('Expected closing brace')) {
            throw new Error(`Wrong error message: ${error.message}`);
        }
    }
});

// Complex expression tests
runTest('Complex mathematical expression', () => {
    expectAST('SIN(PI/2) + COS(0) * TAN(PI/4);', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: '+',
            left: {
                type: 'FunctionCall',
                function: {
                    type: 'SystemIdentifier',
                    name: 'SIN',
                    systemInfo: { type: 'function', arity: 1 }
                },
                arguments: [{
                    type: 'BinaryOperation',
                    operator: '/',
                    left: {
                        type: 'SystemIdentifier',
                        name: 'PI',
                        systemInfo: { type: 'constant', value: Math.PI }
                    },
                    right: { type: 'Number', value: '2' }
                }]
            },
            right: {
                type: 'BinaryOperation',
                operator: '*',
                left: {
                    type: 'FunctionCall',
                    function: {
                        type: 'SystemIdentifier',
                        name: 'COS',
                        systemInfo: { type: 'function', arity: 1 }
                    },
                    arguments: [{ type: 'Number', value: '0' }]
                },
                right: {
                    type: 'FunctionCall',
                    function: {
                        type: 'SystemIdentifier',
                        name: 'TAN',
                        systemInfo: { type: 'function', arity: 1 }
                    },
                    arguments: [{
                        type: 'BinaryOperation',
                        operator: '/',
                        left: {
                            type: 'SystemIdentifier',
                            name: 'PI',
                            systemInfo: { type: 'constant', value: Math.PI }
                        },
                        right: { type: 'Number', value: '4' }
                    }]
                }
            }
        }
    }]);
});

runTest('Mixed operations with collections', () => {
    expectAST('[1, 2, 3] UNION {4, 5, 6};', [{
        type: 'Statement',
        expression: {
            type: 'BinaryOperation',
            operator: 'UNION',
            left: {
                type: 'Array',
                elements: [
                    { type: 'Number', value: '1' },
                    { type: 'Number', value: '2' },
                    { type: 'Number', value: '3' }
                ]
            },
            right: {
                type: 'Set',
                elements: [
                    { type: 'Number', value: '4' },
                    { type: 'Number', value: '5' },
                    { type: 'Number', value: '6' }
                ]
            }
        }
    }]);
});

console.log('\n✓ All parser tests passed successfully!');