/**
 * RiX Language Pratt Parser
 * Implements a Pratt parser for the RiX mathematical expression language
 */

// Precedence levels (higher numbers bind tighter)
const PRECEDENCE = {
    STATEMENT: 0,
    ASSIGNMENT: 10,      // :=, :=:, :>:, etc.
    PIPE: 20,           // |>, ||>, |>>, etc.
    LOGICAL_OR: 30,     // OR (if system identifier)
    LOGICAL_AND: 40,    // AND (if system identifier)  
    EQUALITY: 50,       // =, ?=, !=
    COMPARISON: 60,     // <, >, <=, >=, ?<, ?>, etc.
    INTERVAL: 70,       // :
    ADDITION: 80,       // +, -
    MULTIPLICATION: 90, // *, /, //, %, /^, /~, /%
    EXPONENTIATION: 100, // ^, **
    UNARY: 110,         // unary -, +, NOT
    POSTFIX: 120,       // function calls, array access
    PROPERTY: 130       // .
};

// Symbol table for operators and their parsing behavior
const SYMBOL_TABLE = {
    // Assignment operators (right associative)
    ':=': { precedence: PRECEDENCE.ASSIGNMENT, associativity: 'right', type: 'infix' },
    ':=:': { precedence: PRECEDENCE.ASSIGNMENT, associativity: 'right', type: 'infix' },
    ':<:': { precedence: PRECEDENCE.ASSIGNMENT, associativity: 'right', type: 'infix' },
    ':>:': { precedence: PRECEDENCE.ASSIGNMENT, associativity: 'right', type: 'infix' },
    ':<=:': { precedence: PRECEDENCE.ASSIGNMENT, associativity: 'right', type: 'infix' },
    ':>=:': { precedence: PRECEDENCE.ASSIGNMENT, associativity: 'right', type: 'infix' },
    ':=>': { precedence: PRECEDENCE.ASSIGNMENT, associativity: 'right', type: 'infix' },
    
    // Pipe operators (left associative)
    '|>': { precedence: PRECEDENCE.PIPE, associativity: 'left', type: 'infix' },
    '||>': { precedence: PRECEDENCE.PIPE, associativity: 'left', type: 'infix' },
    '|>>': { precedence: PRECEDENCE.PIPE, associativity: 'left', type: 'infix' },
    '|>:': { precedence: PRECEDENCE.PIPE, associativity: 'left', type: 'infix' },
    '|>?': { precedence: PRECEDENCE.PIPE, associativity: 'left', type: 'infix' },
    '|+': { precedence: PRECEDENCE.PIPE, associativity: 'left', type: 'infix' },
    '|*': { precedence: PRECEDENCE.PIPE, associativity: 'left', type: 'infix' },
    '|:': { precedence: PRECEDENCE.PIPE, associativity: 'left', type: 'infix' },
    '|;': { precedence: PRECEDENCE.PIPE, associativity: 'left', type: 'infix' },
    '|^': { precedence: PRECEDENCE.PIPE, associativity: 'left', type: 'infix' },
    '|?': { precedence: PRECEDENCE.PIPE, associativity: 'left', type: 'infix' },
    
    // Equality operators
    '=': { precedence: PRECEDENCE.EQUALITY, associativity: 'left', type: 'infix' },
    '?=': { precedence: PRECEDENCE.EQUALITY, associativity: 'left', type: 'infix' },
    '!=': { precedence: PRECEDENCE.EQUALITY, associativity: 'left', type: 'infix' },
    '==': { precedence: PRECEDENCE.EQUALITY, associativity: 'left', type: 'infix' },
    
    // Comparison operators
    '<': { precedence: PRECEDENCE.COMPARISON, associativity: 'left', type: 'infix' },
    '>': { precedence: PRECEDENCE.COMPARISON, associativity: 'left', type: 'infix' },
    '<=': { precedence: PRECEDENCE.COMPARISON, associativity: 'left', type: 'infix' },
    '>=': { precedence: PRECEDENCE.COMPARISON, associativity: 'left', type: 'infix' },
    '?<': { precedence: PRECEDENCE.COMPARISON, associativity: 'left', type: 'infix' },
    '?>': { precedence: PRECEDENCE.COMPARISON, associativity: 'left', type: 'infix' },
    '?<=': { precedence: PRECEDENCE.COMPARISON, associativity: 'left', type: 'infix' },
    '?>=': { precedence: PRECEDENCE.COMPARISON, associativity: 'left', type: 'infix' },
    
    // Interval operator
    ':': { precedence: PRECEDENCE.INTERVAL, associativity: 'left', type: 'infix' },
    
    // Addition/subtraction
    '+': { precedence: PRECEDENCE.ADDITION, associativity: 'left', type: 'infix', prefix: true },
    '-': { precedence: PRECEDENCE.ADDITION, associativity: 'left', type: 'infix', prefix: true },
    
    // Multiplication/division
    '*': { precedence: PRECEDENCE.MULTIPLICATION, associativity: 'left', type: 'infix' },
    '/': { precedence: PRECEDENCE.MULTIPLICATION, associativity: 'left', type: 'infix' },
    '//': { precedence: PRECEDENCE.MULTIPLICATION, associativity: 'left', type: 'infix' },
    '%': { precedence: PRECEDENCE.MULTIPLICATION, associativity: 'left', type: 'infix' },
    '/^': { precedence: PRECEDENCE.MULTIPLICATION, associativity: 'left', type: 'infix' },
    '/~': { precedence: PRECEDENCE.MULTIPLICATION, associativity: 'left', type: 'infix' },
    '/%': { precedence: PRECEDENCE.MULTIPLICATION, associativity: 'left', type: 'infix' },
    
    // Exponentiation (right associative)
    '^': { precedence: PRECEDENCE.EXPONENTIATION, associativity: 'right', type: 'infix' },
    '**': { precedence: PRECEDENCE.EXPONENTIATION, associativity: 'right', type: 'infix' },
    
    // Function arrow (right associative)
    '->': { precedence: PRECEDENCE.ASSIGNMENT, associativity: 'right', type: 'infix' },
    '=>': { precedence: PRECEDENCE.ASSIGNMENT, associativity: 'right', type: 'infix' },
    
    // Property access
    '.': { precedence: PRECEDENCE.PROPERTY, associativity: 'left', type: 'infix' },
    
    // Grouping
    '(': { precedence: 0, type: 'grouping' },
    ')': { precedence: 0, type: 'grouping' },
    '[': { precedence: PRECEDENCE.POSTFIX, type: 'postfix' },
    ']': { precedence: 0, type: 'grouping' },
    '{': { precedence: 0, type: 'grouping' },
    '}': { precedence: 0, type: 'grouping' },
    
    // Separators
    ',': { precedence: 5, associativity: 'left', type: 'infix' },
    ';': { precedence: PRECEDENCE.STATEMENT, associativity: 'left', type: 'statement' }
};

