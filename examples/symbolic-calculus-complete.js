import { tokenize } from '../src/tokenizer.js';
import { parse } from '../src/parser.js';

function systemLookup(name) {
    const systemSymbols = {
        'SIN': { type: 'function', arity: 1 },
        'COS': { type: 'function', arity: 1 },
        'TAN': { type: 'function', arity: 1 },
        'LOG': { type: 'function', arity: 1 },
        'LN': { type: 'function', arity: 1 },
        'EXP': { type: 'function', arity: 1 },
        'SQRT': { type: 'function', arity: 1 },
        'POW': { type: 'function', arity: 2 },
        'ATAN': { type: 'function', arity: 1 },
        'SINH': { type: 'function', arity: 1 },
        'COSH': { type: 'function', arity: 1 },
        'PI': { type: 'constant', value: Math.PI },
        'E': { type: 'constant', value: Math.E }
    };
    return systemSymbols[name] || { type: 'identifier' };
}

function demonstrateCalculus(category, examples) {
    console.log(`\n=== ${category} ===`);
    
    examples.forEach(({ description, expression, mathematical }) => {
        console.log(`\n${description}:`);
        console.log(`  RiX: ${expression}`);
        if (mathematical) {
            console.log(`  Math: ${mathematical}`);
        }
        
        try {
            const tokens = tokenize(expression);
            const ast = parse(tokens, systemLookup);
            const result = ast[0];
            
            console.log(`  ✓ Parsed as: ${result.type}`);
            
            // Show key properties
            if (result.order > 1) {
                console.log(`    Order: ${result.order}`);
            }
            if (result.variables) {
                console.log(`    Variables: [${result.variables.map(v => v.name).join(', ')}]`);
            }
            if (result.evaluation) {
                console.log(`    Evaluated at: [${result.evaluation.map(e => e.name || e.type).join(', ')}]`);
            }
            if (result.operations) {
                console.log(`    Operations: ${result.operations.length} calculus ops`);
            }
            if (result.metadata?.integrationConstant) {
                console.log(`    Integration constant: ${result.metadata.integrationConstant}`);
            }
            
        } catch (error) {
            console.log(`  ✗ Error: ${error.message}`);
        }
    });
}

console.log('RiX Symbolic Calculus - Complete Demonstration');
console.log('==============================================');

// Basic Derivatives
demonstrateCalculus('Basic Derivatives', [
    {
        description: 'First derivative function',
        expression: "f'",
        mathematical: "f'(x)"
    },
    {
        description: 'Second derivative function',
        expression: "f''",
        mathematical: "f''(x)"
    },
    {
        description: 'Third derivative function',
        expression: "f'''",
        mathematical: "f'''(x)"
    },
    {
        description: 'Derivative evaluated at point',
        expression: "f'(x)",
        mathematical: "f'(x) at x"
    },
    {
        description: 'Second derivative at point',
        expression: "f''(a)",
        mathematical: "f''(a)"
    }
]);

// Partial Derivatives
demonstrateCalculus('Partial Derivatives', [
    {
        description: 'Partial derivative with respect to x',
        expression: "f'[x]",
        mathematical: "∂f/∂x"
    },
    {
        description: 'Mixed partial derivative',
        expression: "f''[x, y]",
        mathematical: "∂²f/∂x∂y"
    },
    {
        description: 'Third order mixed partial',
        expression: "f'''[x, y, z]",
        mathematical: "∂³f/∂x∂y∂z"
    },
    {
        description: 'Partial evaluated at point',
        expression: "f'[x](a, b)",
        mathematical: "∂f/∂x|(a,b)"
    }
]);

// Basic Integrals
demonstrateCalculus('Basic Integrals', [
    {
        description: 'Indefinite integral',
        expression: "'f",
        mathematical: "∫ f dx"
    },
    {
        description: 'Double integral',
        expression: "''f",
        mathematical: "∫∫ f dx dy"
    },
    {
        description: 'Triple integral',
        expression: "'''f",
        mathematical: "∫∫∫ f dx dy dz"
    },
    {
        description: 'Integral evaluated at point',
        expression: "'f(x)",
        mathematical: "∫ f dx at x"
    },
    {
        description: 'Integral with variable specification',
        expression: "'f[x]",
        mathematical: "∫ f dx"
    }
]);

// Multiple Variable Integrals
demonstrateCalculus('Multiple Variable Integrals', [
    {
        description: 'Double integral over region',
        expression: "''f[x, y]",
        mathematical: "∫∫ f dx dy"
    },
    {
        description: 'Triple integral over volume',
        expression: "'''f[x, y, z]",
        mathematical: "∫∫∫ f dx dy dz"
    },
    {
        description: 'Integral with evaluation boundaries',
        expression: "''f[x, y](a, b, c, d)",
        mathematical: "∫∫ f dx dy from (a,b) to (c,d)"
    }
]);

// Function Derivatives
demonstrateCalculus('Function Derivatives', [
    {
        description: 'Derivative of sine',
        expression: "SIN(x)'",
        mathematical: "d/dx[sin(x)]"
    },
    {
        description: 'Derivative of composite function',
        expression: "SIN(COS(x))'",
        mathematical: "d/dx[sin(cos(x))]"
    },
    {
        description: 'Second derivative of exponential',
        expression: "EXP(x)''",
        mathematical: "d²/dx²[e^x]"
    },
    {
        description: 'Derivative with variable specification',
        expression: "LOG(x)'[x]",
        mathematical: "∂/∂x[ln(x)]"
    }
]);

