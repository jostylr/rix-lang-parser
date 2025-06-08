# RiX Language Parser Documentation

## Overview

The RiX parser is a Pratt parser implementation that converts tokenized RiX code into Abstract Syntax Trees (ASTs). It handles the full spectrum of RiX language features including mathematical expressions, assignments, function calls, pipe operations, metadata annotations, comments, and more.

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

#### Comment
Represents comment nodes in the AST. Comments are treated as standalone statements and are preserved in the parse tree:
```javascript
{
    type: "Comment",
    value: string,          // Comment content (without delimiters)
    kind: "comment",        // Always "comment"
    pos: [start, delim, end],
    original: string        // Original text including comment delimiters
}
```

**Comment Types:**
- **Line comments**: `# comment text` - extends to end of line
- **Block comments**: `/* comment text */` - can span multiple lines
- **Nested block comments**: `/**outer /* inner */ content**/` - supports nesting with matching star counts

**Parsing Behavior:**
- Comments are parsed as standalone statements in the AST
- Comments act as expression terminators, separating adjacent expressions
- Comments can appear before, after, or between other code constructs
- Empty comments (`#` or `/* */`) are preserved with empty value strings
- Comment content preserves original formatting including whitespace and newlines

**Examples:**
```javascript
// Input: "# This is a line comment"
{
    type: "Comment",
    value: " This is a line comment",
    kind: "comment",
    original: "# This is a line comment"
}

// Input: "/* Block comment */"
{
    type: "Comment", 
    value: " Block comment ",
    kind: "comment",
    original: "/* Block comment */"
}

// Input: "/**nested /* inner */ comment**/"
{
    type: "Comment",
    value: "nested /* inner */ comment", 
    kind: "comment",
    original: "/**nested /* inner */ comment**/"
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

#### Matrix
Represents 2D matrix literals using semicolon separators:
```javascript
{
    type: "Matrix",
    rows: [[ASTNode]],      // Array of rows, each row is array of elements
    pos: [start, delim, end],
    original: string
}
```

#### Tensor
Represents multi-dimensional tensor literals using multiple semicolon separators:
```javascript
{
    type: "Tensor",
    structure: [{
        row: [ASTNode],     // Array of elements in this row
        separatorLevel: number  // Number of semicolons that follow this row
    }],
    maxDimension: number,   // Highest dimension level (separatorLevel + 1)
    pos: [start, delim, end],
    original: string
}
```

#### Set
Represents set literals containing only literal values or expressions without special operators:
```javascript
{
    type: "Set",
    elements: [ASTNode],    // Set element expressions
    pos: [start, delim, end],
    original: string
}
```

#### Map
Represents map literals containing key-value pairs using the `:=` operator:
```javascript
{
    type: "Map",
    elements: [ASTNode],    // Array of BinaryOperation nodes with operator ":="
    pos: [start, delim, end],
    original: string
}
```

#### PatternMatch
Represents pattern-matching containers using the `:=>` operator:
```javascript
{
    type: "PatternMatch",
    elements: [ASTNode],    // Array of BinaryOperation nodes with operator ":=>"
    pos: [start, delim, end],
    original: string
}
```

#### System
Represents systems of equations using equation operators (`:=:`, `:>:`, etc.) separated by semicolons:
```javascript
{
    type: "System", 
    elements: [ASTNode],    // Array of BinaryOperation nodes with equation operators
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

#### Tuple
Represents tuple literals with zero or more elements:
```javascript
{
    type: "Tuple",
    elements: [ASTNode],    // Array of tuple elements
    pos: [start, delim, end],
    original: string
}
```

#### NULL
Represents null/missing values (underscore `_` symbol):
```javascript
{
    type: "NULL",
    pos: [start, delim, end],
    original: string
}
```

## Tuples

### Overview
Tuples in RiX are ordered collections of values enclosed in parentheses. They provide a way to group multiple values together while maintaining their order and allowing mixed data types.

### Syntax Rules

1. **Parentheses**: Tuples use parentheses `()` for delimitation
2. **Comma Separation**: Elements are separated by commas `,`
3. **Comma Detection**: Presence of at least one comma indicates a tuple
4. **Grouping vs Tuples**: 
   - `(expression)` → Grouped expression (no comma)
   - `(expression,)` → Singleton tuple (with comma)
5. **Underscore as Null**: `_` symbol always represents `null`
6. **No Empty Slots**: Consecutive commas are syntax errors

### Examples

#### Empty Tuple
```rix
()
```
**AST:**
```javascript
{
    type: "Tuple",
    elements: []
}
```

#### Grouped Expression (Not a Tuple)
```rix
(42)
```
**AST:**
```javascript
{
    type: "Grouping",
    expression: {
        type: "Number",
        value: "42"
    }
}
```

#### Singleton Tuple
```rix
(42,)
```
**AST:**
```javascript
{
    type: "Tuple",
    elements: [
        { type: "Number", value: "42" }
    ]
}
```

#### Multi-Element Tuple
```rix
(1, 2, 3)
```
**AST:**
```javascript
{
    type: "Tuple",
    elements: [
        { type: "Number", value: "1" },
        { type: "Number", value: "2" },
        { type: "Number", value: "3" }
    ]
}
```

#### Tuple with Null Values
```rix
(x, _, y)
```
**AST:**
```javascript
{
    type: "Tuple",
    elements: [
        { type: "UserIdentifier", name: "x" },
        { type: "NULL" },
        { type: "UserIdentifier", name: "y" }
    ]
}
```

#### Underscore as Null Symbol
```rix
_ := 42
```
**AST:**
```javascript
{
    type: "BinaryOperation",
    operator: ":=",
    left: { type: "NULL" },
    right: { type: "Number", value: "42" }
}
```

#### Nested Tuples
```rix
((1, 2), (3, 4))
```
**AST:**
```javascript
{
    type: "Tuple",
    elements: [
        {
            type: "Tuple",
            elements: [
                { type: "Number", value: "1" },
                { type: "Number", value: "2" }
            ]
        },
        {
            type: "Tuple", 
            elements: [
                { type: "Number", value: "3" },
                { type: "Number", value: "4" }
            ]
        }
    ]
}
```

#### Tuple with Expressions
```rix
(a + b, SIN(x), _)
```
**AST:**
```javascript
{
    type: "Tuple",
    elements: [
        {
            type: "BinaryOperation",
            operator: "+",
            left: { type: "UserIdentifier", name: "a" },
            right: { type: "UserIdentifier", name: "b" }
        },
        {
            type: "FunctionCall",
            function: { type: "SystemIdentifier", name: "SIN" },
            arguments: { positional: [{ type: "UserIdentifier", name: "x" }], keyword: [] }
        },
        { type: "NULL" }
    ]
}
```

#### Trailing Commas
```rix
(1, 2, 3,)
```
Trailing commas are allowed and create the same AST as without them.

### Use Cases

#### Coordinate Representation
```rix
point := (x, y, z);
color := (red, green, blue, alpha);
```

#### Multiple Return Values
```rix
result := (status, data, error);
```

#### Sparse Data with Nulls
```rix
record := (name, _, email, _, phone);
value := _;  // Underscore is always null symbol
```

#### Function Arguments Grouping
```rix
args := (param1, param2, param3);
result := someFunction(args);
```

### Error Cases

#### Consecutive Commas (Syntax Error)
```rix
(1,, 2)     // Error: Consecutive commas not allowed
(a, , b)    // Error: Empty element not allowed
```

#### Empty Elements (Syntax Error)
```rix
(,)         // Error: Cannot start with comma
(1, 2,, 3)  // Error: Consecutive commas
```

### Distinction from Other Constructs

| Syntax | Type | Description |
|--------|------|-------------|
| `(expr)` | Grouping | Single expression, no comma |
| `(expr,)` | Tuple | Singleton tuple with comma |
| `(a, b)` | Tuple | Multi-element tuple |
| `[a, b]` | Array | Array literal |
| `{a, b}` | Set | Set literal |
| `(_, val)` | Tuple | Underscore as null symbol |

### Implementation Notes

- **Parser Logic**: Comma detection during parentheses scanning determines tuple vs grouping
- **Underscore Handling**: `_` is always parsed as a null symbol, regardless of context
- **Dynamic Access**: `_` between identifiers enables dynamic access (future feature)
- **Error Recovery**: Clear error messages for common mistakes like consecutive commas
- **Precedence**: Tuple creation has no precedence conflicts as it's delimiter-based
- **Memory**: Efficient representation with direct element array storage

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

## Matrix and Tensor Syntax

The parser supports multi-dimensional matrix and tensor literals using semicolon separators with different levels indicating dimensionality.

### Syntax Rules

- **Commas (`,`)** separate elements within a row
- **Single semicolon (`;`)** separates rows within a 2D matrix
- **Double semicolon (`;;`)** separates 2D slices within a 3D tensor
- **Triple semicolon (`;;;`)** separates 3D blocks within a 4D tensor
- And so on for higher dimensions...

### Matrix Examples

#### 2D Matrix
```javascript
// Input: [1, 2; 3, 4];
{
    type: "Matrix",
    rows: [
        [
            { type: "Number", value: "1" },
            { type: "Number", value: "2" }
        ],
        [
            { type: "Number", value: "3" },
            { type: "Number", value: "4" }
        ]
    ]
}
```

#### Matrix with Variables
```javascript
// Input: [x, y; z, w];
{
    type: "Matrix",
    rows: [
        [
            { type: "UserIdentifier", name: "x" },
            { type: "UserIdentifier", name: "y" }
        ],
        [
            { type: "UserIdentifier", name: "z" },
            { type: "UserIdentifier", name: "w" }
        ]
    ]
}
```

#### Column Vector
```javascript
// Input: [1; 2; 3];
{
    type: "Matrix",
    rows: [
        [{ type: "Number", value: "1" }],
        [{ type: "Number", value: "2" }],
        [{ type: "Number", value: "3" }]
    ]
}
```

### Tensor Examples

#### 3D Tensor
```javascript
// Input: [1, 2; 3, 4 ;; 5, 6; 7, 8];
{
    type: "Tensor",
    structure: [
        {
            row: [
                { type: "Number", value: "1" },
                { type: "Number", value: "2" }
            ],
            separatorLevel: 1
        },
        {
            row: [
                { type: "Number", value: "3" },
                { type: "Number", value: "4" }
            ],
            separatorLevel: 2
        },
        {
            row: [
                { type: "Number", value: "5" },
                { type: "Number", value: "6" }
            ],
            separatorLevel: 1
        },
        {
            row: [
                { type: "Number", value: "7" },
                { type: "Number", value: "8" }
            ],
            separatorLevel: 0
        }
    ],
    maxDimension: 3
}
```

#### 4D Tensor
```javascript
// Input: [1; 2 ;; 3; 4 ;;; 5; 6 ;; 7; 8];
{
    type: "Tensor",
    structure: [
        // Structure with separatorLevel values ranging from 0 to 3
    ],
    maxDimension: 4
}
```

### Special Cases

#### Empty Rows
Empty rows are preserved in the structure:
```javascript
// Input: [1, 2; ; 3, 4];
{
    type: "Matrix",
    rows: [
        [
            { type: "Number", value: "1" },
            { type: "Number", value: "2" }
        ],
        [],  // Empty row
        [
            { type: "Number", value: "3" },
            { type: "Number", value: "4" }
        ]
    ]
}
```

#### Mixed with Expressions
Matrix elements can be any valid expressions:
```javascript
// Input: [a + b, sin(x); f(y), z^2];
{
    type: "Matrix",
    rows: [
        [
            { type: "BinaryOperation", operator: "+", ... },
            { type: "FunctionCall", function: { name: "sin" }, ... }
        ],
        [
            { type: "FunctionCall", function: { name: "f" }, ... },
            { type: "BinaryOperation", operator: "^", ... }
        ]
    ]
}
```

### Important Notes

- **Metadata incompatible**: Matrix/tensor syntax cannot be mixed with metadata annotations (`:=` syntax)
- **Spaces matter**: Spaces between semicolons create separate separator tokens
- **Post-processing**: Actual dimensional analysis is performed at post-processing level
- **Precedence**: Semicolon sequences have separator precedence and break expression parsing

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

## Brace Container Types

The parser distinguishes between different types of brace containers based on their syntax and contents:

### Code Blocks `{{ }}`

Code blocks use double braces and contain executable statements or expressions:
```javascript
// Input: "{{x := 1; y := 2}};"
{
    type: "CodeBlock",
    statements: [
        {
            type: "BinaryOperation",
            operator: ":=",
            left: { type: "UserIdentifier", name: "x" },
            right: { type: "Number", value: "1" }
        },
        {
            type: "BinaryOperation", 
            operator: ":=",
            left: { type: "UserIdentifier", name: "y" },
            right: { type: "Number", value: "2" }
        }
    ]
}
```

**Important**: Spaces between braces matter! `{{}}` is a code block, while `{ {} }` is a set containing an empty set.

#### Code Block Rules:
- Use `{{` and `}}` delimiters (double braces)
- Can contain any valid RiX expressions or statements
- Statements can be separated by semicolons
- Always produces a `CodeBlock` AST node regardless of statement count
- Supports assignments, function calls, expressions, and nested structures

#### Code Block Examples:
```javascript
// Empty code block
{{}}

// Single expression
{{x + y}}

// Single assignment  
{{result := calculation()}}

// Multiple statements
{{a := 1; b := 2; sum := a + b}}

// Complex computation pipeline
{{input := 45; radians := input * PI / 180; result := SIN(radians)}}

// Nested code blocks
{{ a := {{ 3 }} }}

// Multi-level nesting
{{ x := {{ y := {{ z := 42 }} }} }}

// Complex nested with multiple statements
{{ outer := 1; inner := {{ nested := 2; nested + 1 }}; result := outer + inner }}
```

### Brace Containers `{ }`

The parser distinguishes between four different types of single brace containers `{}` based on their contents:

### Set Containers
Contains only literal values or expressions without special assignment operators:
```javascript
// Input: "{3, 5, 6};"
{
    type: "Set",
    elements: [
        { type: "Number", value: "3" },
        { type: "Number", value: "5" },
        { type: "Number", value: "6" }
    ]
}
```

### Map Containers
Contains key-value pairs using the `:=` operator:
```javascript
// Input: "{a := 4, b := 5};"
{
    type: "Map",
    elements: [
        {
            type: "BinaryOperation",
            operator: ":=",
            left: { type: "UserIdentifier", name: "a" },
            right: { type: "Number", value: "4" }
        },
        {
            type: "BinaryOperation", 
            operator: ":=",
            left: { type: "UserIdentifier", name: "b" },
            right: { type: "Number", value: "5" }
        }
    ]
}
```

### Pattern-Match Containers
Contains pattern-match pairs using the `:=>` operator:
```javascript
// Input: "{(x) :=> x + 1};"
{
    type: "PatternMatch",
    elements: [{
        type: "BinaryOperation",
        operator: ":=>",
        left: {
            type: "Grouping",
            expression: { type: "UserIdentifier", name: "x" }
        },
        right: {
            type: "BinaryOperation",
            operator: "+",
            left: { type: "UserIdentifier", name: "x" },
            right: { type: "Number", value: "1" }
        }
    }]
}
```

### System Containers
Contains equations using equation operators (`:=:`, `:>:`, etc.) separated by semicolons:
```javascript
// Input: "{x :=: 3*x + 2; y :=: x};"
{
    type: "System",
    elements: [
        {
            type: "BinaryOperation",
            operator: ":=:",
            left: { type: "UserIdentifier", name: "x" },
            right: {
                type: "BinaryOperation",
                operator: "+",
                left: {
                    type: "BinaryOperation",
                    operator: "*",
                    left: { type: "Number", value: "3" },
                    right: { type: "UserIdentifier", name: "x" }
                },
                right: { type: "Number", value: "2" }
            }
        },
        {
            type: "BinaryOperation",
            operator: ":=:",
            left: { type: "UserIdentifier", name: "y" },
            right: { type: "UserIdentifier", name: "x" }
        }
    ]
}
```

### Type Validation Rules

The parser enforces type homogeneity within brace containers:

1. **Set containers**: Can contain any expressions that don't use special operators
2. **Map containers**: Must contain only `:=` assignments
3. **Pattern-match containers**: Must contain only `:=>` pattern matches
4. **System containers**: Must contain only equation operators (`:=:`, `:>:`, `:<:`, `:<=:`, `:>=:`) and use semicolons as separators

Mixing different types within the same container will result in a parse error.

## Code Block vs Brace Container Distinction

It's crucial to understand the difference between code blocks `{{ }}` and brace containers `{ }`:

| Construct | Syntax | Purpose | Example |
|-----------|--------|---------|---------|
| Code Block | `{{ }}` | Assignable code execution | `{{x := 1; y := x + 1}}` |
| Set | `{ }` | Mathematical set | `{1, 2, 3}` |
| Map | `{ }` | Key-value pairs | `{name := "Alice", age := 30}` |
| Pattern Match | `{ }` | Pattern matching | `{(0) :=> "zero", (1) :=> "one"}` |
| System | `{ }` | Equation systems | `{x :=: 2*y; y :>: 0}` |

### Spacing Examples:
```javascript
{{3}}        // Code block containing number 3
{ {3} }      // Set containing a set that contains 3
{{}}         // Empty code block  
{ {} }       // Set containing an empty set
{{ {a := 1} }} // Code block containing a map
{ {{a := 1}} } // Set containing a code block (nested)

// Nested code block examples
{{ a := {{ 3 }} }}                    // Code block with nested code block
{{ x := {{ y := 2; y * 3 }} }}         // Assignment to nested computation
{{ compute := {{ base := 10; base^2 }}; result := compute + 5 }} // Multi-level
```

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

## Comments

The RiX parser includes comprehensive support for comments, treating them as first-class AST nodes rather than discarding them during parsing. This allows tools to preserve documentation, implement preprocessing directives, or perform comment-based analysis.

### Comment Syntax

The parser supports two types of comments:

**Line Comments (`#`)**
```javascript
# This is a line comment
x = 5  # Inline comment
```

**Block Comments (`/* */`)**
```javascript
/* This is a block comment */
/* Multi-line
   block comment
   spanning several lines */
```

**Nested Block Comments**
```javascript
/**outer /* nested inner */ content**/
/***deeply /* nested /* comment */ structure */ content***/
```

### Comment Parsing Behavior

1. **Standalone Statements**: Comments are parsed as independent `Comment` nodes in the AST
2. **Expression Separators**: Comments act as implicit statement terminators, breaking expression parsing
3. **Content Preservation**: All comment content is preserved exactly as written (including whitespace)
4. **Position Tracking**: Comments include precise source position information

### Comment AST Structure

Each comment produces a dedicated AST node:
```javascript
{
    type: "Comment",
    value: string,          // Comment content without delimiters
    kind: "comment",        // Always "comment" 
    pos: [start, delim, end],
    original: string        // Original text including delimiters
}
```

### Parsing Examples

**Simple Line Comment**
```javascript
// Input: "# Calculate result"
// AST:
[{
    type: "Comment",
    value: " Calculate result",
    kind: "comment",
    original: "# Calculate result"
}]
```

**Comment Between Expressions**
```javascript
// Input: "x = 5\n# Set variable\ny = 10"
// AST:
[
    { type: "BinaryOperation", operator: "=", ... },
    { type: "Comment", value: " Set variable", ... },
    { type: "BinaryOperation", operator: "=", ... }
]
```

**Nested Block Comment**
```javascript
// Input: "/**outer /* inner */ content**/"
// AST:
[{
    type: "Comment",
    value: "outer /* inner */ content",
    kind: "comment", 
    original: "/**outer /* inner */ content**/"
}]
```

### Integration with Code

Comments integrate seamlessly with all RiX language constructs:

- **Before expressions**: `# comment\nexpression`
- **After expressions**: `expression\n# comment`
- **Between statements**: `stmt1; # comment\nstmt2`
- **In function definitions**: Comments preserve documentation
- **With metadata**: Comments can document complex annotations

This comment support enables rich documentation workflows and tooling that can process both code and its associated documentation in a unified manner.

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
- **Mixed container types**: Cannot mix different assignment operators within brace containers
- **Invalid system syntax**: System containers require semicolon separators

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

## Piping and Sequence Operators

The RiX parser supports a comprehensive family of piping and sequence operators for functional data processing and transformation. These operators enable elegant composition of operations and data flow patterns.

### Overview

Piping operators allow data to flow from left to right through a sequence of transformations. All pipe operators are **left-associative**, meaning `a |> f |> g` is parsed as `(a |> f) |> g`, allowing natural left-to-right data flow through the pipeline.

### Operator Types

| Operator | AST Node | Precedence | Associativity | Description |
|----------|----------|------------|---------------|-------------|
| `\|>` | `Pipe` | 20 | left | Simple pipe - auto-feeds left as arguments to right function |
| `\|\|>` | `ExplicitPipe` | 20 | left | Explicit pipe with placeholders for argument rearrangement |
| `\|>>` | `Map` | 20 | left | Map function over each element of iterable |
| `\|>?` | `Filter` | 20 | left | Filter elements where predicate returns true |
| `\|>:` | `Reduce` | 20 | left | Reduce iterable to single value using binary function |

### Simple Pipe (`|>`)

The simple pipe operator feeds the left operand as arguments to the right function. Tuples are automatically unpacked as multiple arguments.

#### Syntax
```
value |> function
tuple |> function
```

#### Examples
```rix
3 |> f                    // f(3)
(3, 4) |> f              // f(3, 4) - tuple unpacked
[1, 2, 3] |> sum         // sum([1, 2, 3])
x |> sqrt |> abs         // abs(sqrt(x)) - left associative
```

#### AST Structure
```javascript
{
  type: "Pipe",
  left: { /* left operand */ },
  right: { /* right function */ }
}
```

### Explicit Pipe (`||>`)

The explicit pipe operator allows precise control over argument positioning using placeholders (`_1`, `_2`, etc.). This enables argument reordering, duplication, and selective usage.

#### Syntax
```
tuple ||> function(_N, _M, ...)
```

#### Placeholder Rules
- `_1`, `_2`, `_3`, ... refer to first, second, third, etc. tuple elements
- `__1`, `___1` etc. are also valid placeholder formats
- Placeholders can be duplicated: `_1, _1, _2`
- Placeholders can be skipped: `_3, _1` (skips `_2`)
- Placeholders can be reordered: `_2, _1` (swaps arguments)

#### Examples
```rix
(3, 4) ||> f(_2, _1)           // f(4, 3) - swap arguments
(1, 2, 3) ||> g(_3, _2, _1)    // g(3, 2, 1) - reverse
(x, y) ||> func(_1, _1, _2)    // func(x, x, y) - duplicate
(a, b, c, d) ||> h(_4, _1, _3) // h(d, a, c) - selective
```

#### AST Structure
```javascript
{
  type: "ExplicitPipe",
  left: { /* tuple operand */ },
  right: { /* function with placeholders */ },
  placeholders: ["_2", "_1"] // extracted placeholder names
}
```

### Map Operator (`|>>`)

The map operator applies a function to each element of an iterable, producing a new iterable with transformed elements.

#### Syntax
```
iterable |>> function
iterable |>> lambda_expression
```

#### Examples
```rix
[1, 2, 3] |>> f                    // [f(1), f(2), f(3)]
[1, 2, 3] |>> (x) -> x^2          // [1, 4, 9]
words |>> (w) -> w.toUpperCase()   // uppercase each word
matrix |>> (row) -> row |> sum     // sum each row
```

#### AST Structure
```javascript
{
  type: "Map",
  left: { /* iterable operand */ },
  right: { /* function or lambda */ }
}
```

### Filter Operator (`|>?`)

The filter operator keeps only elements where the predicate function returns true.

#### Syntax
```
iterable |>? predicate_function
iterable |>? lambda_expression
```

#### Examples
```rix
[1, 2, 3, 4] |>? (x) -> x > 2     // [3, 4]
[1, 2, 3, 4] |>? (x) -> x % 2 == 0 // [2, 4] - even numbers
words |>? (w) -> w.length > 3      // words longer than 3 chars
data |>? isValid                   // filter using named predicate
```

#### AST Structure
```javascript
{
  type: "Filter",
  left: { /* iterable operand */ },
  right: { /* predicate function */ }
}
```

### Reduce Operator (`|>:`)

The reduce operator accumulates elements of an iterable into a single value using a binary function.

#### Syntax
```
iterable |>: binary_function
iterable |>: lambda_expression
```

#### Examples
```rix
[1, 2, 3, 4] |>: (a, b) -> a + b  // 10 - sum
[1, 2, 3, 4] |>: (acc, x) -> acc * x // 24 - product
[5, 2, 8, 1] |>: (max, x) -> x > max ? x : max // 8 - maximum
words |>: (acc, w) -> acc + " " + w // concatenate with spaces
```

#### AST Structure
```javascript
{
  type: "Reduce",
  left: { /* iterable operand */ },
  right: { /* binary function */ }
}
```

### Operator Composition

Pipe operators can be chained together to create complex data processing pipelines:

#### Examples
```rix
// Map then filter
[1, 2, 3, 4, 5] |>> (x) -> x^2 |>? (y) -> y > 10
// Result: [16, 25]

// Filter then reduce
numbers |>? (x) -> x > 0 |>: (a, b) -> a + b
// Sum positive numbers

// Complex pipeline
data |>> normalize |>? (x) -> x > threshold |>: average
// Normalize, filter, then compute average

// Explicit pipe in pipeline
(matrix, vector) ||> multiply(_1, _2) |> validate
// Matrix-vector multiplication with validation
```

### Left Associativity

All pipe operators are left-associative, which means:

```rix
a |> f |> g |> h
// Parsed as: (((a |> f) |> g) |> h)
// Evaluated as: h(g(f(a)))

[1,2,3] |>> double |>? positive |>: sum
// Parsed as: (([1,2,3] |>> double) |>? positive) |>: sum
```

This associativity enables natural left-to-right data flow through the pipeline, where each operation processes the result of the previous operation.

### Precedence Rules

Pipe operators have precedence level 20, which means they:
- Bind looser than arithmetic and function calls
- Bind tighter than assignment operators
- Allow natural expression of data flow patterns

```rix
x + y |> f        // (x + y) |> f
x |> f + 1        // (x |> f) + 1
result := x |> f  // result := (x |> f)
```

### Integration Examples

#### With Function Definitions
```rix
processData := (input) -> input |>> clean |>? validate |>: combine;
```

#### With Assignment
```rix
result := rawData |>> normalize |>? (x) -> x > 0.5 |>: average;
```

#### With System Functions
```rix
numbers |> SUM;
matrix |>> (row) -> row |> MAX;
```

#### Mathematical Processing
```rix
measurements |>> (x) -> x - MEAN(measurements) |>> (x) -> x^2 |>: sum;
// Compute sum of squared deviations
```

### Error Handling

The parser validates:
- Placeholder syntax in explicit pipes (`_1`, `_2`, etc.)
- Proper function syntax on the right side of operators
- Correct AST node generation for each operator type

Invalid examples that will produce parse errors:
```rix
x ||> f(_0, _1)     // Invalid: placeholders start from _1
x |>                // Invalid: missing right operand
|> f                // Invalid: missing left operand
```

## Function Definitions

The RiX parser supports comprehensive function definition syntax with multiple paradigms.

### Standard Function Definitions

Standard functions use the `:->` operator and support positional and keyword-only parameters:

```javascript
// Basic function
f(x) :-> x + 1

// Function with default parameters
f(x, n := 5) :-> x^n

// Function with keyword-only parameters (after semicolon)
f(x, n := 5; a := 0) :-> (x-a)^n + 1

// Function with conditional parameters
h(x, y; n := 2 ? x^2 + y^2 = 1) :-> COS(x; n) * SIN(y; n)
```

#### Parameter Types

1. **Positional Parameters**: `x` - required parameters with no default
2. **Positional with Defaults**: `n := 5` - optional parameters with default values
3. **Keyword-Only Parameters**: Parameters after `;` that must have defaults and be called by name
4. **Conditional Parameters**: `n := 2 ? condition` - parameters with conditions that must be satisfied

#### AST Structure

```javascript
{
  type: 'FunctionDefinition',
  name: { type: 'UserIdentifier', name: 'f' },
  parameters: {
    positional: [
      { name: 'x', defaultValue: null, condition: null, isKeywordOnly: false },
      { name: 'n', defaultValue: {...}, condition: null, isKeywordOnly: false }
    ],
    keyword: [
      { name: 'a', defaultValue: {...}, condition: {...}, isKeywordOnly: true }
    ],
    metadata: {}
  },
  body: {...},
  type: 'standard'
}
```

### Pattern Matching Functions

Pattern matching functions use `:=>` and allow multiple function definitions under one name:

```javascript
// Array syntax
g :=> [ (x ? x < 0) -> -x, (x) -> x ]

// Array with global metadata
g :=> [ [(x ? x < 0) -> -x+n, (x) -> x-n] , n := 4]

// Separate statements (equivalent to array syntax)
g :=> (x ? x < 0) -> -x;
g :=> (x) -> x
```

#### Pattern Matching Rules

1. Patterns are evaluated in order of definition
2. First matching pattern with successful execution is used
3. Conditions use `?` operator: `(x ? x < 0)`
4. Global metadata applies to all patterns in array form
5. Local metadata applies only to specific patterns

#### AST Structure

```javascript
{
  type: 'PatternMatchingFunction',
  name: { type: 'UserIdentifier', name: 'g' },
  parameters: {...},
  patterns: [
    {
      type: 'BinaryOperation',
      operator: '->',
      left: { /* parameter with condition */ },
      right: { /* function body */ }
    }
  ],
  metadata: { /* global metadata */ }
}
```

### Function Calls with Enhanced Syntax

Function calls support semicolon separators for keyword arguments:

```javascript
// Mixed positional and keyword arguments
f(2, 3; a := 4)

// Shorthand keyword arguments (n := n)
f(2; n)

// Multiple keyword arguments
f(1; a := 2, b := 3)
```

#### Function Call AST

```javascript
{
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
```

### Assignment-Style Function Definitions

Alternative syntax using standard assignment operators:

```javascript
// Equivalent to f(x, n := 5; a := 0) :-> (x-a)^n + 1
f := (x, n := 5; a := 0) -> (x-a)^n + 1

// Pattern matching with assignment
g := [ (x ? x < 0) -> -x, (x) -> x ]
```

### Condition Operator

The `?` operator is used for conditional expressions in parameters and patterns:

- **Precedence**: Same as comparison operators (`<`, `>`, etc.)
- **Associativity**: Left associative
- **Usage**: `parameter ? condition` or `(args ? condition) -> body`

### Metadata Integration

Function definitions integrate with the existing metadata system:

```javascript
// Function with parameter metadata
f(x; a := 0, metadata := "description") :-> x + a

// Pattern matching with global metadata
g :=> [ patterns, n := 4, description := "absolute value function" ]
```

### Comprehensive Examples

#### Basic Function Definitions

```javascript
// Simple function
square(x) :-> x^2

// Multi-parameter function
add(x, y) :-> x + y

// Function with system calls
hypotenuse(a, b) :-> SQRT(a^2 + b^2)
```

#### Default Parameters

```javascript
// Single default parameter
power(x, n := 2) :-> x^n

// Multiple default parameters
line(x, m := 1, b := 0) :-> m*x + b

// Mixed parameters
poly(x, a, b := 1, c := 0) :-> a*x^2 + b*x + c
```

#### Keyword-Only Parameters

```javascript
// Basic keyword-only parameters
trig(x; precision := 10, units := "radians") :-> SIN(x; precision)

// Complex parameter mix
func(x, y, scale := 1; offset := 0, normalize := false) :-> (x + y) * scale + offset
```

#### Conditional Parameters

```javascript
// Simple condition
safeDivide(x, y; check := true ? y != 0) :-> x / y

// Complex condition
constrainedPower(x, n := 2 ? x > 0 AND n >= 0) :-> x^n

// Multiple conditions
constrainedFunc(x, y; a := 1 ? x^2 + y^2 <= 1, b := 0 ? a > 0) :-> a*x + b*y
```

#### Pattern Matching Functions

```javascript
// Basic pattern matching
abs :=> [ (x ? x >= 0) -> x, (x ? x < 0) -> -x ]

// Multiple patterns
sign :=> [ (x ? x > 0) -> 1, (x ? x < 0) -> -1, (x ? x = 0) -> 0 ]

// Pattern with global metadata
normalize :=> [ [(x ? x != 0) -> x / scale, (x) -> 0], scale := 100 ]

// Pattern with multiple metadata
transform :=> [ [(x) -> a*x + b, (x ? x < 0) -> a*(-x) + b], a := 2, b := 5 ]
```

#### Function Calls with Enhanced Syntax

```javascript
// Basic function call
result := func(5, 10)

// Function call with keywords
result := transform(x; scale := 2, offset := 5)

// Mixed argument call
result := poly(x, 3; b := 2, c := 1)

// Shorthand keywords (n := n)
result := process(data; verbose, debug)
```

#### Assignment-Style Definitions

```javascript
// Lambda assignment
double := (x) -> 2 * x

// Lambda with keywords
adjust := (x; offset := 0, scale := 1) -> x * scale + offset

// Complex lambda
polynomial := (x, coeffs; degree := 2) -> coeffs[0] + coeffs[1]*x + coeffs[2]*x^degree
```

#### Real-World Mathematical Examples

```javascript
// Distance function
distance(p1, p2; metric := "euclidean") :-> SQRT((p1[0] - p2[0])^2 + (p1[1] - p2[1])^2)

// Newton method step
newtonStep(f, df, x; tolerance := 1e-6 ? df(x) != 0) :-> x - f(x) / df(x)

// Piecewise function
piecewise :=> [ 
  (x ? x < -1) -> -x - 1, 
  (x ? x >= -1 AND x <= 1) -> x^2, 
  (x ? x > 1) -> x + 1 
]

// Matrix operation with validation
matmul(A, B; validate := true ? A.cols = B.rows) :-> A * B
```

## Integration Notes

The parser is designed to integrate seamlessly with:

1. **Tokenizer**: Consumes token arrays from the RiX tokenizer
2. **Evaluator**: Produces ASTs suitable for interpretation or compilation
3. **Type checker**: AST structure supports static analysis
4. **Code generators**: Can be traversed for transpilation or optimization
5. **IDE tools**: Position information enables syntax highlighting and error reporting