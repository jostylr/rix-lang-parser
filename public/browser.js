console.log("hi");
import { evaluate, parse, tokenize } from "./index.js";
console.log(evaluate);
const inputBox = document.getElementById("input-box");
const replArea = document.getElementById("repl-area");
const runBtn = document.getElementById("run-btn");
const exitBtn = document.getElementById("exit-btn");
const saveBlock = document.getElementById("save-block");
const sessionCode = document.getElementById("session-code");
const copyBtn = document.getElementById("copy-btn");

let globalEnv = {};
let history = [];

function printToRepl(txt, className = "") {
  const line = document.createElement("div");
  if (className) line.className = className;
  line.innerText = txt;
  replArea.appendChild(line);
  replArea.scrollTop = replArea.scrollHeight;
}

function handleCommand(cmd) {
  if (cmd === ".help") {
    printToRepl(
      "Available commands:\n  .help    Show this message\n  .save    Output transcript for copy\n  .exit    Hide input (refresh to restart)",
      "cmd",
    );
  } else if (cmd === ".exit") {
    inputBox.disabled = true;
    runBtn.disabled = true;
    exitBtn.disabled = true;
    printToRepl("Session ended. (refresh to restart)", "cmd");
  } else if (cmd === ".save") {
    const code = history
      .map(([inp, out]) => `> ${inp}\n${out !== undefined ? out : ""}`)
      .join("\n");
    sessionCode.innerText = code;
    saveBlock.style.display = "block";
    printToRepl("Session transcript ready for copy below.", "cmd");
  } else {
    printToRepl("Unknown command: " + cmd, "err");
  }
}

function runInput() {
  let src = inputBox.value.trim();
  if (!src) return;
  printToRepl("> " + src, "cmd");

  // Command handler
  if (src.startsWith(".")) {
    handleCommand(src);
    history.push([src, ""]);
    inputBox.value = "";
    return;
  }

  try {
    // Call your real language functions here!
    const tokens = tokenize(src);
    const ast = parse(tokens);
    const result = evaluate(ast, globalEnv);
    printToRepl(String(result), "result");
    history.push([src, String(result)]);
  } catch (e) {
    printToRepl("Error: " + (e.message || e), "err");
    history.push([src, "Error: " + (e.message || e)]);
  }
  inputBox.value = "";
}

// --- Keyboard/command handling ---
runBtn.onclick = runInput;
inputBox.addEventListener("keydown", function (e) {
  // Cmd+Enter or Ctrl+Enter: add new line
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    const start = inputBox.selectionStart;
    const end = inputBox.selectionEnd;
    inputBox.value =
      inputBox.value.substring(0, start) + "\n" + inputBox.value.substring(end);
    inputBox.selectionStart = inputBox.selectionEnd = start + 1;
  }
  // Enter alone: run
  else if (
    e.key === "Enter" &&
    !e.shiftKey &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.altKey
  ) {
    console.log("Running input...");
    e.preventDefault();
    runInput();
  }
});

exitBtn.onclick = () => handleCommand(".exit");
copyBtn.onclick = () => {
  navigator.clipboard.writeText(sessionCode.innerText);
  copyBtn.innerText = "Copied!";
  setTimeout(() => (copyBtn.innerText = "Copy to Clipboard"), 1500);
};

// Welcome/help
printToRepl(
  "MathLang Browser REPL\nType .help for help. (Use Ctrl+Enter or Cmd+Enter for newlines in input)",
);
