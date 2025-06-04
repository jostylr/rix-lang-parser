import { tokenize } from "../src/tokenizer.js";
import { parse } from "../src/parser.js";

// Test system lookup function
function testSystemLookup(name) {
    const systemSymbols = {
        'SIN': { type: 'function', arity: 1 },
        'COS': { type: 'function', arity: 1 },
        'TAN': { type: 'function', arity: 1 },
        'LOG': { type: 'function', arity: 1 },
        'MAX': { type: 'function', arity: -1 },
        'MIN': { type: 'function', arity: -1 },
        'PI': { type: 'constant', value: Math.PI },
        'E': { type: 'constant', value: Math.E },
        'AND': { type: 'operator', precedence: 40, associativity: 'left', operatorType: 'infix' },
        'OR': { type: 'operator', precedence: 30, associativity: 'left', operatorType: 'infix' },
        'NOT': { type: 'operator', precedence: 110, operatorType: 'prefix' },
        'IN': { type: 'operator', precedence: 60, associativity: 'left', operatorType: 'infix' },
        'UNION': { type: 'operator', precedence: 50, associativity: 'left', operatorType: 'infix' }
    };
    return systemSymbols[name] || { type: 'identifier' };
}

function parseCode(code) {
    const tokens = tokenize(code);
    return parse(tokens, testSystemLookup);
}

function stripMetadata(obj) {
    if (Array.isArray(obj)) {
        return obj.map(stripMetadata);
    }
    if (obj && typeof obj === 'object') {
        const { pos, original, ...rest } = obj;
        const result = {};
        for (const [key, value] of Object.entries(rest)) {
            result[key] = stripMetadata(value);
        }
        return result;
    }
    return obj;
}

describe("RiX Parser", () => {
    describe("Basic arithmetic", () => {
        test("simple addition", () => {
            const ast = parseCode('2 + 3;');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'BinaryOperation',
                    operator: '+',
                    left: { type: 'Number', value: '2' },
                    right: { type: 'Number', value: '3' }
                }
            }]);
        });

        test("operator precedence", () => {
            const ast = parseCode('2 + 3 * 4;');
            expect(stripMetadata(ast)).toEqual([{
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

        test("right associativity of exponentiation", () => {
            const ast = parseCode('2 ^ 3 ^ 4;');
            expect(stripMetadata(ast)).toEqual([{
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
    });

    describe("Assignment operations", () => {
        test("simple assignment", () => {
            const ast = parseCode('x := 5;');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'BinaryOperation',
                    operator: ':=',
                    left: { type: 'UserIdentifier', name: 'x' },
                    right: { type: 'Number', value: '5' }
                }
            }]);
        });

        test("equation solving", () => {
            const ast = parseCode('x :=: 5;');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'BinaryOperation',
                    operator: ':=:',
                    left: { type: 'UserIdentifier', name: 'x' },
                    right: { type: 'Number', value: '5' }
                }
            }]);
        });
    });

    describe("Function calls", () => {
        test("simple function call", () => {
            const ast = parseCode('f(x);');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'FunctionCall',
                    function: { type: 'UserIdentifier', name: 'f' },
                    arguments: [{ type: 'UserIdentifier', name: 'x' }]
                }
            }]);
        });

        test("system function call", () => {
            const ast = parseCode('SIN(PI);');
            expect(stripMetadata(ast)).toEqual([{
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
    });

    describe("Unary operators", () => {
        test("unary minus", () => {
            const ast = parseCode('-x;');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'UnaryOperation',
                    operator: '-',
                    operand: { type: 'UserIdentifier', name: 'x' }
                }
            }]);
        });

        test("unary plus", () => {
            const ast = parseCode('+42;');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'UnaryOperation',
                    operator: '+',
                    operand: { type: 'Number', value: '42' }
                }
            }]);
        });
    });

    describe("Collections", () => {
        test("array with elements", () => {
            const ast = parseCode('[1, 2, 3];');
            expect(stripMetadata(ast)).toEqual([{
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

        test("set with elements", () => {
            const ast = parseCode('{a, b, c};');
            expect(stripMetadata(ast)).toEqual([{
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
    });

    describe("Pipe operations", () => {
        test("simple pipe", () => {
            const ast = parseCode('x |> f;');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'BinaryOperation',
                    operator: '|>',
                    left: { type: 'UserIdentifier', name: 'x' },
                    right: { type: 'UserIdentifier', name: 'f' }
                }
            }]);
        });

        test("chained pipes", () => {
            const ast = parseCode('x |> f |> g;');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'BinaryOperation',
                    operator: '|>',
                    left: {
                        type: 'BinaryOperation',
                        operator: '|>',
                        left: { type: 'UserIdentifier', name: 'x' },
                        right: { type: 'UserIdentifier', name: 'f' }
                    },
                    right: { type: 'UserIdentifier', name: 'g' }
                }
            }]);
        });
    });

    describe("Grouping", () => {
        test("parentheses override precedence", () => {
            const ast = parseCode('(2 + 3) * 4;');
            expect(stripMetadata(ast)).toEqual([{
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
    });

    describe("Number and string preservation", () => {
        test("preserves number formats", () => {
            const ast = parseCode('3.14;');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: { type: 'Number', value: '3.14' }
            }]);
        });

        test("preserves string types", () => {
            const ast = parseCode('"hello";');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: { 
                    type: 'String', 
                    value: 'hello',
                    kind: 'quote'
                }
            }]);
        });
    });

    describe("Multiple statements", () => {
        test("multiple statements with semicolons", () => {
            const ast = parseCode('x := 5; y := 10;');
            expect(stripMetadata(ast)).toEqual([
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
                }
            ]);
        });
    });

    describe("Error handling", () => {
        test("unmatched parenthesis throws error", () => {
            expect(() => parseCode('(2 + 3;')).toThrow(/Expected closing parenthesis/);
        });

        test("unmatched bracket throws error", () => {
            expect(() => parseCode('[1, 2;')).toThrow(/Expected closing bracket/);
        });

        test("unmatched brace throws error", () => {
            expect(() => parseCode('{a, b;')).toThrow(/Expected closing brace/);
        });
    });

    describe("Position information", () => {
        test("all nodes have position information", () => {
            const ast = parseCode('x + y;');
            
            function checkPositions(node) {
                expect(node).toHaveProperty('pos');
                expect(Array.isArray(node.pos)).toBe(true);
                expect(node.pos).toHaveLength(3);
                expect(node).toHaveProperty('original');
                
                // Check child nodes
                Object.values(node).forEach(value => {
                    if (Array.isArray(value)) {
                        value.forEach(item => {
                            if (item && typeof item === 'object' && item.type) {
                                checkPositions(item);
                            }
                        });
                    } else if (value && typeof value === 'object' && value.type) {
                        checkPositions(value);
                    }
                });
            }
            
            ast.forEach(checkPositions);
        });
    });
});