class Parser {
    constructor(tokens, systemLookup) {
        this.tokens = tokens;
        this.systemLookup = systemLookup || (() => ({ type: 'identifier' }));
        this.position = 0;
        this.current = null;
        this.advance();
    }

    advance() {
        if (this.position < this.tokens.length) {
            this.current = this.tokens[this.position];
            this.position++;
        } else {
            this.current = { type: 'End', value: null, pos: [this.tokens.length, this.tokens.length, this.tokens.length] };
        }
        return this.current;
    }

    peek() {
        if (this.position < this.tokens.length) {
            return this.tokens[this.position];
        }
        return { type: 'End', value: null };
    }

    createNode(type, properties = {}) {
        const node = {
            type,
            pos: properties.pos || this.current.pos,
            original: properties.original || this.current.original,
            ...properties
        };
        return node;
    }

    error(message) {
        const pos = this.current ? this.current.pos : [0, 0, 0];
        throw new Error(`Parse error at position ${pos[0]}: ${message}`);
    }

    // Get symbol info, including system identifier lookup
    getSymbolInfo(token) {
        if (token.type === 'Symbol') {
            return SYMBOL_TABLE[token.value] || { precedence: 0, type: 'unknown' };
        } else if (token.type === 'SemicolonSequence') {
            // Semicolon sequences should not be treated as binary operators
            return { precedence: 0, type: 'separator' };
        } else if (token.type === 'Identifier' && token.kind === 'System') {
            const systemInfo = this.systemLookup(token.value);
            // Convert system lookup result to symbol table format
            if (systemInfo.type === 'operator') {
                return {
                    precedence: systemInfo.precedence || PRECEDENCE.MULTIPLICATION,
                    associativity: systemInfo.associativity || 'left',
                    type: systemInfo.operatorType || 'infix'
                };
            }
        }
        return { precedence: 0, type: 'operand' };
    }

