# RiX Array Generator Parsing Documentation

## Overview

RiX supports powerful array generator syntax that allows you to create sequences, apply filters, and set termination conditions using a chainable operator syntax. This document describes how the parser handles these constructs.

## Generator Operators

### Basic Generator Operations

#### `|+` - Arithmetic Sequence
Repeatedly adds a value to generate the next element.
```
[1 |+ 2 |^ 5]  // [1, 3, 5, 7, 9]
```

#### `|*` - Geometric Sequence  
Repeatedly multiplies by a value to generate the next element.
```
[2 |* 3 |^ 4]  // [2, 6, 18, 54]
```

#### `|:` - Function Generator
Uses a custom function to generate the next element.
```
[1, 1 |: (i, a, b) -> a + b |^ 10]  // Fibonacci sequence
```

Function signature: `(index, previous_1, previous_2, ...)` where:
- `index`: Current generation index (0-based)
- `previous_1`: Most recent value
- `previous_2`: Second most recent value (if available)

### Filtering Operations

#### `|?` - Filter
Only includes elements that satisfy a predicate function.
```
[1 |+ 1 |? (i, a) -> a % 2 == 0 |^ 5]  // Even numbers only
```

### Termination Operations

#### `|^` - Eager Limit
Stops generation after N elements or when condition is met.
```
[1 |+ 2 |^ 5]                    // Stop after 5 elements
[1 |+ 2 |^ (i, a) -> a > 10]     // Stop when value > 10
```

#### `|^:` - Lazy Limit
Creates a lazy generator that only produces values when requested.
```
[1 |+ 2 |^: 1000]                // Up to 1000 elements on demand
[1 |+ 2 |^: (i, a) -> a > 100]   // Lazy until condition met
```

## Parsing Behavior

### AST Structure

Generator chains are parsed into `GeneratorChain` nodes with the following structure:

```javascript
{
  type: "GeneratorChain",
  start: <initial_value_node> | null,
  operators: [
    {
      type: "GeneratorAdd" | "GeneratorMultiply" | "GeneratorFunction" | "GeneratorFilter" | "GeneratorLimit" | "GeneratorLazyLimit",
      operator: "|+" | "|*" | "|:" | "|?" | "|^" | "|^:",
      operand: <operand_node>
    }
  ]
}
```

### Operator Precedence

Generator operators have the same precedence as pipe operations (`PRECEDENCE.PIPE = 20`) and are left-associative.

### Chaining Rules

1. **Start Value**: Can be explicit (`[1 |+ 2]`) or implicit (`[|+ 2]`)
2. **Operator Order**: Generators → Filters → Limits
3. **Multiple Chains**: Separated by commas in arrays
4. **Context**: Generator chains are only recognized within array literals

### Examples

#### Single Chain
```
[1 |+ 2 |^ 5]
```
AST: Array with one GeneratorChain element

#### Multiple Chains
```
[1, 1 |: (i, a, b) -> a + b |^ 10, |* 3 |^ 3, 100]
```
AST: Array with four elements:
1. Number(1)
2. GeneratorChain (Fibonacci)
3. GeneratorChain (multiply by 3)
4. Number(100)

#### Chain without Start Value
```
[5, |+ 3 |^ 4, 20]
```
The second element references the previous element (5) as its starting value.

## Parser Implementation Details

### Detection Logic
The parser identifies generator chains by:
1. Parsing expressions normally within arrays
2. Detecting binary operations with generator operators
3. Converting binary operation trees to GeneratorChain nodes

### Conversion Process
When a binary operation tree contains generator operators, the parser:
1. Traverses the tree to extract operators in order
2. Identifies the start value (leftmost non-generator operand)
3. Creates a GeneratorChain node with proper structure

### Error Handling
Common parsing errors:
- Missing operands: `[1 |+ |^ 5]`
- Unmatched brackets: `[1 |+ 2 |^ 5`
- Invalid function syntax in generators

## Function Expression Parsing

Generator functions are parsed as `FunctionLambda` nodes with the structure:
```javascript
{
  type: "FunctionLambda",
  parameters: {
    positional: [
      { name: "i", defaultValue: null },
      { name: "a", defaultValue: null }
    ],
    keyword: [],
    conditionals: [],
    metadata: {}
  },
  body: <expression_node>
}
```

