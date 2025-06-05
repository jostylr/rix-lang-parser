# RiX Language Parser Documentation

## Overview

The RiX parser is a Pratt parser implementation that converts tokenized RiX code into Abstract Syntax Trees (ASTs). It handles the full spectrum of RiX language features including mathematical expressions, assignments, function calls, pipe operations, metadata annotations, and more.

## Architecture

### Pratt Parser Design

The parser uses the Pratt parsing technique (also known as "Top Down Operator Precedence") which provides:

- **Elegant precedence handling**: Operators are assigned numeric precedence values
- **Extensible design**: New operators can be easily added to the symbol table
- **Left/right associativity**: Configurable associativity for each operator
- **Flexible syntax**: Supports prefix, infix, and postfix operators

### Core Components

1. **Symbol Table**: Defines operators, their precedence, and associativity
2. **Parser Class**: Main parsing logic with expression and statement parsing
3. **AST Nodes**: Structured representations of parsed code
4. **System Lookup**: Integration point for extending language semantics

## Usage

### Basic Usage

```javascript
import { tokenize } from './src/tokenizer.js';
import { parse } from './src/parser.js';

// Define system identifier lookup
function systemLookup(name) {
    const systemSymbols = {
        'SIN': { type: 'function', arity: 1 },
        'PI': { type: 'constant', value: Math.PI },
        'AND': { type: 'operator', precedence: 40, associativity: 'left', operatorType: 'infix' }
    };
    return systemSymbols[name] || { type: 'identifier' };
}

// Parse RiX code
const code = "x := SIN(PI / 2) + 1;";
const tokens = tokenize(code);
const ast = parse(tokens, systemLookup);
```

### System Lookup Function

The system lookup function is crucial for handling System identifiers (capitalized identifiers). It should return an object describing the identifier's role:

```javascript
function systemLookup(name) {
    return {
        type: 'function' | 'constant' | 'operator' | 'control' | 'special' | 'identifier',
        
        // For functions
        arity: number,          // Number of arguments (-1 for variadic)
        
        // For constants  
        value: any,             // The constant value
        
        // For operators
        precedence: number,     // Operator precedence (0-200)
        associativity: 'left' | 'right',
        operatorType: 'infix' | 'prefix' | 'postfix',
        
        // Additional metadata
        description: string,
        // ... other properties
    };
}
```

## Operator Precedence

The parser uses the following precedence hierarchy (higher numbers bind tighter):

| Precedence | Operators | Description |
|------------|-----------|-------------|
| 130 | `.` | Property access |
| 120 | `()`, `[]` | Function calls, array access |
| 110 | unary `+`, `-`, `NOT` | Unary operators |
| 100 | `^`, `**` | Exponentiation (right associative) |
| 90 | `*`, `/`, `//`, `%`, `/^`, `/~`, `/%` | Multiplication, division |
| 80 | `+`, `-` | Addition, subtraction |
| 70 | `:` | Interval operator |
| 60 | `<`, `>`, `<=`, `>=`, `?<`, `?>`, etc. | Comparison |
| 50 | `=`, `?=`, `!=`, `==` | Equality |
| 40 | `AND` | Logical AND |
| 30 | `OR` | Logical OR |
| 20 | `\|>`, `\|\|>`, `\|>>`, `\|>:`, `\|>?`, etc. | Pipe operations |
| 10 | `:=`, `:=:`, `:>:`, `:<:`, `->`, `=>` | Assignment, equations |
| 5 | `,` | Comma separator |
| 0 | `;` | Statement separator |

## AST Node Types

### Core Node Structure

All AST nodes have these base properties:

```javascript
{
    type: string,           // Node type identifier
    pos: [start, delim, end], // Position information [start, delimiter, end]
    original: string,       // Original source text
    // ... type-specific properties
}
```

### Node Types

#### Statement
Represents a complete statement ending with semicolon:
```javascript
{
    type: "Statement",
    expression: ASTNode,    // The statement's expression
    pos: [start, delim, end],
    original: string
}
```

#### BinaryOperation
Represents operations with two operands:
```javascript
{
    type: "BinaryOperation",
    operator: string,       // The operator symbol
    left: ASTNode,         // Left operand
    right: ASTNode,        // Right operand
    pos: [start, delim, end],
    original: string
}
```

#### UnaryOperation
Represents operations with one operand:
```javascript
{
    type: "UnaryOperation", 
    operator: string,       // The operator symbol
    operand: ASTNode,      // The operand
    pos: [start, delim, end],
    original: string
}
```

#### FunctionCall
Represents function invocations:
```javascript
{
    type: "FunctionCall",
    function: ASTNode,      // Function identifier or expression
    arguments: [ASTNode],   // Array of argument expressions
    pos: [start, delim, end],
    original: string
}
```

