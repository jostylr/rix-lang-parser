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
    describe("Function definitions", () => {
        test("standard function definition with :->", () => {
            const ast = parseCode('f(x) :-> x + 1;');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'FunctionDefinition',
                    name: { type: 'UserIdentifier', name: 'f' },
                    parameters: {
                        positional: [{ name: 'x', defaultValue: null, condition: null, isKeywordOnly: false }],
                        keyword: [],
                        metadata: {}
                    },
                    body: {
                        type: 'BinaryOperation',
                        operator: '+',
                        left: { type: 'UserIdentifier', name: 'x' },
                        right: { type: 'Number', value: '1' }
                    },
                    type: 'standard'
                }
            }]);
        });

        test("function definition with default parameters", () => {
            const ast = parseCode('f(x, n := 5) :-> x^n;');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'FunctionDefinition',
                    name: { type: 'UserIdentifier', name: 'f' },
                    parameters: {
                        positional: [
                            { name: 'x', defaultValue: null, condition: null, isKeywordOnly: false },
                            { name: 'n', defaultValue: { type: 'Number', value: '5' }, condition: null, isKeywordOnly: false }
                        ],
                        keyword: [],
                        metadata: {}
                    },
                    body: {
                        type: 'BinaryOperation',
                        operator: '^',
                        left: { type: 'UserIdentifier', name: 'x' },
                        right: { type: 'UserIdentifier', name: 'n' }
                    },
                    type: 'standard'
                }
            }]);
        });

        test("function definition with keyword-only parameters", () => {
            const ast = parseCode('f(x, n := 5; a := 0) :-> (x-a)^n + 1;');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'FunctionDefinition',
                    name: { type: 'UserIdentifier', name: 'f' },
                    parameters: {
                        positional: [
                            { name: 'x', defaultValue: null, condition: null, isKeywordOnly: false },
                            { name: 'n', defaultValue: { type: 'Number', value: '5' }, condition: null, isKeywordOnly: false }
                        ],
                        keyword: [
                            { name: 'a', defaultValue: { type: 'Number', value: '0' }, condition: null, isKeywordOnly: true }
                        ],
                        metadata: {}
                    },
                    body: {
                        type: 'BinaryOperation',
                        operator: '+',
                        left: {
                            type: 'BinaryOperation',
                            operator: '^',
                            left: {
                                type: 'Grouping',
                                expression: {
                                    type: 'BinaryOperation',
                                    operator: '-',
                                    left: { type: 'UserIdentifier', name: 'x' },
                                    right: { type: 'UserIdentifier', name: 'a' }
                                }
                            },
                            right: { type: 'UserIdentifier', name: 'n' }
                        },
                        right: { type: 'Number', value: '1' }
                    },
                    type: 'standard'
                }
            }]);
        });

        test("function definition with condition", () => {
            const ast = parseCode('h(x, y; n := 2 ? x^2 + y^2 = 1) :-> COS(x; n) * SIN(y; n);');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'FunctionDefinition',
                    name: { type: 'UserIdentifier', name: 'h' },
                    parameters: {
                        positional: [
                            { name: 'x', defaultValue: null, condition: null, isKeywordOnly: false },
                            { name: 'y', defaultValue: null, condition: null, isKeywordOnly: false }
                        ],
                        keyword: [
                            { 
                                name: 'n', 
                                defaultValue: { type: 'Number', value: '2' }, 
                                condition: {
                                    type: 'BinaryOperation',
                                    operator: '=',
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
                                            operator: '^',
                                            left: { type: 'UserIdentifier', name: 'y' },
                                            right: { type: 'Number', value: '2' }
                                        }
                                    },
                                    right: { type: 'Number', value: '1' }
                                },
                                isKeywordOnly: true 
                            }
                        ],
                        metadata: {}
                    },
                    body: {
                        type: 'BinaryOperation',
                        operator: '*',
                        left: {
                            type: 'FunctionCall',
                            function: { 
                                type: 'SystemIdentifier', 
                                name: 'COS',
                                systemInfo: { type: 'function', arity: 1 }
                            },
                            arguments: {
                                positional: [{ type: 'UserIdentifier', name: 'x' }],
                                keyword: { n: { type: 'UserIdentifier', name: 'n' } }
                            }
                        },
                        right: {
                            type: 'FunctionCall',
                            function: { 
                                type: 'SystemIdentifier', 
                                name: 'SIN',
                                systemInfo: { type: 'function', arity: 1 }
                            },
                            arguments: {
                                positional: [{ type: 'UserIdentifier', name: 'y' }],
                                keyword: { n: { type: 'UserIdentifier', name: 'n' } }
                            }
                        }
                    },
                    type: 'standard'
                }
            }]);
        });

        test("pattern matching function with array syntax", () => {
            const ast = parseCode('g :=> [ (x ? x < 0) -> -x, (x) -> x ];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'PatternMatchingFunction',
                    name: { type: 'UserIdentifier', name: 'g' },
                    parameters: {
                        positional: [],
                        keyword: [],
                        metadata: {}
                    },
                    patterns: [
                        {
                            type: 'BinaryOperation',
                            operator: '->',
                            left: {
                                type: 'Grouping',
                                expression: {
                                    type: 'BinaryOperation',
                                    operator: '?',
                                    left: { type: 'UserIdentifier', name: 'x' },
                                    right: {
                                        type: 'BinaryOperation',
                                        operator: '<',
                                        left: { type: 'UserIdentifier', name: 'x' },
                                        right: { type: 'Number', value: '0' }
                                    }
                                }
                            },
                            right: {
                                type: 'UnaryOperation',
                                operator: '-',
                                operand: { type: 'UserIdentifier', name: 'x' }
                            }
                        },
                        {
                            type: 'BinaryOperation',
                            operator: '->',
                            left: {
                                type: 'Grouping',
                                expression: { type: 'UserIdentifier', name: 'x' }
                            },
                            right: { type: 'UserIdentifier', name: 'x' }
                        }
                    ],
                    metadata: {}
                }
            }]);
        });

        test("pattern matching function with metadata", () => {
            const ast = parseCode('g :=> [ [(x ? x < 0) -> -x+n, (x) -> x-n] , n := 4];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'PatternMatchingFunction',
                    name: { type: 'UserIdentifier', name: 'g' },
                    parameters: {
                        positional: [],
                        keyword: [],
                        metadata: {}
                    },
                    patterns: [
                        {
                            type: 'BinaryOperation',
                            operator: '->',
                            left: {
                                type: 'Grouping',
                                expression: {
                                    type: 'BinaryOperation',
                                    operator: '?',
                                    left: { type: 'UserIdentifier', name: 'x' },
                                    right: {
                                        type: 'BinaryOperation',
                                        operator: '<',
                                        left: { type: 'UserIdentifier', name: 'x' },
                                        right: { type: 'Number', value: '0' }
                                    }
                                }
                            },
                            right: {
                                type: 'BinaryOperation',
                                operator: '+',
                                left: {
                                    type: 'UnaryOperation',
                                    operator: '-',
                                    operand: { type: 'UserIdentifier', name: 'x' }
                                },
                                right: { type: 'UserIdentifier', name: 'n' }
                            }
                        },
                        {
                            type: 'BinaryOperation',
                            operator: '->',
                            left: {
                                type: 'Grouping',
                                expression: { type: 'UserIdentifier', name: 'x' }
                            },
                            right: {
                                type: 'BinaryOperation',
                                operator: '-',
                                left: { type: 'UserIdentifier', name: 'x' },
                                right: { type: 'UserIdentifier', name: 'n' }
                            }
                        }
                    ],
                    metadata: {
                        n: { type: 'Number', value: '4' }
                    }
                }
            }]);
        });

        test("function call with semicolon separator", () => {
            const ast = parseCode('f(2, 3; a := 4);');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'FunctionCall',
                    function: { type: 'UserIdentifier', name: 'f' },
                    arguments: {
                        positional: [
                            { type: 'Number', value: '2' },
                            { type: 'Number', value: '3' }
                        ],
                        keyword: {
                            a: { type: 'Number', value: '4' }
                        }
                    }
                }
            }]);
        });

        test("function call with shorthand keyword argument", () => {
            const ast = parseCode('f(2; n);');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'FunctionCall',
                    function: { type: 'UserIdentifier', name: 'f' },
                    arguments: {
                        positional: [{ type: 'Number', value: '2' }],
                        keyword: {
                            n: { type: 'UserIdentifier', name: 'n' }
                        }
                    }
                }
            }]);
        });

        test("simple assignment-style function definition", () => {
            const ast = parseCode('f := (x, n := 5; a := 0) -> (x-a)^n + 1;');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'BinaryOperation',
                    operator: ':=',
                    left: { type: 'UserIdentifier', name: 'f' },
                    right: {
                        type: 'FunctionLambda',
                        parameters: {
                            positional: [
                                { name: 'x', defaultValue: null, condition: null, isKeywordOnly: false },
                                { name: 'n', defaultValue: { type: 'Number', value: '5' }, condition: null, isKeywordOnly: false }
                            ],
                            keyword: [
                                { name: 'a', defaultValue: { type: 'Number', value: '0' }, condition: null, isKeywordOnly: true }
                            ],
                            metadata: {}
                        },
                        body: {
                            type: 'BinaryOperation',
                            operator: '+',
                            left: {
                                type: 'BinaryOperation',
                                operator: '^',
                                left: {
                                    type: 'Grouping',
                                    expression: {
                                        type: 'BinaryOperation',
                                        operator: '-',
                                        left: { type: 'UserIdentifier', name: 'x' },
                                        right: { type: 'UserIdentifier', name: 'a' }
                                    }
                                },
                                right: { type: 'UserIdentifier', name: 'n' }
                            },
                            right: { type: 'Number', value: '1' }
                        }
                    }
                }
            }]);
        });
    });

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
                    arguments: {
                        positional: [{ type: 'UserIdentifier', name: 'x' }],
                        keyword: {}
                    }
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
                    arguments: {
                        positional: [
                            { 
                                type: 'SystemIdentifier', 
                                name: 'PI',
                                systemInfo: { type: 'constant', value: Math.PI }
                            }
                        ],
                        keyword: {}
                    }
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

        test("set with literal values", () => {
            const ast = parseCode('{3, 5, 6};');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'Set',
                    elements: [
                        { type: 'Number', value: '3' },
                        { type: 'Number', value: '5' },
                        { type: 'Number', value: '6' }
                    ]
                }
            }]);
        });

        test("map with key-value pairs", () => {
            const ast = parseCode('{a := 4, b := 5};');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'Map',
                    elements: [
                        {
                            type: 'BinaryOperation',
                            operator: ':=',
                            left: { type: 'UserIdentifier', name: 'a' },
                            right: { type: 'Number', value: '4' }
                        },
                        {
                            type: 'BinaryOperation',
                            operator: ':=',
                            left: { type: 'UserIdentifier', name: 'b' },
                            right: { type: 'Number', value: '5' }
                        }
                    ]
                }
            }]);
        });

        test("pattern match with patterns", () => {
            const ast = parseCode('{(x) :=> x + 1, (y) :=> y * 2};');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'Set',
                    elements: [
                        {
                            type: 'PatternMatchingFunction',
                            name: {
                                type: 'Grouping',
                                expression: { type: 'UserIdentifier', name: 'x' }
                            },
                            parameters: {
                                positional: [],
                                keyword: [],
                                metadata: {}
                            },
                            patterns: [
                                {
                                    type: 'BinaryOperation',
                                    operator: '+',
                                    left: { type: 'UserIdentifier', name: 'x' },
                                    right: { type: 'Number', value: '1' }
                                }
                            ],
                            metadata: {}
                        },
                        {
                            type: 'PatternMatchingFunction',
                            name: {
                                type: 'Grouping',
                                expression: { type: 'UserIdentifier', name: 'y' }
                            },
                            parameters: {
                                positional: [],
                                keyword: [],
                                metadata: {}
                            },
                            patterns: [
                                {
                                    type: 'BinaryOperation',
                                    operator: '*',
                                    left: { type: 'UserIdentifier', name: 'y' },
                                    right: { type: 'Number', value: '2' }
                                }
                            ],
                            metadata: {}
                        }
                    ]
                }
            }]);
        });

        test("system with equations", () => {
            const ast = parseCode('{x :=: 3*x + 2; y :=: x};');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'System',
                    elements: [
                        {
                            type: 'BinaryOperation',
                            operator: ':=:',
                            left: { type: 'UserIdentifier', name: 'x' },
                            right: {
                                type: 'BinaryOperation',
                                operator: '+',
                                left: {
                                    type: 'BinaryOperation',
                                    operator: '*',
                                    left: { type: 'Number', value: '3' },
                                    right: { type: 'UserIdentifier', name: 'x' }
                                },
                                right: { type: 'Number', value: '2' }
                            }
                        },
                        {
                            type: 'BinaryOperation',
                            operator: ':=:',
                            left: { type: 'UserIdentifier', name: 'y' },
                            right: { type: 'UserIdentifier', name: 'x' }
                        }
                    ]
                }
            }]);
        });

        test("empty set", () => {
            const ast = parseCode('{};');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'Set',
                    elements: []
                }
            }]);
        });

        test("2x2 matrix with semicolon separator", () => {
            const ast = parseCode('[1, 2; 3, 4];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'Matrix',
                    rows: [
                        [
                            { type: 'Number', value: '1' },
                            { type: 'Number', value: '2' }
                        ],
                        [
                            { type: 'Number', value: '3' },
                            { type: 'Number', value: '4' }
                        ]
                    ]
                }
            }]);
        });

        test("3x2 matrix with multiple rows", () => {
            const ast = parseCode('[1, 2; 3, 4; 5, 6];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'Matrix',
                    rows: [
                        [
                            { type: 'Number', value: '1' },
                            { type: 'Number', value: '2' }
                        ],
                        [
                            { type: 'Number', value: '3' },
                            { type: 'Number', value: '4' }
                        ],
                        [
                            { type: 'Number', value: '5' },
                            { type: 'Number', value: '6' }
                        ]
                    ]
                }
            }]);
        });

        test("3D tensor with double semicolon separator", () => {
            const ast = parseCode('[1, 2; 3, 4 ;; 5, 6; 7, 8];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'Tensor',
                    structure: [
                        {
                            row: [
                                { type: 'Number', value: '1' },
                                { type: 'Number', value: '2' }
                            ],
                            separatorLevel: 1
                        },
                        {
                            row: [
                                { type: 'Number', value: '3' },
                                { type: 'Number', value: '4' }
                            ],
                            separatorLevel: 2
                        },
                        {
                            row: [
                                { type: 'Number', value: '5' },
                                { type: 'Number', value: '6' }
                            ],
                            separatorLevel: 1
                        },
                        {
                            row: [
                                { type: 'Number', value: '7' },
                                { type: 'Number', value: '8' }
                            ],
                            separatorLevel: 0
                        }
                    ],
                    maxDimension: 3
                }
            }]);
        });

        test("single row matrix", () => {
            const ast = parseCode('[1, 2, 3; ];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'Matrix',
                    rows: [
                        [
                            { type: 'Number', value: '1' },
                            { type: 'Number', value: '2' },
                            { type: 'Number', value: '3' }
                        ],
                        []
                    ]
                }
            }]);
        });

        test("matrix with variables", () => {
            const ast = parseCode('[x, y; z, w];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'Matrix',
                    rows: [
                        [
                            { type: 'UserIdentifier', name: 'x' },
                            { type: 'UserIdentifier', name: 'y' }
                        ],
                        [
                            { type: 'UserIdentifier', name: 'z' },
                            { type: 'UserIdentifier', name: 'w' }
                        ]
                    ]
                }
            }]);
        });

        test("matrix starting with empty row", () => {
            const ast = parseCode('[; 1, 2];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'Matrix',
                    rows: [
                        [],
                        [
                            { type: 'Number', value: '1' },
                            { type: 'Number', value: '2' }
                        ]
                    ]
                }
            }]);
        });

        test("column vector matrix", () => {
            const ast = parseCode('[1; 2; 3; 4];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'Matrix',
                    rows: [
                        [{ type: 'Number', value: '1' }],
                        [{ type: 'Number', value: '2' }],
                        [{ type: 'Number', value: '3' }],
                        [{ type: 'Number', value: '4' }]
                    ]
                }
            }]);
        });

        test("tensor with only separators", () => {
            const ast = parseCode('[;;];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'Tensor',
                    structure: [
                        {
                            row: [],
                            separatorLevel: 2
                        },
                        {
                            row: [],
                            separatorLevel: 0
                        }
                    ],
                    maxDimension: 3
                }
            }]);
        });

        test("4D tensor with mixed dimensions", () => {
            const ast = parseCode('[1 ;; 2 ;;; 3];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'Tensor',
                    structure: [
                        {
                            row: [{ type: 'Number', value: '1' }],
                            separatorLevel: 2
                        },
                        {
                            row: [{ type: 'Number', value: '2' }],
                            separatorLevel: 3
                        },
                        {
                            row: [{ type: 'Number', value: '3' }],
                            separatorLevel: 0
                        }
                    ],
                    maxDimension: 4
                }
            }]);
        });

        test("matrix with expressions", () => {
            const ast = parseCode('[a + b, x * y; 1/2, 3^4];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'Matrix',
                    rows: [
                        [
                            {
                                type: 'BinaryOperation',
                                operator: '+',
                                left: { type: 'UserIdentifier', name: 'a' },
                                right: { type: 'UserIdentifier', name: 'b' }
                            },
                            {
                                type: 'BinaryOperation',
                                operator: '*',
                                left: { type: 'UserIdentifier', name: 'x' },
                                right: { type: 'UserIdentifier', name: 'y' }
                            }
                        ],
                        [
                            {
                                type: 'Number',
                                value: '1/2'
                            },
                            {
                                type: 'BinaryOperation',
                                operator: '^',
                                left: { type: 'Number', value: '3' },
                                right: { type: 'Number', value: '4' }
                            }
                        ]
                    ]
                }
            }]);
        });
    });

    describe("Code blocks", () => {
        test("empty code block", () => {
            const ast = parseCode('{{}};');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'CodeBlock',
                    statements: []
                }
            }]);
        });

        test("code block with single expression", () => {
            const ast = parseCode('{{x := 1}};');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'CodeBlock',
                    statements: [{
                        type: 'BinaryOperation',
                        operator: ':=',
                        left: { type: 'UserIdentifier', name: 'x' },
                        right: { type: 'Number', value: '1' }
                    }]
                }
            }]);
        });

        test("code block with multiple statements", () => {
            const ast = parseCode('{{x := 1; y := 2}};');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'CodeBlock',
                    statements: [{
                        type: 'BinaryOperation',
                        operator: ':=',
                        left: { type: 'UserIdentifier', name: 'x' },
                        right: { type: 'Number', value: '1' }
                    }, {
                        type: 'BinaryOperation',
                        operator: ':=',
                        left: { type: 'UserIdentifier', name: 'y' },
                        right: { type: 'Number', value: '2' }
                    }]
                }
            }]);
        });

        test("code block with expressions", () => {
            const ast = parseCode('{{a + b; c * d}};');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'CodeBlock',
                    statements: [{
                        type: 'BinaryOperation',
                        operator: '+',
                        left: { type: 'UserIdentifier', name: 'a' },
                        right: { type: 'UserIdentifier', name: 'b' }
                    }, {
                        type: 'BinaryOperation',
                        operator: '*',
                        left: { type: 'UserIdentifier', name: 'c' },
                        right: { type: 'UserIdentifier', name: 'd' }
                    }]
                }
            }]);
        });

        test("distinguishes code block from set containing set", () => {
            const codeBlock = parseCode('{{3}};');
            const setOfSet = parseCode('{ {3} };');
            
            expect(stripMetadata(codeBlock)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'CodeBlock',
                    statements: [{ type: 'Number', value: '3' }]
                }
            }]);
            
            expect(stripMetadata(setOfSet)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'Set',
                    elements: [{
                        type: 'Set',
                        elements: [{ type: 'Number', value: '3' }]
                    }]
                }
            }]);
        });

        test("spaces matter between braces", () => {
            // {{ }} is a code block
            const codeBlock = parseCode('{{ }};');
            expect(stripMetadata(codeBlock)[0].expression.type).toBe('CodeBlock');
            
            // { { } } is a set containing an empty set
            const setOfSet = parseCode('{ { } };');
            expect(stripMetadata(setOfSet)[0].expression.type).toBe('Set');
            expect(stripMetadata(setOfSet)[0].expression.elements[0].type).toBe('Set');
        });

        test("nested code blocks", () => {
            const ast = parseCode('{{ a := {{ 3 }} }};');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'CodeBlock',
                    statements: [{
                        type: 'BinaryOperation',
                        operator: ':=',
                        left: { type: 'UserIdentifier', name: 'a' },
                        right: {
                            type: 'CodeBlock',
                            statements: [{ type: 'Number', value: '3' }]
                        }
                    }]
                }
            }]);
        });

        test("deeply nested code blocks", () => {
            const ast = parseCode('{{ x := {{ y := {{ z := 42 }} }} }};');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'CodeBlock',
                    statements: [{
                        type: 'BinaryOperation',
                        operator: ':=',
                        left: { type: 'UserIdentifier', name: 'x' },
                        right: {
                            type: 'CodeBlock',
                            statements: [{
                                type: 'BinaryOperation',
                                operator: ':=',
                                left: { type: 'UserIdentifier', name: 'y' },
                                right: {
                                    type: 'CodeBlock',
                                    statements: [{
                                        type: 'BinaryOperation',
                                        operator: ':=',
                                        left: { type: 'UserIdentifier', name: 'z' },
                                        right: { type: 'Number', value: '42' }
                                    }]
                                }
                            }]
                        }
                    }]
                }
            }]);
        });

        test("complex nested code blocks with multiple statements", () => {
            const ast = parseCode('{{ outer := 1; inner := {{ nested := 2; nested + 1 }}; result := outer + inner }};');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'CodeBlock',
                    statements: [{
                        type: 'BinaryOperation',
                        operator: ':=',
                        left: { type: 'UserIdentifier', name: 'outer' },
                        right: { type: 'Number', value: '1' }
                    }, {
                        type: 'BinaryOperation',
                        operator: ':=',
                        left: { type: 'UserIdentifier', name: 'inner' },
                        right: {
                            type: 'CodeBlock',
                            statements: [{
                                type: 'BinaryOperation',
                                operator: ':=',
                                left: { type: 'UserIdentifier', name: 'nested' },
                                right: { type: 'Number', value: '2' }
                            }, {
                                type: 'BinaryOperation',
                                operator: '+',
                                left: { type: 'UserIdentifier', name: 'nested' },
                                right: { type: 'Number', value: '1' }
                            }]
                        }
                    }, {
                        type: 'BinaryOperation',
                        operator: ':=',
                        left: { type: 'UserIdentifier', name: 'result' },
                        right: {
                            type: 'BinaryOperation',
                            operator: '+',
                            left: { type: 'UserIdentifier', name: 'outer' },
                            right: { type: 'UserIdentifier', name: 'inner' }
                        }
                    }]
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

    describe("Metadata and Property Annotations", () => {
        test("simple metadata annotation", () => {
            const ast = parseCode('[obj, name := "foo"];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'WithMetadata',
                    primary: { type: 'UserIdentifier', name: 'obj' },
                    metadata: {
                        name: { type: 'String', value: 'foo', kind: 'quote' }
                    }
                }
            }]);
        });

        test("multiple metadata annotations", () => {
            const ast = parseCode('[obj, name := "foo", version := 1.2, active := true];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'WithMetadata',
                    primary: { type: 'UserIdentifier', name: 'obj' },
                    metadata: {
                        name: { type: 'String', value: 'foo', kind: 'quote' },
                        version: { type: 'Number', value: '1.2' },
                        active: { type: 'UserIdentifier', name: 'true' }
                    }
                }
            }]);
        });

        test("metadata with expression values", () => {
            const ast = parseCode('[data, size := 2 + 3, factor := x * y];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'WithMetadata',
                    primary: { type: 'UserIdentifier', name: 'data' },
                    metadata: {
                        size: {
                            type: 'BinaryOperation',
                            operator: '+',
                            left: { type: 'Number', value: '2' },
                            right: { type: 'Number', value: '3' }
                        },
                        factor: {
                            type: 'BinaryOperation',
                            operator: '*',
                            left: { type: 'UserIdentifier', name: 'x' },
                            right: { type: 'UserIdentifier', name: 'y' }
                        }
                    }
                }
            }]);
        });

        test("metadata with system identifier keys", () => {
            const ast = parseCode('[matrix, ROWS := 3, COLS := 4];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'WithMetadata',
                    primary: { type: 'UserIdentifier', name: 'matrix' },
                    metadata: {
                        ROWS: { type: 'Number', value: '3' },
                        COLS: { type: 'Number', value: '4' }
                    }
                }
            }]);
        });

        test("metadata with string keys", () => {
            const ast = parseCode('[obj, "display-name" := "My Object", "created-at" := timestamp];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'WithMetadata',
                    primary: { type: 'UserIdentifier', name: 'obj' },
                    metadata: {
                        "display-name": { type: 'String', value: 'My Object', kind: 'quote' },
                        "created-at": { type: 'UserIdentifier', name: 'timestamp' }
                    }
                }
            }]);
        });

        test("metadata only (no primary element)", () => {
            const ast = parseCode('[name := "config", version := 2];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'WithMetadata',
                    primary: {
                        type: 'Array',
                        elements: []
                    },
                    metadata: {
                        name: { type: 'String', value: 'config', kind: 'quote' },
                        version: { type: 'Number', value: '2' }
                    }
                }
            }]);
        });

        test("array as primary element with metadata", () => {
            const ast = parseCode('[[1, 2, 3], name := "numbers", count := 3];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'WithMetadata',
                    primary: {
                        type: 'Array',
                        elements: [
                            { type: 'Number', value: '1' },
                            { type: 'Number', value: '2' },
                            { type: 'Number', value: '3' }
                        ]
                    },
                    metadata: {
                        name: { type: 'String', value: 'numbers', kind: 'quote' },
                        count: { type: 'Number', value: '3' }
                    }
                }
            }]);
        });

        test("regular array without metadata still works", () => {
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
    });

    describe("Error handling", () => {
        test("unmatched parenthesis throws error", () => {
            expect(() => parseCode('(2 + 3;')).toThrow(/Expected parameter name|Expected closing parenthesis/);
        });

        test("unmatched bracket throws error", () => {
            expect(() => parseCode('[1, 2;')).toThrow(/Expected closing bracket/);
        });

        test("unmatched brace throws error", () => {
            expect(() => parseCode('{a, b;')).toThrow(/Expected closing brace/);
        });

        test("invalid metadata key throws error", () => {
            expect(() => parseCode('[obj, (x + y) := "invalid"];')).toThrow(/Metadata key must be an identifier or string/);
        });

        test("mixed array elements with metadata throws error", () => {
            expect(() => parseCode('[1, 2, 3, name := "invalid"];')).toThrow(/Cannot mix array elements with metadata/);
        });

        test("mixed map and set elements throws error", () => {
            expect(() => parseCode('{a := 1, b, c := 3};')).toThrow(/Map containers must contain only key-value pairs/);
        });

        test("mixed pattern match and assignment throws error", () => {
            expect(() => parseCode('{(x) :=> x + 1, a := 2};')).toThrow(/Map containers must contain only key-value pairs with|Cannot mix pattern matches with other assignment types/);
        });

        test("mixed equation and assignment throws error", () => {
            expect(() => parseCode('{x :=: 3, a := 2};')).toThrow(/System containers must contain only equations with equation operators separated by semicolons/);
        });

        test("system without semicolons throws error", () => {
            expect(() => parseCode('{x :=: 3*x + 2, y :=: x};')).toThrow(/System containers must contain only equations/);
        });

        test("matrix with metadata throws error", () => {
            expect(() => parseCode('[matrix, type := "sparse"; 1, 2];')).toThrow(/Cannot mix matrix\/tensor syntax with metadata/);
        });

        test("tensor with metadata throws error", () => {
            expect(() => parseCode('[1, 2; 3, 4, key := value];')).toThrow(/Cannot mix matrix\/tensor syntax with metadata/);
        });

        test("nested array with multiple elements works correctly", () => {
            const ast = parseCode('[[1, 2, 3, 4, 5], name := "numbers", size := 5];');
            expect(stripMetadata(ast)).toEqual([{
                type: 'Statement',
                expression: {
                    type: 'WithMetadata',
                    primary: {
                        type: 'Array',
                        elements: [
                            { type: 'Number', value: '1' },
                            { type: 'Number', value: '2' },
                            { type: 'Number', value: '3' },
                            { type: 'Number', value: '4' },
                            { type: 'Number', value: '5' }
                        ]
                    },
                    metadata: {
                        name: { type: 'String', value: 'numbers', kind: 'quote' },
                        size: { type: 'Number', value: '5' }
                    }
                }
            }]);
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