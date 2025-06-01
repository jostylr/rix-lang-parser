// ../zed-ratmath/src/rational.js
class Rational {
  #numerator;
  #denominator;
  static zero = new Rational(0, 1);
  static one = new Rational(1, 1);
  constructor(numerator, denominator = 1n) {
    if (typeof numerator === "string") {
      if (numerator.includes("..")) {
        const mixedParts = numerator.trim().split("..");
        if (mixedParts.length !== 2) {
          throw new Error("Invalid mixed number format. Use 'a..b/c'");
        }
        const wholePart = BigInt(mixedParts[0]);
        const fractionParts = mixedParts[1].split("/");
        if (fractionParts.length !== 2) {
          throw new Error("Invalid fraction in mixed number. Use 'a..b/c'");
        }
        const fracNumerator = BigInt(fractionParts[0]);
        const fracDenominator = BigInt(fractionParts[1]);
        const isNegative = wholePart < 0n;
        const absWhole = isNegative ? -wholePart : wholePart;
        this.#numerator = isNegative ? -(absWhole * fracDenominator + fracNumerator) : wholePart * fracDenominator + fracNumerator;
        this.#denominator = fracDenominator;
      } else {
        const parts = numerator.trim().split("/");
        if (parts.length === 1) {
          this.#numerator = BigInt(parts[0]);
          this.#denominator = BigInt(denominator);
        } else if (parts.length === 2) {
          this.#numerator = BigInt(parts[0]);
          this.#denominator = BigInt(parts[1]);
        } else {
          throw new Error("Invalid rational format. Use 'a/b', 'a', or 'a..b/c'");
        }
      }
    } else {
      this.#numerator = BigInt(numerator);
      this.#denominator = BigInt(denominator);
    }
    if (this.#denominator === 0n) {
      throw new Error("Denominator cannot be zero");
    }
    this.#normalize();
  }
  #normalize() {
    if (this.#denominator < 0n) {
      this.#numerator = -this.#numerator;
      this.#denominator = -this.#denominator;
    }
    if (this.#numerator === 0n) {
      this.#denominator = 1n;
      return;
    }
    const gcd = this.#gcd(this.#numerator < 0n ? -this.#numerator : this.#numerator, this.#denominator);
    this.#numerator = this.#numerator / gcd;
    this.#denominator = this.#denominator / gcd;
  }
  #gcd(a, b) {
    while (b !== 0n) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }
  get numerator() {
    return this.#numerator;
  }
  get denominator() {
    return this.#denominator;
  }
  add(other) {
    const a = this.#numerator;
    const b = this.#denominator;
    const c = other.numerator;
    const d = other.denominator;
    const numerator = a * d + b * c;
    const denominator = b * d;
    return new Rational(numerator, denominator);
  }
  subtract(other) {
    const a = this.#numerator;
    const b = this.#denominator;
    const c = other.numerator;
    const d = other.denominator;
    const numerator = a * d - b * c;
    const denominator = b * d;
    return new Rational(numerator, denominator);
  }
  multiply(other) {
    const a = this.#numerator;
    const b = this.#denominator;
    const c = other.numerator;
    const d = other.denominator;
    const numerator = a * c;
    const denominator = b * d;
    return new Rational(numerator, denominator);
  }
  divide(other) {
    if (other.numerator === 0n) {
      throw new Error("Division by zero");
    }
    const a = this.#numerator;
    const b = this.#denominator;
    const c = other.numerator;
    const d = other.denominator;
    const numerator = a * d;
    const denominator = b * c;
    return new Rational(numerator, denominator);
  }
  negate() {
    return new Rational(-this.#numerator, this.#denominator);
  }
  reciprocal() {
    if (this.#numerator === 0n) {
      throw new Error("Cannot take reciprocal of zero");
    }
    return new Rational(this.#denominator, this.#numerator);
  }
  pow(exponent) {
    const n = BigInt(exponent);
    if (n === 0n) {
      if (this.#numerator === 0n) {
        throw new Error("Zero cannot be raised to the power of zero");
      }
      return new Rational(1);
    }
    if (this.#numerator === 0n && n < 0n) {
      throw new Error("Zero cannot be raised to a negative power");
    }
    if (n < 0n) {
      const reciprocal = this.reciprocal();
      return reciprocal.pow(-n);
    }
    let resultNum = 1n;
    let resultDen = 1n;
    let num = this.#numerator;
    let den = this.#denominator;
    for (let i = n < 0n ? -n : n;i > 0n; i >>= 1n) {
      if (i & 1n) {
        resultNum *= num;
        resultDen *= den;
      }
      num *= num;
      den *= den;
    }
    return new Rational(resultNum, resultDen);
  }
  equals(other) {
    return this.#numerator === other.numerator && this.#denominator === other.denominator;
  }
  compareTo(other) {
    const crossProduct1 = this.#numerator * other.denominator;
    const crossProduct2 = this.#denominator * other.numerator;
    if (crossProduct1 < crossProduct2)
      return -1;
    if (crossProduct1 > crossProduct2)
      return 1;
    return 0;
  }
  lessThan(other) {
    return this.compareTo(other) < 0;
  }
  lessThanOrEqual(other) {
    return this.compareTo(other) <= 0;
  }
  greaterThan(other) {
    return this.compareTo(other) > 0;
  }
  greaterThanOrEqual(other) {
    return this.compareTo(other) >= 0;
  }
  abs() {
    return this.#numerator < 0n ? this.negate() : new Rational(this.#numerator, this.#denominator);
  }
  toString() {
    if (this.#denominator === 1n) {
      return this.#numerator.toString();
    }
    return `${this.#numerator}/${this.#denominator}`;
  }
  toMixedString() {
    if (this.#denominator === 1n || this.#numerator === 0n) {
      return this.#numerator.toString();
    }
    const isNegative = this.#numerator < 0n;
    const absNum = isNegative ? -this.#numerator : this.#numerator;
    const wholePart = absNum / this.#denominator;
    const remainder = absNum % this.#denominator;
    if (remainder === 0n) {
      return isNegative ? `-${wholePart}` : `${wholePart}`;
    }
    if (wholePart === 0n) {
      return isNegative ? `-0..${remainder}/${this.#denominator}` : `0..${remainder}/${this.#denominator}`;
    } else {
      return isNegative ? `-${wholePart}..${remainder}/${this.#denominator}` : `${wholePart}..${remainder}/${this.#denominator}`;
    }
  }
  toNumber() {
    return Number(this.#numerator) / Number(this.#denominator);
  }
  static from(value) {
    if (value instanceof Rational) {
      return new Rational(value.numerator, value.denominator);
    }
    return new Rational(value);
  }
}

// ../zed-ratmath/src/rational-interval.js
class RationalInterval {
  #low;
  #high;
  static zero = Object.freeze(new RationalInterval(Rational.zero, Rational.zero));
  static one = Object.freeze(new RationalInterval(Rational.one, Rational.one));
  static unitInterval = Object.freeze(new RationalInterval(Rational.zero, Rational.one));
  constructor(a, b) {
    const aRational = a instanceof Rational ? a : new Rational(a);
    const bRational = b instanceof Rational ? b : new Rational(b);
    if (aRational.lessThanOrEqual(bRational)) {
      this.#low = aRational;
      this.#high = bRational;
    } else {
      this.#low = bRational;
      this.#high = aRational;
    }
  }
  get low() {
    return this.#low;
  }
  get high() {
    return this.#high;
  }
  add(other) {
    const newLow = this.#low.add(other.low);
    const newHigh = this.#high.add(other.high);
    return new RationalInterval(newLow, newHigh);
  }
  subtract(other) {
    const newLow = this.#low.subtract(other.high);
    const newHigh = this.#high.subtract(other.low);
    return new RationalInterval(newLow, newHigh);
  }
  multiply(other) {
    const products = [
      this.#low.multiply(other.low),
      this.#low.multiply(other.high),
      this.#high.multiply(other.low),
      this.#high.multiply(other.high)
    ];
    let min = products[0];
    let max = products[0];
    for (let i = 1;i < products.length; i++) {
      if (products[i].lessThan(min))
        min = products[i];
      if (products[i].greaterThan(max))
        max = products[i];
    }
    return new RationalInterval(min, max);
  }
  divide(other) {
    const zero = RationalInterval.zero;
    if (other.low.equals(zero) && other.high.equals(zero)) {
      throw new Error("Division by zero");
    }
    if (other.containsZero()) {
      throw new Error("Cannot divide by an interval containing zero");
    }
    const quotients = [
      this.#low.divide(other.low),
      this.#low.divide(other.high),
      this.#high.divide(other.low),
      this.#high.divide(other.high)
    ];
    let min = quotients[0];
    let max = quotients[0];
    for (let i = 1;i < quotients.length; i++) {
      if (quotients[i].lessThan(min))
        min = quotients[i];
      if (quotients[i].greaterThan(max))
        max = quotients[i];
    }
    return new RationalInterval(min, max);
  }
  reciprocate() {
    if (this.containsZero()) {
      throw new Error("Cannot reciprocate an interval containing zero");
    }
    return new RationalInterval(this.#high.reciprocal(), this.#low.reciprocal());
  }
  negate() {
    return new RationalInterval(this.#high.negate(), this.#low.negate());
  }
  pow(exponent) {
    const n = BigInt(exponent);
    const zero = Rational.zero;
    if (n === 0n) {
      if (this.#low.equals(zero) && this.#high.equals(zero)) {
        throw new Error("Zero cannot be raised to the power of zero");
      }
      if (this.containsZero()) {
        throw new Error("Cannot raise an interval containing zero to the power of zero");
      }
      return new RationalInterval(Rational.one, Rational.one);
    }
    if (n < 0n) {
      if (this.containsZero()) {
        throw new Error("Cannot raise an interval containing zero to a negative power");
      }
      const positivePower = this.pow(-n);
      const reciprocal = new RationalInterval(positivePower.high.reciprocal(), positivePower.low.reciprocal());
      return reciprocal;
    }
    if (n === 1n) {
      return new RationalInterval(this.#low, this.#high);
    }
    if (n % 2n === 0n) {
      let minVal;
      let maxVal;
      if (this.#low.lessThanOrEqual(zero) && this.#high.greaterThanOrEqual(zero)) {
        minVal = new Rational(0);
        const lowPow = this.#low.abs().pow(n);
        const highPow = this.#high.abs().pow(n);
        maxVal = lowPow.greaterThan(highPow) ? lowPow : highPow;
      } else if (this.#high.lessThan(zero)) {
        minVal = this.#high.pow(n);
        maxVal = this.#low.pow(n);
      } else {
        minVal = this.#low.pow(n);
        maxVal = this.#high.pow(n);
      }
      return new RationalInterval(minVal, maxVal);
    } else {
      return new RationalInterval(this.#low.pow(n), this.#high.pow(n));
    }
  }
  mpow(exponent) {
    const n = BigInt(exponent);
    const zero = Rational.zero;
    if (n === 0n) {
      throw new Error("Multiplicative exponentiation requires at least one factor");
    }
    if (n < 0n) {
      const recipInterval = this.reciprocate();
      return recipInterval.mpow(-n);
    }
    if (n === 1n) {
      return new RationalInterval(this.#low, this.#high);
    }
    if (n === 1n) {
      return new RationalInterval(this.#low, this.#high);
    }
    let result = new RationalInterval(this.#low, this.#high);
    for (let i = 1n;i < n; i++) {
      result = result.multiply(this);
    }
    return result;
  }
  overlaps(other) {
    return !(this.#high.lessThan(other.low) || other.high.lessThan(this.#low));
  }
  contains(other) {
    return this.#low.lessThanOrEqual(other.low) && this.#high.greaterThanOrEqual(other.high);
  }
  containsValue(value) {
    const r = value instanceof Rational ? value : new Rational(value);
    return this.#low.lessThanOrEqual(r) && this.#high.greaterThanOrEqual(r);
  }
  containsZero() {
    const zero = Rational.zero;
    return this.#low.lessThanOrEqual(zero) && this.#high.greaterThanOrEqual(zero);
  }
  equals(other) {
    return this.#low.equals(other.low) && this.#high.equals(other.high);
  }
  intersection(other) {
    if (!this.overlaps(other)) {
      return null;
    }
    const newLow = this.#low.greaterThan(other.low) ? this.#low : other.low;
    const newHigh = this.#high.lessThan(other.high) ? this.#high : other.high;
    return new RationalInterval(newLow, newHigh);
  }
  union(other) {
    const oneLow = new Rational(1);
    const adjacentRight = this.#high.add(oneLow).equals(other.low);
    const adjacentLeft = other.high.add(oneLow).equals(this.#low);
    if (!this.overlaps(other) && !adjacentRight && !adjacentLeft) {
      return null;
    }
    const newLow = this.#low.lessThan(other.low) ? this.#low : other.low;
    const newHigh = this.#high.greaterThan(other.high) ? this.#high : other.high;
    return new RationalInterval(newLow, newHigh);
  }
  toString() {
    return `${this.#low.toString()}:${this.#high.toString()}`;
  }
  toMixedString() {
    return `${this.#low.toMixedString()}:${this.#high.toMixedString()}`;
  }
  static point(value) {
    let r;
    if (value instanceof Rational) {
      r = value;
    } else if (typeof value === "number") {
      r = new Rational(String(value));
    } else if (typeof value === "string" || typeof value === "bigint") {
      r = new Rational(value);
    } else {
      r = new Rational(0);
    }
    return new RationalInterval(r, r);
  }
  static fromString(str) {
    const parts = str.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid interval format. Use 'a:b'");
    }
    return new RationalInterval(parts[0], parts[1]);
  }
}

// ../zed-ratmath/src/parser.js
class Parser {
  static parse(expression) {
    if (!expression || expression.trim() === "") {
      throw new Error("Expression cannot be empty");
    }
    expression = expression.replace(/\s+/g, "");
    const result = Parser.#parseExpression(expression);
    if (result.remainingExpr.length > 0) {
      throw new Error(`Unexpected token at end: ${result.remainingExpr}`);
    }
    return result.value;
  }
  static #parseExpression(expr) {
    let result = Parser.#parseTerm(expr);
    let currentExpr = result.remainingExpr;
    while (currentExpr.length > 0 && (currentExpr[0] === "+" || currentExpr[0] === "-")) {
      const operator = currentExpr[0];
      currentExpr = currentExpr.substring(1);
      const termResult = Parser.#parseTerm(currentExpr);
      currentExpr = termResult.remainingExpr;
      if (operator === "+") {
        result.value = result.value.add(termResult.value);
      } else {
        result.value = result.value.subtract(termResult.value);
      }
    }
    return { value: result.value, remainingExpr: currentExpr };
  }
  static #parseTerm(expr) {
    let result = Parser.#parseFactor(expr);
    let currentExpr = result.remainingExpr;
    while (currentExpr.length > 0 && (currentExpr[0] === "*" || currentExpr[0] === "/")) {
      const operator = currentExpr[0];
      currentExpr = currentExpr.substring(1);
      const factorResult = Parser.#parseFactor(currentExpr);
      currentExpr = factorResult.remainingExpr;
      if (operator === "*") {
        result.value = result.value.multiply(factorResult.value);
      } else {
        result.value = result.value.divide(factorResult.value);
      }
    }
    return { value: result.value, remainingExpr: currentExpr };
  }
  static #parseFactor(expr) {
    if (expr.length === 0) {
      throw new Error("Unexpected end of expression");
    }
    if (expr[0] === "(") {
      const subExprResult = Parser.#parseExpression(expr.substring(1));
      if (subExprResult.remainingExpr.length === 0 || subExprResult.remainingExpr[0] !== ")") {
        throw new Error("Missing closing parenthesis");
      }
      const result = {
        value: subExprResult.value,
        remainingExpr: subExprResult.remainingExpr.substring(1)
      };
      if (result.remainingExpr.length > 0) {
        if (result.remainingExpr[0] === "^") {
          const powerExpr = result.remainingExpr.substring(1);
          const powerResult = Parser.#parseExponent(powerExpr);
          const zero = new Rational(0);
          if (result.value.low.equals(zero) && result.value.high.equals(zero) && powerResult.value === 0n) {
            throw new Error("Zero cannot be raised to the power of zero");
          }
          return {
            value: result.value.pow(powerResult.value),
            remainingExpr: powerResult.remainingExpr
          };
        } else if (result.remainingExpr.length > 1 && result.remainingExpr[0] === "*" && result.remainingExpr[1] === "*") {
          const powerExpr = result.remainingExpr.substring(2);
          const powerResult = Parser.#parseExponent(powerExpr);
          return {
            value: result.value.mpow(powerResult.value),
            remainingExpr: powerResult.remainingExpr
          };
        }
      }
      return result;
    }
    if (expr[0] === "-") {
      const factorResult = Parser.#parseFactor(expr.substring(1));
      const negOne = new Rational(-1);
      const negInterval = RationalInterval.point(negOne);
      return {
        value: negInterval.multiply(factorResult.value),
        remainingExpr: factorResult.remainingExpr
      };
    }
    const intervalResult = Parser.#parseInterval(expr);
    if (intervalResult.remainingExpr.length > 0) {
      if (intervalResult.remainingExpr[0] === "^") {
        const powerExpr = intervalResult.remainingExpr.substring(1);
        const powerResult = Parser.#parseExponent(powerExpr);
        const zero = new Rational(0);
        if (intervalResult.value.low.equals(zero) && intervalResult.value.high.equals(zero) && powerResult.value === 0n) {
          throw new Error("Zero cannot be raised to the power of zero");
        }
        const result = intervalResult.value.pow(powerResult.value);
        return {
          value: result,
          remainingExpr: powerResult.remainingExpr
        };
      } else if (intervalResult.remainingExpr.length > 1 && intervalResult.remainingExpr[0] === "*" && intervalResult.remainingExpr[1] === "*") {
        const powerExpr = intervalResult.remainingExpr.substring(2);
        const powerResult = Parser.#parseExponent(powerExpr);
        const result = intervalResult.value.mpow(powerResult.value);
        return {
          value: result,
          remainingExpr: powerResult.remainingExpr
        };
      }
    }
    return intervalResult;
  }
  static #parseExponent(expr) {
    let i = 0;
    let isNegative = false;
    if (expr.length > 0 && expr[0] === "-") {
      isNegative = true;
      i++;
    }
    let exponentStr = "";
    while (i < expr.length && /\d/.test(expr[i])) {
      exponentStr += expr[i];
      i++;
    }
    if (exponentStr.length === 0) {
      throw new Error("Invalid exponent");
    }
    const exponent = isNegative ? -BigInt(exponentStr) : BigInt(exponentStr);
    return {
      value: exponent,
      remainingExpr: expr.substring(i)
    };
  }
  static #parseInterval(expr) {
    const firstResult = Parser.#parseRational(expr);
    if (firstResult.remainingExpr.length === 0 || firstResult.remainingExpr[0] !== ":") {
      const pointValue = RationalInterval.point(firstResult.value);
      return {
        value: pointValue,
        remainingExpr: firstResult.remainingExpr
      };
    }
    const secondResult = Parser.#parseRational(firstResult.remainingExpr.substring(1));
    return {
      value: new RationalInterval(firstResult.value, secondResult.value),
      remainingExpr: secondResult.remainingExpr
    };
  }
  static #parseRational(expr) {
    if (expr.length === 0) {
      throw new Error("Unexpected end of expression");
    }
    let i = 0;
    let numeratorStr = "";
    let denominatorStr = "";
    let isNegative = false;
    let wholePart = 0n;
    let hasMixedForm = false;
    if (expr[i] === "-") {
      isNegative = true;
      i++;
    }
    while (i < expr.length && /\d/.test(expr[i])) {
      numeratorStr += expr[i];
      i++;
    }
    if (numeratorStr.length === 0) {
      throw new Error("Invalid rational number format");
    }
    if (i + 1 < expr.length && expr[i] === "." && expr[i + 1] === ".") {
      hasMixedForm = true;
      wholePart = isNegative ? -BigInt(numeratorStr) : BigInt(numeratorStr);
      isNegative = false;
      i += 2;
      numeratorStr = "";
      while (i < expr.length && /\d/.test(expr[i])) {
        numeratorStr += expr[i];
        i++;
      }
      if (numeratorStr.length === 0) {
        throw new Error('Invalid mixed number format: missing numerator after ".."');
      }
    }
    if (i < expr.length && expr[i] === "/") {
      i++;
      while (i < expr.length && /\d/.test(expr[i])) {
        denominatorStr += expr[i];
        i++;
      }
      if (denominatorStr.length === 0) {
        throw new Error("Invalid rational number format");
      }
    } else {
      if (hasMixedForm) {
        throw new Error("Invalid mixed number format: missing denominator");
      }
      denominatorStr = "1";
    }
    let numerator, denominator;
    if (hasMixedForm) {
      numerator = BigInt(numeratorStr);
      denominator = BigInt(denominatorStr);
      const sign = wholePart < 0n ? -1n : 1n;
      numerator = sign * ((wholePart.valueOf() < 0n ? -wholePart : wholePart) * denominator + numerator);
    } else {
      numerator = isNegative ? -BigInt(numeratorStr) : BigInt(numeratorStr);
      denominator = BigInt(denominatorStr);
    }
    if (denominator === 0n) {
      throw new Error("Denominator cannot be zero");
    }
    return {
      value: new Rational(numerator, denominator),
      remainingExpr: expr.substring(i)
    };
  }
}

// ../zed-ratmath/src/fraction.js
class Fraction {
  #numerator;
  #denominator;
  constructor(numerator, denominator = 1n) {
    if (typeof numerator === "string") {
      const parts = numerator.trim().split("/");
      if (parts.length === 1) {
        this.#numerator = BigInt(parts[0]);
        this.#denominator = BigInt(denominator);
      } else if (parts.length === 2) {
        this.#numerator = BigInt(parts[0]);
        this.#denominator = BigInt(parts[1]);
      } else {
        throw new Error("Invalid fraction format. Use 'a/b' or 'a'");
      }
    } else {
      this.#numerator = BigInt(numerator);
      this.#denominator = BigInt(denominator);
    }
    if (this.#denominator === 0n) {
      throw new Error("Denominator cannot be zero");
    }
  }
  get numerator() {
    return this.#numerator;
  }
  get denominator() {
    return this.#denominator;
  }
  add(other) {
    if (this.#denominator !== other.denominator) {
      throw new Error("Addition only supported for equal denominators");
    }
    return new Fraction(this.#numerator + other.numerator, this.#denominator);
  }
  subtract(other) {
    if (this.#denominator !== other.denominator) {
      throw new Error("Subtraction only supported for equal denominators");
    }
    return new Fraction(this.#numerator - other.numerator, this.#denominator);
  }
  multiply(other) {
    return new Fraction(this.#numerator * other.numerator, this.#denominator * other.denominator);
  }
  divide(other) {
    if (other.numerator === 0n) {
      throw new Error("Division by zero");
    }
    return new Fraction(this.#numerator * other.denominator, this.#denominator * other.numerator);
  }
  pow(exponent) {
    const n = BigInt(exponent);
    if (n === 0n) {
      if (this.#numerator === 0n) {
        throw new Error("Zero cannot be raised to the power of zero");
      }
      return new Fraction(1, 1);
    }
    if (this.#numerator === 0n && n < 0n) {
      throw new Error("Zero cannot be raised to a negative power");
    }
    if (n < 0n) {
      return new Fraction(this.#denominator ** -n, this.#numerator ** -n);
    }
    return new Fraction(this.#numerator ** n, this.#denominator ** n);
  }
  scale(factor) {
    const scaleFactor = BigInt(factor);
    return new Fraction(this.#numerator * scaleFactor, this.#denominator * scaleFactor);
  }
  static #gcd(a, b) {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b !== 0n) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }
  reduce() {
    if (this.#numerator === 0n) {
      return new Fraction(0, 1);
    }
    const gcd = Fraction.#gcd(this.#numerator, this.#denominator);
    const reducedNum = this.#numerator / gcd;
    const reducedDen = this.#denominator / gcd;
    if (reducedDen < 0n) {
      return new Fraction(-reducedNum, -reducedDen);
    }
    return new Fraction(reducedNum, reducedDen);
  }
  static mediant(a, b) {
    return new Fraction(a.numerator + b.numerator, a.denominator + b.denominator);
  }
  toRational() {
    return new Rational(this.#numerator, this.#denominator);
  }
  static fromRational(rational) {
    return new Fraction(rational.numerator, rational.denominator);
  }
  toString() {
    if (this.#denominator === 1n) {
      return this.#numerator.toString();
    }
    return `${this.#numerator}/${this.#denominator}`;
  }
  equals(other) {
    return this.#numerator === other.numerator && this.#denominator === other.denominator;
  }
  lessThan(other) {
    const leftSide = this.#numerator * other.denominator;
    const rightSide = this.#denominator * other.numerator;
    return leftSide < rightSide;
  }
  lessThanOrEqual(other) {
    const leftSide = this.#numerator * other.denominator;
    const rightSide = this.#denominator * other.numerator;
    return leftSide <= rightSide;
  }
  greaterThan(other) {
    const leftSide = this.#numerator * other.denominator;
    const rightSide = this.#denominator * other.numerator;
    return leftSide > rightSide;
  }
  greaterThanOrEqual(other) {
    const leftSide = this.#numerator * other.denominator;
    const rightSide = this.#denominator * other.numerator;
    return leftSide >= rightSide;
  }
}

// ../zed-ratmath/src/fraction-interval.js
class FractionInterval {
  #low;
  #high;
  constructor(a, b) {
    if (!(a instanceof Fraction) || !(b instanceof Fraction)) {
      throw new Error("FractionInterval endpoints must be Fraction objects");
    }
    if (a.lessThanOrEqual(b)) {
      this.#low = a;
      this.#high = b;
    } else {
      this.#low = b;
      this.#high = a;
    }
  }
  get low() {
    return this.#low;
  }
  get high() {
    return this.#high;
  }
  mediantSplit() {
    const mediant = Fraction.mediant(this.#low, this.#high);
    return [
      new FractionInterval(this.#low, mediant),
      new FractionInterval(mediant, this.#high)
    ];
  }
  partitionWithMediants(n = 1) {
    if (n < 0) {
      throw new Error("Depth of mediant partitioning must be non-negative");
    }
    if (n === 0) {
      return [this];
    }
    let intervals = [this];
    for (let level = 0;level < n; level++) {
      const newIntervals = [];
      for (const interval of intervals) {
        const splitIntervals = interval.mediantSplit();
        newIntervals.push(...splitIntervals);
      }
      intervals = newIntervals;
    }
    return intervals;
  }
  partitionWith(fn) {
    const partitionPoints = fn(this.#low, this.#high);
    if (!Array.isArray(partitionPoints)) {
      throw new Error("Partition function must return an array of Fractions");
    }
    for (const point of partitionPoints) {
      if (!(point instanceof Fraction)) {
        throw new Error("Partition function must return Fraction objects");
      }
    }
    const allPoints = [this.#low, ...partitionPoints, this.#high];
    allPoints.sort((a, b) => {
      if (a.equals(b))
        return 0;
      if (a.lessThan(b))
        return -1;
      return 1;
    });
    if (!allPoints[0].equals(this.#low) || !allPoints[allPoints.length - 1].equals(this.#high)) {
      throw new Error("Partition points should be within the interval");
    }
    const uniquePoints = [];
    for (let i = 0;i < allPoints.length; i++) {
      if (i === 0 || !allPoints[i].equals(allPoints[i - 1])) {
        uniquePoints.push(allPoints[i]);
      }
    }
    const intervals = [];
    for (let i = 0;i < uniquePoints.length - 1; i++) {
      intervals.push(new FractionInterval(uniquePoints[i], uniquePoints[i + 1]));
    }
    return intervals;
  }
  toRationalInterval() {
    return new RationalInterval(this.#low.toRational(), this.#high.toRational());
  }
  static fromRationalInterval(interval) {
    return new FractionInterval(Fraction.fromRational(interval.low), Fraction.fromRational(interval.high));
  }
  toString() {
    return `${this.#low.toString()}:${this.#high.toString()}`;
  }
  equals(other) {
    return this.#low.equals(other.low) && this.#high.equals(other.high);
  }
}

// src/evaluate.js
var evaluate = (ast) => {
  console.log("AST:", ast);
  let result;
  if (ast.type === "number") {
    result = ast.value;
  } else if (ast.type === "binary") {
    const left = evaluate(ast.left);
    const right = evaluate(ast.right);
    switch (ast.operator) {
      case "+":
        result = left + right;
        break;
      case "-":
        result = left - right;
        break;
      case "*":
        result = left * right;
        break;
      case "/":
        result = left / right;
        break;
    }
  } else if (ast.type === "parenthesis") {
    result = evaluate(ast.content);
  } else {
    throw new Error(`Unknown AST node type: ${ast.type}`);
  }
  console.log("Result:", result);
  return result;
};

// src/parser.js
class Parser2 {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }
  peek() {
    return this.position < this.tokens.length ? this.tokens[this.position] : null;
  }
  next() {
    return this.position < this.tokens.length ? this.tokens[this.position++] : null;
  }
  isAtEnd() {
    return this.position >= this.tokens.length;
  }
  getPrecedence(token) {
    const precedences = {
      "+": 1,
      "-": 1,
      "*": 2,
      "/": 2,
      "^": 3
    };
    return precedences[token] || 0;
  }
  isBinaryOperator(token) {
    return ["+", "-", "*", "/", "^"].includes(token);
  }
  parsePrimary() {
    const token = this.next();
    if (!token) {
      throw new Error("Unexpected end of input");
    }
    if (token.match(/^\d+(\.\d+)?$/)) {
      return {
        type: "number",
        value: Number(token)
      };
    }
    if (token === "(") {
      const expr = this.parseExpression(0);
      const closing = this.next();
      if (closing !== ")") {
        throw new Error("Expected closing parenthesis");
      }
      return expr;
    }
    if (token === "-" || token === "+") {
      const operand = this.parsePrimary();
      return {
        type: "unary",
        operator: token,
        operand
      };
    }
    throw new Error(`Unexpected token: ${token}`);
  }
  parseExpression(minPrecedence) {
    let left = this.parsePrimary();
    while (!this.isAtEnd()) {
      const operator = this.peek();
      if (!this.isBinaryOperator(operator)) {
        break;
      }
      const precedence = this.getPrecedence(operator);
      if (precedence < minPrecedence) {
        break;
      }
      this.next();
      const right = this.parseExpression(precedence + 1);
      left = {
        type: "binary",
        operator,
        left,
        right
      };
    }
    return left;
  }
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
var parse = (tokens) => {
  const parser = new Parser2(tokens);
  return parser.parse();
};

// src/tokenizer.js
var tokenize = (str) => {
  const tokens = str.split(/\s+/);
  console.log(tokens);
  return tokens;
};
export {
  tokenize,
  parse,
  evaluate
};
