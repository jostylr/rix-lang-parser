import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { evaluate, parse, tokenize } from "./index.js";

const rl = readline.createInterface({ input, output });
let globalEnv = {}; // persistent environment

console.log("Welcome to your MathLang REPL. Type .help for help.");

async function repl() {
  let buffer = "";

  while (true) {
    const promptStr = buffer === "" ? "> " : "... ";
    const line = await rl.question(promptStr);

    if (line === null) break; // EOF

    // Command handler (lines starting with .)
    if (buffer === "" && line.trim().startsWith(".")) {
      handleCommand(line.trim());
      continue;
    }

    // Multiline support: if line ends with '\', keep reading
    if (line.endsWith("\\")) {
      buffer += line.slice(0, -1) + "\n"; // strip '\' and add newline
      continue;
    } else {
      buffer += line;
    }

    // Now try to tokenize, parse, evaluate
    try {
      const tokens = tokenize(buffer);
      const ast = parse(tokens);
      const result = evaluate(ast, globalEnv);
      if (result !== undefined) console.log(result);
    } catch (e) {
      console.error("Error:", e.message || e);
    }

    buffer = ""; // Reset buffer for next input
  }

  rl.close();
}

function handleCommand(cmd) {
  if (cmd === ".help") {
    console.log(`Available commands:
  .help     Show this help message
  .exit     Exit the REPL
  Multiline input: end a line with '\\' to continue to the next line.
`);
  } else if (cmd === ".exit") {
    console.log("Bye!");
    process.exit(0);
  } else {
    console.log("Unknown command:", cmd);
  }
}

repl();
