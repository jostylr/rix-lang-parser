import {
  Rational,
  RationalInterval,
  Fraction,
  FractionInterval,
} from "ratmath";

const evaluate = (ast) => {
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

export { evaluate };