    // Parse expression with given minimum precedence
    parseExpression(minPrec = 0) {
        let left = this.parsePrefix();

        while (this.current.type !== 'End') {
            // Check for statement terminators
            if (this.current.value === ';' || this.current.value === ',' || 
                this.current.value === ')' || this.current.value === ']' || 
                this.current.value === '}' || this.current.type === 'SemicolonSequence') {
                break;
            }

            // Special case for function calls
            if (this.current.value === '(' && (left.type === 'UserIdentifier' || left.type === 'SystemIdentifier')) {
                left = this.parseInfix(left, { precedence: PRECEDENCE.POSTFIX, type: 'postfix' });
                continue;
            }

            const symbolInfo = this.getSymbolInfo(this.current);
            
            if (symbolInfo.precedence < minPrec) {
                break;
            }

            if (symbolInfo.type === 'statement' || symbolInfo.type === 'separator') {
                break;
            }

            left = this.parseInfix(left, symbolInfo);
        }

        return left;
    }

    // Parse prefix expressions (literals, unary operators, grouping)
    parsePrefix() {
        const token = this.current;

        switch (token.type) {
            case 'Number':
                this.advance();
                return this.createNode('Number', {
                    value: token.value,
                    original: token.original
                });

            case 'String':
                this.advance();
                return this.createNode('String', {
                    value: token.value,
                    kind: token.kind,
                    original: token.original
                });

            case 'Identifier':
                this.advance();
                if (token.kind === 'System') {
                    const systemInfo = this.systemLookup(token.value);
                    return this.createNode('SystemIdentifier', {
                        name: token.value,
                        systemInfo: systemInfo,
                        original: token.original
                    });
                } else {
                    return this.createNode('UserIdentifier', {
                        name: token.value,
                        original: token.original
                    });
                }

            case 'Symbol':
                if (token.value === '(') {
                    return this.parseGrouping();
                } else if (token.value === '[') {
                    return this.parseArray();
                } else if (token.value === '{') {
                    return this.parseBraceContainer();
                } else if (token.value === '+' || token.value === '-') {
                    return this.parseUnaryOperator();
                } else {
                    this.error(`Unexpected symbol: ${token.value}`);
                }
                break;

            default:
                this.error(`Unexpected token: ${token.type}`);
        }
    }

    // Parse infix expressions (binary operators, function calls, etc.)
    parseInfix(left, symbolInfo) {
        const operator = this.current;

        // Special case for function calls - check if we have an identifier followed by '('
        if (operator.value === '(' && (left.type === 'UserIdentifier' || left.type === 'SystemIdentifier')) {
            this.advance(); // consume '('
            const args = this.parseFunctionArgs();
            return this.createNode('FunctionCall', {
                function: left,
                arguments: args,
                pos: left.pos,
                original: left.original + operator.original
            });
        }

        this.advance();

        let rightPrec = symbolInfo.precedence;
        if (symbolInfo.associativity === 'left') {
            rightPrec += 1;
        }

        let right;
        if (operator.value === '[' && symbolInfo.type === 'postfix') {
            // Array/property access
            right = this.parseExpression(0);
            if (this.current.value !== ']') {
                this.error('Expected closing bracket');
            }
            this.advance();
            return this.createNode('PropertyAccess', {
                object: left,
                property: right,
                pos: left.pos,
                original: left.original + operator.original
            });
        } else {
            // Binary operator
            right = this.parseExpression(rightPrec);
            return this.createNode('BinaryOperation', {
                operator: operator.value,
                left: left,
                right: right,
                pos: left.pos,
                original: left.original + operator.original
            });
        }
    }

    parseGrouping() {
        const startToken = this.current;
        this.advance(); // consume '('
        const expr = this.parseExpression(0);
        
        if (this.current.value !== ')') {
            this.error('Expected closing parenthesis');
        }
        this.advance(); // consume ')'
        
        return this.createNode('Grouping', {
            expression: expr,
            pos: startToken.pos,
            original: startToken.original
        });
    }

    parseArray() {
        const startToken = this.current;
        this.advance(); // consume '['
        
        // Check if this might be a matrix/tensor by looking for semicolons
        const result = this.parseMatrixOrArray(startToken);
        
        if (this.current.value !== ']') {
            this.error('Expected closing bracket');
        }
        this.advance(); // consume ']'
        
        return result;
    }
    