## Compatibility

Generator syntax is fully compatible with:
- Regular array elements
- Metadata annotations
- Nested arrays
- Matrix/tensor syntax (when not mixed)

Generator syntax is NOT compatible with:
- Metadata mixed with generators in same array
- Matrix semicolon separators in generator arrays

## Performance Considerations

- Generator chains are parsed eagerly during syntax analysis
- Lazy generators (`|^:`) create deferred evaluation nodes
- Filter operations may require iteration limits to prevent infinite loops
- Complex function generators may impact parsing performance

### MAX_ITERATIONS Constant

To prevent infinite loops in filter operations, implementations should enforce a `MAX_ITERATIONS` global or per-generator setting. Recommended default: 10,000 iterations.

```javascript
// Example safety implementation
const MAX_ITERATIONS = 10000;
if (iterations > MAX_ITERATIONS) {
  throw new Error("Generator exceeded maximum iterations - possible infinite loop");
}
```

### Memory Management

- Eager generators (`|^`) pre-compute entire sequences
- Lazy generators (`|^:`) compute values on-demand
- Use lazy evaluation for large datasets (>1000 elements)
- Complex filters may require significant CPU resources

## Advanced Features

### Complex Mathematical Sequences

#### Recursive Sequences with Multiple Previous Values
```
[1, 1, 2 |: (i, a, b, c) -> a + b + c |^ 10]  // Tribonacci
```

#### Conditional Branching in Generators
```
[1 |: (i, a) -> i % 2 == 0 ? a * 2 : a + 1 |^ 20]
```

#### Multiple Filter Chains
```
[2 |+ 2 |? (i, a) -> a % 3 == 1 |? (i, a) -> a < 100 |^ 50]
```

### Dynamic Termination Conditions

#### Value-Based Stopping
```
[1 |+ 2 |^ (i, a) -> a > 1000]
```

#### Index-Based Stopping
```
[1 |* 2 |^ (i, a) -> i >= 20]
```

#### Complex Conditions
```
[1 |+ 1 |^ (i, a) -> a > 100 OR i > 50]
```

### Real-World Applications

#### Mathematical Series
```
[1 |: (i, a) -> a + 1/(i+1) |^ 20]  // e approximation
[4 |: (i, a) -> a + 4*(-1)^(i+1)/(2*i+3) |^ 1000]  // π approximation
```

#### Financial Modeling
```
[1000 |: (i, a) -> a * 1.05 |^ 10]  // Compound interest
[100 |: (i, a) -> a * (1 + market_volatility()) |^ 252]  // Stock simulation
```

#### Scientific Computing
```
[2 |: (i, x) -> x - (x*x - 2)/(2*x) |^ (i, x) -> abs(x*x - 2) < 0.0001]  // Newton's method
[0.5 |: (i, x) -> 3.8 * x * (1 - x) |^ 50]  // Logistic map (chaos theory)
```

## Error Handling and Edge Cases

### Common Parsing Errors

1. **Missing Operands**
   ```
   [1 |+ |^ 5]  // Error: Missing operand for |+
   ```

2. **Invalid Function Syntax**
   ```
   [1 |: -> x + 1 |^ 5]  // Error: Missing parameter list
   ```

3. **Unmatched Brackets**
   ```
   [1 |+ 2 |^ 5  // Error: Expected closing bracket
   ```

### Safety Mechanisms

- Parser validates operator sequences
- Function parameter validation
- Termination condition type checking
- Prevents nested generator chains within single expressions

## Optimization Guidelines

### When to Use Each Operator

- **`|+`, `|*`**: Simple arithmetic/geometric progressions
- **`|:`**: Complex recurrence relations, mathematical sequences
- **`|?`**: Data filtering, conditional selection
- **`|^`**: Known finite sequences, batch processing
- **`|^:`**: Large datasets, streaming data, unknown sequence length

### Performance Tips

1. Place filters after generators for efficiency
2. Use specific termination conditions to avoid over-computation
3. Consider lazy evaluation for sequences > 1000 elements
4. Avoid complex nested function calls in hot paths
5. Use multiple simple filters rather than one complex filter