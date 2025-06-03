# ![RiX Logo](./rix-logo.png)
**RiX: Rational Interval Expression Language**

A flexible, extensible parser and REPL for mathematical expressions, built in JavaScript. RiX is designed for mathematical exploration, supporting arithmetic, polynomials, rational functions, assignment, function definitions, interval and mixed number notation, units, algebraic extensions, real numbers as oracles, and much more.

---

## Features

- **Rich Mathematical Notation:**
  - Arithmetic, polynomials, rational functions, assignments, function definitions, boolean expressions, equations/inequalities, mixed numbers, and interval arithmetic.
- **Flexible Operator Syntax:**
  - Clear distinction between assignment (`:=`), boolean test (`?=`), identity (`=`), equations/inequalities to solve (`:=:`, `:>:`, etc.).
  - Interval (`a:b`), mixed number (`1..3/4`), and rational number support (`3/4`).
  - Support for function piping, map/filter/reduce constructs, and advanced function pattern matching.
- **Units and Algebraic Extensions:**
  - Attach units with `~unit~`, perform unit arithmetic, and convert units (`x~~mi/m~`).
  - Algebraic primitives (like `sqrt2`) and complex numbers as first-class objects.
- **Real Numbers as Oracles:**
  - Real numbers are implemented as oracles, supporting exact computation and approximation.
- **String Literals and Embedded Code:**
  - Powerful quote and backtick systems supporting any number of delimiters, enabling embedded languages and code blocks without escape headaches.
- **REPL-Ready:**
  - Designed for interactive exploration, both in-browser and in terminal.

---

## Language Overview

### Example Syntax

```plaintext
x := 3                          // Assignment
f := (x, n:=2) -> x^n + 1       // Function definition with optional parameter
y := 1..3/4                     // Mixed number: one and three quarters
z := 2:5                        // Interval from 2 to 5
2:3 ^ 2                         // Interval elementwise exponentiation: 4:9
a := 3.2~m~                     // Number with unit: 3.2 meters
a:b:%4                          // Pick 4 random points in [a,b]
[[1,2;3,4], name:="matrix"]     // Matrix with metadata
SIN(x; n:=4)                    // System function with named argument
x ?= 3                          // Boolean test: is x equal to 3?
x^2 :<: 4                       // Inequality to solve
```

## Tokenization and Parsing
	•	Identifiers:
	•	Start with a Unicode letter; case of first letter determines system (Sin) vs. user (sin) identifiers. No underscores allowed.
	•	Numbers:
	•	Support for integers, decimals (with/without leading digit), rationals, mixed numbers, intervals, decimals with intervals/repeats, units, and algebraic primitives.
	•	Symbols:
	•	Operators and delimiters defined by a fixed list, matched by longest-first (maximal munch).
	•	Strings:
	•	Double-quoted and backtick-quoted literals support N-of-a-kind delimiters for easy embedding.
	•	Comments:
	•	// for single-line, /* ... */, /** ... **/, /*** ... ***/ for block comments (N stars to open/close).


## Getting Started

## Prerequisites
	•	Node.js (for terminal REPL) or Bun
	•	Modern browser (for browser-based REPL)

## Install

Clone this repository:

```
git clone https://github.com/yourusername/rix.git
cd rix
```

Install dependencies if needed:

```
npm install
```
Also bun works with this.

## Run the REPL

### Terminal REPL

```
bun repl.js
```

### Browser REPL

Open index.html in your browser.
No server needed—runs entirely in-browser.


## Project Structure

Don't trust this.

	•	repl.js            — Terminal REPL entry point
	•	index.html         — Browser REPL UI
	•	parser.js          — Pratt parser for RiX
	•	tokenizer.js       — Tokenizer implementing the spec
	•	rational.js        — Rational/interval arithmetic support
	•	units.js           — Unit arithmetic and conversion
	•	oracles.js         — Real number (oracle) support
	•	README.md          — This file
	•	tokenizing-spec.txt— Complete tokenization spec
	•	rix-logo.png       — Project logo



## Development Notes

	•	Tokenizer uses maximal munch: always matches the longest valid symbol at each input position.
	•	Strings and backticks support any-length N delimiters (e.g., ""Hello"", code), simplifying embedded languages.
	•	Identifiers with uppercase first letter are system-level, others are userland.
	•	All syntax and parsing rules are detailed in tokenizing-spec.txt.



## License

MIT


## Contributing

Contributions, suggestions, and issue reports are very welcome! Please open an issue or PR.

## Acknowledgments

This project was inspired by mathematical exploration and language experimentation, with special thanks to OpenAI's ChatGPT (Novix) and the ZED editor plus Claude4 Sonnet (Zeddy) for AI-assisted design and coding.