// Mixed Calculus Operations
demonstrateCalculus('Mixed Calculus Operations', [
    {
        description: 'Integrate then differentiate',
        expression: "'f'",
        mathematical: "d/dx[∫ f dx]"
    },
    {
        description: 'Double integral then double derivative',
        expression: "''f''",
        mathematical: "d²/dx²[∫∫ f dx dy]"
    },
    {
        description: 'Mixed with variable specification',
        expression: "'f'[x, y]",
        mathematical: "∂/∂y[∂/∂x[∫ f dx]]"
    },
    {
        description: 'Alternating operations',
        expression: "'''f'''",
        mathematical: "d³/dx³[∫∫∫ f dx dy dz]"
    }
]);

// Advanced Operation Sequences
demonstrateCalculus('Advanced Operation Sequences', [
    {
        description: 'Complex sequence with variables',
        expression: "''f''[x, y, z]('x, y', 'z, x')",
        mathematical: "Complex mixed sequence"
    },
    {
        description: 'Nested operation specification',
        expression: "f'('g'(h'))",
        mathematical: "f'(g'(h'))"
    },
    {
        description: 'Path derivative',
        expression: "f'(r'(t))",
        mathematical: "df/dr · dr/dt"
    },
    {
        description: 'Multiple path derivatives',
        expression: "g'(x'(t), y'(t))",
        mathematical: "∇g · (dx/dt, dy/dt)"
    }
]);

// Real-World Applications
demonstrateCalculus('Real-World Applications', [
    {
        description: 'Velocity from position (kinematics)',
        expression: "s'[t]",
        mathematical: "v(t) = ds/dt"
    },
    {
        description: 'Acceleration from velocity',
        expression: "s''[t]",
        mathematical: "a(t) = d²s/dt²"
    },
    {
        description: 'Marginal cost (economics)',
        expression: "C'[q]",
        mathematical: "MC = dC/dq"
    },
    {
        description: 'Heat equation partial derivative',
        expression: "T'[t]",
        mathematical: "∂T/∂t"
    },
    {
        description: 'Wave equation second derivative',
        expression: "u''[x]",
        mathematical: "∂²u/∂x²"
    },
    {
        description: 'Gradient component',
        expression: "f'[x]",
        mathematical: "∂f/∂x"
    },
    {
        description: 'Consumer surplus integration',
        expression: "'D[p](0, p_max)",
        mathematical: "∫₀^(p_max) D(p) dp"
    },
    {
        description: 'Work integral',
        expression: "'F[x]",
        mathematical: "W = ∫ F dx"
    }
]);

// Error Cases and Edge Cases
demonstrateCalculus('Error Cases and Limitations', [
    {
        description: 'Currently requires simple identifiers for integrals',
        expression: "'f",
        mathematical: "∫ f dx (works)"
    }
]);

console.log('\n==============================================');
console.log('RiX Symbolic Calculus Features Summary:');
console.log('==============================================');

console.log('\n✓ DERIVATIVES:');
console.log('  • Postfix notation: f\', f\'\', f\'\'\'');
console.log('  • Variable specification: f\'[x,y], f\'\'[x,y,z]');
console.log('  • Evaluation: f\'(x), f\'\'(a,b)');
console.log('  • Function derivatives: SIN(x)\', LOG(x)\'');

console.log('\n✓ INTEGRALS:');
console.log('  • Prefix notation: \'f, \'\'f, \'\'\'f');
console.log('  • Variable specification: \'f[x], \'\'f[x,y]');
console.log('  • Evaluation: \'f(x), \'\'f(a,b,c,d)');
console.log('  • Integration constants: automatic metadata');

console.log('\n✓ MIXED OPERATIONS:');
console.log('  • Sequential: \'f\', f\'\', \'\'f\'\'');
console.log('  • Complex sequences: \'\'f\'\'[x,y,z](\'x,y\',z\',\'w)');
console.log('  • Nested operations: f\'(\'g\'(h\'))');

console.log('\n✓ ADVANCED FEATURES:');
console.log('  • Path derivatives: f\'(r\'(t))');
console.log('  • Operation vs evaluation: f\'(x) vs f\'(x\')');
console.log('  • Multiple variables: f\'[x,y,z]');
console.log('  • Order specification: f\'\'\' for third derivatives');

console.log('\n✓ MATHEMATICAL APPLICATIONS:');
console.log('  • Multivariable calculus: partial derivatives, gradients');
console.log('  • Vector calculus: directional derivatives, line integrals');
console.log('  • Differential equations: ODEs, PDEs');
console.log('  • Physics: kinematics, wave equations, heat transfer');
console.log('  • Economics: marginal analysis, optimization');
console.log('  • Engineering: signal processing, control theory');

console.log('\n✓ AST STRUCTURE:');
console.log('  • Derivative nodes: function, order, variables, evaluation');
console.log('  • Integral nodes: function, order, variables, metadata');
console.log('  • Proper precedence: calculus operators at level 115');
console.log('  • Left-associative parsing for natural mathematical order');

console.log('\nSymbolic Calculus Implementation Complete! 🚀');