#### UserIdentifier
Represents user-defined identifiers (lowercase):
```javascript
{
    type: "UserIdentifier",
    name: string,           // Normalized identifier name
    pos: [start, delim, end],
    original: string
}
```

#### SystemIdentifier
Represents system identifiers (uppercase):
```javascript
{
    type: "SystemIdentifier",
    name: string,           // Normalized identifier name
    systemInfo: object,     // Result from systemLookup function
    pos: [start, delim, end],
    original: string
}
```

#### Number
Represents numeric literals (preserved as-is):
```javascript
{
    type: "Number",
    value: string,          // Original number representation
    pos: [start, delim, end],
    original: string
}
```

#### String
Represents string literals (preserved as-is):
```javascript
{
    type: "String",
    value: string,          // String content
    kind: string,           // String type: 'quote', 'backtick', 'comment', etc.
    pos: [start, delim, end],
    original: string
}
```

#### Array
Represents array literals:
```javascript
{
    type: "Array",
    elements: [ASTNode],    // Array element expressions
    pos: [start, delim, end],
    original: string
}
```

#### Set
Represents set literals:
```javascript
{
    type: "Set",
    elements: [ASTNode],    // Set element expressions
    pos: [start, delim, end],
    original: string
}
```

#### WithMetadata
Represents arrays with metadata annotations using `:=` syntax:
```javascript
{
    type: "WithMetadata",
    primary: ASTNode,       // Primary element (first non-metadata element)
    metadata: object,       // Key-value pairs of metadata
    pos: [start, delim, end],
    original: string
}
```

The `WithMetadata` node is created when an array contains any `:=` assignments. The `primary` field contains the first non-metadata element (or an empty Array node if only metadata is present). The `metadata` field is an object where keys are metadata property names and values are AST nodes representing the assigned expressions.

#### Grouping
Represents parenthesized expressions:
```javascript
{
    type: "Grouping",
    expression: ASTNode,    // The grouped expression
    pos: [start, delim, end],
    original: string
}
```

#### PropertyAccess
Represents property/array access:
```javascript
{
    type: "PropertyAccess",
    object: ASTNode,        // Object being accessed
    property: ASTNode,      // Property/index expression
    pos: [start, delim, end],
    original: string
}
```

## Metadata and Property Annotations

The parser supports metadata annotations within array syntax using the `:=` operator. When an array contains key-value pairs with `:=`, it creates a `WithMetadata` node instead of a regular `Array` node.

### Syntax

```javascript
[object, key := value, ...]
```

### Rules

1. **Metadata Detection**: If any `:=` assignment is found within array brackets, the entire construct becomes a `WithMetadata` node
2. **Primary Element**: The first non-metadata element becomes the `primary` property
3. **Single Primary**: Only one non-metadata element is allowed when metadata is present
4. **Metadata Keys**: Can be identifiers (user or system) or string literals
5. **Metadata Values**: Can be any valid expression
6. **Array Primary**: To use an array as primary, wrap it: `[[1,2,3], key := value]`

### Examples

#### Basic Metadata
```javascript
// Input: [obj, name := "foo"]
{
    type: "WithMetadata",
    primary: { type: "UserIdentifier", name: "obj" },
    metadata: {
        name: { type: "String", value: "foo", kind: "quote" }
    }
}
```

#### Multiple Metadata Properties
```javascript
// Input: [data, size := 10, active := true, version := 1.2]
{
    type: "WithMetadata", 
    primary: { type: "UserIdentifier", name: "data" },
    metadata: {
        size: { type: "Number", value: "10" },
        active: { type: "UserIdentifier", name: "true" },
        version: { type: "Number", value: "1.2" }
    }
}
```

#### Array as Primary Element
```javascript
// Input: [[1, 2, 3], name := "numbers", count := 3]
{
    type: "WithMetadata",
    primary: {
        type: "Array",
        elements: [
            { type: "Number", value: "1" },
            { type: "Number", value: "2" },
            { type: "Number", value: "3" }
        ]
    },
    metadata: {
        name: { type: "String", value: "numbers", kind: "quote" },
        count: { type: "Number", value: "3" }
    }
}
```

#### String Keys
```javascript
// Input: [obj, "display-name" := "My Object", "created-at" := timestamp]
{
    type: "WithMetadata",
    primary: { type: "UserIdentifier", name: "obj" },
    metadata: {
        "display-name": { type: "String", value: "My Object", kind: "quote" },
        "created-at": { type: "UserIdentifier", name: "timestamp" }
    }
}
```

#### Metadata Only
```javascript
// Input: [name := "config", version := 2]
{
    type: "WithMetadata",
    primary: { type: "Array", elements: [] },
    metadata: {
        name: { type: "String", value: "config", kind: "quote" },
        version: { type: "Number", value: "2" }
    }
}
```

