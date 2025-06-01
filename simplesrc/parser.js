// Pratt parser implementation for math expressions
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }

  // Get current token
  peek() {
    return this.position < this.tokens.length ? this.tokens[this.position] : null;
  }

  // Consume and return current token
  next() {
    return this.position < this.tokens.length ? this.tokens[this.position++] : null;
  }

  // Check if we're at end of tokens
  isAtEnd() {
    return this.position >= this.tokens.length;
  }

  // Get precedence for operators
  getPrecedence(token) {
    const precedences = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
      '^': 3
    };
    return precedences[token] || 0;
  }

  // Check if token is a binary operator
  isBinaryOperator(token) {
    return ['+', '-', '*', '/', '^'].includes(token);
  }

  // Parse a primary expression (numbers, parentheses)
  parsePrimary() {
    const token = this.next();
    
    if (!token) {
      throw new Error("Unexpected end of input");
    }

    // Handle numbers
    if (token.match(/^\d+(\.\d+)?$/)) {
      return {
        type: "number",
        value: Number(token)
      };
    }

    // Handle parentheses
    if (token === "(") {
      const expr = this.parseExpression(0);
      const closing = this.next();
      if (closing !== ")") {
        throw new Error("Expected closing parenthesis");
      }
      return expr;
    }

    // Handle unary operators
    if (token === "-" || token === "+") {
      const operand = this.parsePrimary();
      return {
        type: "unary",
        operator: token,
        operand: operand
      };
    }

    throw new Error(`Unexpected token: ${token}`);
  }

  // Main expression parsing with precedence
  parseExpression(minPrecedence) {
    let left = this.parsePrimary();

    while (!this.isAtEnd()) {
      const operator = this.peek();
      
      // Break if not a binary operator
      if (!this.isBinaryOperator(operator)) {
        break;
      }
      
      const precedence = this.getPrecedence(operator);

      if (precedence < minPrecedence) {
        break;
      }

      this.next(); // consume operator
      const right = this.parseExpression(precedence + 1);

      left = {
        type: "binary",
        operator: operator,
        left: left,
        right: right
      };
    }

    return left;
  }

  // Main parse method
  parse() {
    if (this.tokens.length === 0) {
      throw new Error("No tokens to parse");
    }
    
    const result = this.parseExpression(0);
    
    if (!this.isAtEnd()) {
      throw new Error(`Unexpected token: ${this.peek()}`);
    }
    
    return result;
  }
}

const parse = (tokens) => {
  const parser = new Parser(tokens);
  return parser.parse();
};

export { parse };