    parseMatrixOrArray(startToken) {
        const elements = [];
        let hasMetadata = false;
        let primaryElement = null;
        const metadataMap = {};
        let nonMetadataCount = 0;
        let hasSemicolons = false;
        let matrixStructure = [];
        let currentRow = [];
        
        if (this.current.value !== ']') {
            do {
                // Handle leading semicolons (empty rows at start)
                if (this.current.value === ';' || this.current.type === 'SemicolonSequence') {
                    hasSemicolons = true;
                    const semicolonCount = this.consumeSemicolonSequence();
                    
                    // Add empty row to matrix structure
                    matrixStructure.push({
                        row: [],
                        separatorLevel: semicolonCount
                    });
                    continue;
                }
                
                const element = this.parseExpression(0);
                
                // Check if this is a metadata assignment (key := value)
                if (element.type === 'BinaryOperation' && element.operator === ':=') {
                    if (hasSemicolons) {
                        this.error('Cannot mix matrix/tensor syntax with metadata - use nested array syntax');
                    }
                    hasMetadata = true;
                    // Extract the key from the left side
                    let key;
                    if (element.left.type === 'UserIdentifier') {
                        key = element.left.name;
                    } else if (element.left.type === 'SystemIdentifier') {
                        key = element.left.name;
                    } else if (element.left.type === 'String') {
                        key = element.left.value;
                    } else {
                        this.error('Metadata key must be an identifier or string');
                    }
                    metadataMap[key] = element.right;
                } else {
                    // Regular element
                    nonMetadataCount++;
                    if (hasMetadata) {
                        this.error('Cannot mix array elements with metadata - use nested array syntax like [[1,2,3], key := value]');
                    }
                    if (nonMetadataCount === 1) {
                        primaryElement = element;
                    }
                    elements.push(element);
                    currentRow.push(element);
                }
                
                // Check what comes next
                if (this.current.value === ',') {
                    this.advance();
                } else if (this.current.value === ';' || this.current.type === 'SemicolonSequence') {
                    if (hasMetadata) {
                        this.error('Cannot mix matrix/tensor syntax with metadata');
                    }
                    hasSemicolons = true;
                    const semicolonCount = this.consumeSemicolonSequence();
                    
                    // Add current row to matrix structure (even if empty)
                    matrixStructure.push({
                        row: [...currentRow],
                        separatorLevel: semicolonCount
                    });
                    currentRow = [];
                } else {
                    break;
                }
            } while (this.current.value !== ']' && this.current.type !== 'End');
        }
        
        // Add final row (always add if we have semicolons, even if empty)
        if (currentRow.length > 0 || hasSemicolons) {
            matrixStructure.push({
                row: currentRow,
                separatorLevel: 0
            });
        }
        
        // Check if we have metadata and multiple non-metadata elements
        if (hasMetadata && nonMetadataCount > 1) {
            this.error('Cannot mix array elements with metadata - use nested array syntax like [[1,2,3], key := value]');
        }
        
        // If we found metadata annotations, create a WithMetadata node
        if (hasMetadata) {
            return this.createNode('WithMetadata', {
                primary: primaryElement || this.createNode('Array', {
                    elements: [],
                    pos: startToken.pos,
                    original: startToken.original
                }),
                metadata: metadataMap,
                pos: startToken.pos,
                original: startToken.original
            });
        }
        
        // If we found semicolons, create Matrix or Tensor node
        if (hasSemicolons) {
            return this.buildMatrixTensor(matrixStructure, startToken);
        }
        
        // Otherwise, return a regular Array node
        return this.createNode('Array', {
            elements: elements,
            pos: startToken.pos,
            original: startToken.original
        });
    }
    
    buildMatrixTensor(matrixStructure, startToken) {
        // Determine maximum separator level to decide between Matrix and Tensor
        const maxSeparatorLevel = Math.max(...matrixStructure.map(item => item.separatorLevel));
        
        if (maxSeparatorLevel === 1) {
            // This is a 2D Matrix - convert structure to simple rows
            const rows = [];
            
            for (const item of matrixStructure) {
                rows.push(item.row);
            }
            
            return this.createNode('Matrix', {
                rows: rows,
                pos: startToken.pos,
                original: startToken.original
            });
        } else {
            // This is a multi-dimensional Tensor
            return this.createNode('Tensor', {
                structure: matrixStructure,
                maxDimension: maxSeparatorLevel + 1,
                pos: startToken.pos,
                original: startToken.original
            });
        }
    }
    
    consumeSemicolonSequence() {
        if (this.current.type === 'SemicolonSequence') {
            // Multiple consecutive semicolons
            const count = this.current.count;
            this.advance();
            return count;
        } else if (this.current.value === ';') {
            // Single semicolon
            this.advance();
            return 1;
        }
        return 0;
    }