## Extending the Parser

### Adding New Operators

To add a new operator, add it to the `SYMBOL_TABLE` in `parser.js`:

```javascript
const SYMBOL_TABLE = {
    // ... existing operators
    '@@': { 
        precedence: PRECEDENCE.UNARY, 
        associativity: 'right', 
        type: 'prefix' 
    },
    '<=>': { 
        precedence: PRECEDENCE.COMPARISON, 
        associativity: 'left', 
        type: 'infix' 
    }
};
```

### Adding System Identifiers

Extend your system lookup function:

```javascript
function systemLookup(name) {
    const systemSymbols = {
        // ... existing symbols
        'MATRIX': { type: 'function', arity: -1, description: 'Matrix constructor' },
        'TRANSPOSE': { type: 'operator', precedence: 120, operatorType: 'postfix' }
    };
    return systemSymbols[name] || { type: 'identifier' };
}
```

### Custom AST Node Types

For specialized constructs, you can create custom node types by modifying the parser's `createNode` method and adding appropriate parsing logic.

## Examples

### Basic Arithmetic
```javascript
// Input: "2 + 3 * 4;"
{
    type: "Statement",
    expression: {
        type: "BinaryOperation", 
        operator: "+",
        left: { type: "Number", value: "2" },
        right: {
            type: "BinaryOperation",
            operator: "*", 
            left: { type: "Number", value: "3" },
            right: { type: "Number", value: "4" }
        }
    }
}
```

### Function Call
```javascript
// Input: "SIN(PI / 2);"
{
    type: "Statement",
    expression: {
        type: "FunctionCall",
        function: { 
            type: "SystemIdentifier", 
            name: "SIN",
            systemInfo: { type: "function", arity: 1 }
        },
        arguments: [{
            type: "BinaryOperation",
            operator: "/",
            left: { 
                type: "SystemIdentifier", 
                name: "PI",
                systemInfo: { type: "constant", value: 3.14159... }
            },
            right: { type: "Number", value: "2" }
        }]
    }
}
```

### Assignment with Function Definition
```javascript
// Input: "f := x -> x^2 + 1;"
{
    type: "Statement", 
    expression: {
        type: "BinaryOperation",
        operator: ":=",
        left: { type: "UserIdentifier", name: "f" },
        right: {
            type: "BinaryOperation",
            operator: "->",
            left: { type: "UserIdentifier", name: "x" },
            right: {
                type: "BinaryOperation",
                operator: "+",
                left: {
                    type: "BinaryOperation", 
                    operator: "^",
                    left: { type: "UserIdentifier", name: "x" },
                    right: { type: "Number", value: "2" }
                },
                right: { type: "Number", value: "1" }
            }
        }
    }
}
```

### Metadata Annotation
```javascript
// Input: "[matrix, rows := 3, cols := 4, name := \"transformation\"];"
{
    type: "Statement",
    expression: {
        type: "WithMetadata",
        primary: { type: "UserIdentifier", name: "matrix" },
        metadata: {
            rows: { type: "Number", value: "3" },
            cols: { type: "Number", value: "4" },
            name: { type: "String", value: "transformation", kind: "quote" }
        }
    }
}
```

## Error Handling

The parser provides detailed error messages with position information:

```javascript
try {
    const ast = parse(tokens, systemLookup);
} catch (error) {
    console.error(`Parse error at position ${error.position}: ${error.message}`);
}
```

Common error scenarios:
- **Unmatched delimiters**: Missing closing parentheses, brackets, or braces
- **Unexpected tokens**: Invalid syntax or token sequences
- **Expression termination**: Incomplete expressions at statement boundaries
- **Mixed metadata**: Cannot mix multiple array elements with metadata assignments

## Position Tracking

Each AST node includes position information in the format `[start, delimiter, end]`:

- **start**: Character position where the construct begins
- **delimiter**: Position of the primary delimiter (for strings/operators)
- **end**: Character position where the construct ends

This enables precise error reporting and source mapping for debugging and tooling.

## Performance Considerations

- **Linear complexity**: The parser processes each token once with O(n) complexity
- **Memory efficient**: AST nodes are created incrementally without backtracking
- **Extensible**: Adding operators doesn't affect parsing performance of existing code
- **Position preservation**: Full source position tracking with minimal overhead

## Integration Notes

The parser is designed to integrate seamlessly with:

1. **Tokenizer**: Consumes token arrays from the RiX tokenizer
2. **Evaluator**: Produces ASTs suitable for interpretation or compilation
3. **Type checker**: AST structure supports static analysis
4. **Code generators**: Can be traversed for transpilation or optimization
5. **IDE tools**: Position information enables syntax highlighting and error reporting