    parseBraceContainer() {
        const startToken = this.current;
        this.advance(); // consume '{'
        
        const elements = [];
        let containerType = null;
        let hasAssignments = false;
        let hasPatternMatches = false;
        let hasEquations = false;
        let hasSemicolons = false;
        
        if (this.current.value !== '}') {
            do {
                const element = this.parseExpression(0);
                elements.push(element);
                
                // Check for type indicators
                if (element.type === 'BinaryOperation') {
                    if (element.operator === ':=') {
                        hasAssignments = true;
                    } else if (element.operator === ':=>') {
                        hasPatternMatches = true;
                    } else if (element.operator === ':=:' || element.operator === ':>:' || 
                              element.operator === ':<:' || element.operator === ':<=:' || 
                              element.operator === ':>=:') {
                        hasEquations = true;
                    }
                }
                
                if (this.current.value === ',') {
                    this.advance();
                } else if (this.current.value === ';') {
                    hasSemicolons = true;
                    this.advance();
                } else {
                    break;
                }
            } while (this.current.value !== '}' && this.current.type !== 'End');
        }
        
        if (this.current.value !== '}') {
            this.error('Expected closing brace');
        }
        this.advance(); // consume '}'
        
        // Determine container type based on contents
        if (hasEquations) {
            if (!hasSemicolons) {
                this.error('System containers must contain only equations with equation operators separated by semicolons');
            }
            if (hasAssignments || hasPatternMatches) {
                this.error('Cannot mix equations with other assignment types');
            }
            containerType = 'System';
        } else if (hasPatternMatches) {
            if (hasAssignments) {
                this.error('Cannot mix pattern matches with other assignment types');
            }
            containerType = 'PatternMatch';
        } else if (hasAssignments) {
            containerType = 'Map';
        } else {
            // All literals or expressions without special operators
            containerType = 'Set';
        }
        
        // Validate type homogeneity
        if (containerType === 'Map') {
            for (const element of elements) {
                if (element.type !== 'BinaryOperation' || element.operator !== ':=') {
                    this.error('Map containers must contain only key-value pairs with :=');
                }
            }
        } else if (containerType === 'PatternMatch') {
            for (const element of elements) {
                if (element.type !== 'BinaryOperation' || element.operator !== ':=>') {
                    this.error('Pattern-match containers must contain only pattern-match pairs with :=>');
                }
            }
        } else if (containerType === 'System') {
            for (const element of elements) {
                if (element.type !== 'BinaryOperation' || 
                    !([':=:', ':>:', ':<:', ':<=:', ':>=:'].includes(element.operator))) {
                    this.error('System containers must contain only equations with equation operators');
                }
            }
        }
        
        return this.createNode(containerType, {
            elements: elements,
            pos: startToken.pos,
            original: startToken.original
        });
    }

    parseUnaryOperator() {
        const operator = this.current;
        this.advance();
        const operand = this.parseExpression(PRECEDENCE.UNARY);
        
        return this.createNode('UnaryOperation', {
            operator: operator.value,
            operand: operand,
            pos: operator.pos,
            original: operator.original
        });
    }

    parseFunctionArgs() {
        const args = [];
        
        if (this.current.value !== ')') {
            do {
                args.push(this.parseExpression(0));
                if (this.current.value === ',') {
                    this.advance();
                } else {
                    break;
                }
            } while (this.current.value !== ')' && this.current.type !== 'End');
        }
        
        if (this.current.value !== ')') {
            this.error('Expected closing parenthesis in function call');
        }
        this.advance(); // consume ')'
        
        return args;
    }

    // Parse a single statement
    parseStatement() {
        if (this.current.type === 'End') {
            return null;
        }

        const expr = this.parseExpression(0);
        
        // Check for semicolon
        if (this.current.value === ';') {
            this.advance();
            return this.createNode('Statement', {
                expression: expr,
                pos: expr.pos,
                original: expr.original
            });
        }
        
        return expr;
    }

    // Parse the entire program (array of statements)
    parse() {
        const statements = [];
        
        while (this.current.type !== 'End') {
            const stmt = this.parseStatement();
            if (stmt) {
                statements.push(stmt);
            }
        }
        
        return statements;
    }
}

// Main parse function
export function parse(tokens, systemLookup) {
    const parser = new Parser(tokens, systemLookup);
    return parser.parse();
}