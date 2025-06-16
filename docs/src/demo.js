import { parse, tokenize } from '../../index.js';

// DOM Elements
const inputExpression = document.getElementById('input-expression');
const parseButton = document.getElementById('parse-button');
const astTree = document.getElementById('ast-tree');
const tokensList = document.getElementById('tokens-list');
const rawOutput = document.getElementById('raw-output');
const diagnosticsContent = document.getElementById('diagnostics-content');
const expandAllButton = document.getElementById('expand-all');
const collapseAllButton = document.getElementById('collapse-all');
const nodeModal = document.getElementById('node-modal');
const modalTitle = document.getElementById('modal-title');
const modalContent = document.getElementById('modal-content');
const modalCloseButton = document.getElementById('modal-close');
const closeButton = document.querySelector('.close-button');

// Tab functionality
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');

        // Update active states
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));

        button.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
});

// Parse button functionality
parseButton.addEventListener('click', parseExpression);
inputExpression.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        parseExpression();
    }
});

function parseExpression() {
    const expression = inputExpression.value.trim();
    if (!expression) {
        showPlaceholder();
        return;
    }

    try {
        // Tokenize first
        const tokens = tokenize(expression);
        displayTokens(tokens);

        // Parse to AST
        const ast = parse(expression);
        displayAST(ast);
        displayRaw(ast);

        // Clear diagnostics if successful
        displayDiagnostics([]);
    } catch (error) {
        // Display error
        displayError(error);
    }
}

function displayTokens(tokens) {
    tokensList.innerHTML = '';

    tokens.forEach(token => {
        const tokenElement = document.createElement('div');
        tokenElement.className = 'token-item';
        tokenElement.innerHTML = `
            <span class="token-type">${token.type}</span>
            <span class="token-value">${escapeHtml(token.value)}</span>
        `;
        tokensList.appendChild(tokenElement);
    });
}

function displayAST(ast) {
    astTree.innerHTML = '';
    const rootNode = createTreeNode(ast, 'Program');
    astTree.appendChild(rootNode);
}

function createTreeNode(node, nodeName = null) {
    const treeNode = document.createElement('div');
    treeNode.className = 'tree-node';

    const header = document.createElement('div');
    header.className = 'node-header';

    const toggle = document.createElement('span');
    toggle.className = 'node-toggle';

    const hasChildren = node && typeof node === 'object' &&
                       (Array.isArray(node) ? node.length > 0 : Object.keys(node).length > 0);

    toggle.textContent = hasChildren ? '▶' : '○';
    header.appendChild(toggle);

    const nodeType = document.createElement('span');
    nodeType.className = 'node-type';
    nodeType.textContent = nodeName || node.type || 'Node';
    header.appendChild(nodeType);

    // Add value or preview
    if (node && typeof node !== 'object') {
        const nodeValue = document.createElement('span');
        nodeValue.className = 'node-value';
        nodeValue.textContent = String(node);
        header.appendChild(nodeValue);
    } else if (node && node.value !== undefined) {
        const nodeValue = document.createElement('span');
        nodeValue.className = 'node-value';
        nodeValue.textContent = String(node.value);
        header.appendChild(nodeValue);
    }

    // Add preview for complex nodes
    if (hasChildren) {
        const preview = document.createElement('span');
        preview.className = 'node-preview';
        preview.textContent = getNodePreview(node);
        header.appendChild(preview);
    }

    treeNode.appendChild(header);

    // Add children container
    if (hasChildren) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'node-children';

        if (Array.isArray(node)) {
            node.forEach((child, index) => {
                childrenContainer.appendChild(createTreeNode(child, `[${index}]`));
            });
        } else {
            Object.entries(node).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    childrenContainer.appendChild(createTreeNode(value, key));
                }
            });
        }

        treeNode.appendChild(childrenContainer);

        // Toggle functionality
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            if (childrenContainer.classList.contains('expanded')) {
                childrenContainer.classList.remove('expanded');
                toggle.textContent = '▶';
            } else {
                childrenContainer.classList.add('expanded');
                toggle.textContent = '▼';
            }
        });

        // Double click to show modal
        header.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            showNodeModal(node, nodeName || node.type || 'Node');
        });
    }

    return treeNode;
}

function getNodePreview(node) {
    if (Array.isArray(node)) {
        return `[${node.length} items]`;
    }

    const keys = Object.keys(node).filter(k => k !== 'type' && node[k] !== null);
    if (keys.length === 0) return '';

    const preview = keys.slice(0, 3).map(k => {
        const value = node[k];
        if (value === null || value === undefined) return null;
        if (typeof value === 'object') {
            return `${k}: {...}`;
        }
        return `${k}: ${String(value).slice(0, 20)}`;
    }).filter(Boolean).join(', ');

    return `{${preview}${keys.length > 3 ? ', ...' : ''}}`;
}

function displayRaw(ast) {
    rawOutput.textContent = JSON.stringify(ast, null, 2);
}

function displayDiagnostics(diagnostics) {
    if (!diagnostics || diagnostics.length === 0) {
        diagnosticsContent.innerHTML = '<p class="placeholder">No errors or warnings</p>';
        return;
    }

    diagnosticsContent.innerHTML = '';
    diagnostics.forEach(diagnostic => {
        const item = document.createElement('div');
        item.className = `diagnostic-item ${diagnostic.severity}`;
        item.innerHTML = `
            <div>${escapeHtml(diagnostic.message)}</div>
            ${diagnostic.location ? `<div class="diagnostic-location">Line ${diagnostic.location.line}, Column ${diagnostic.location.column}</div>` : ''}
        `;
        diagnosticsContent.appendChild(item);
    });
}

function displayError(error) {
    // Display in all tabs
    astTree.innerHTML = `<div class="diagnostic-item error">${escapeHtml(error.message)}</div>`;
    tokensList.innerHTML = `<div class="diagnostic-item error">${escapeHtml(error.message)}</div>`;
    rawOutput.textContent = error.stack || error.message;

    // Display in diagnostics
    displayDiagnostics([{
        severity: 'error',
        message: error.message,
        location: error.location
    }]);
}

function showPlaceholder() {
    astTree.innerHTML = '<p class="placeholder">Parse an expression to see the AST</p>';
    tokensList.innerHTML = '<p class="placeholder">Parse an expression to see tokens</p>';
    rawOutput.textContent = 'Parse an expression to see raw output';
    diagnosticsContent.innerHTML = '<p class="placeholder">No errors or warnings</p>';
}

// Expand/Collapse all functionality
expandAllButton.addEventListener('click', () => {
    document.querySelectorAll('.node-children').forEach(children => {
        children.classList.add('expanded');
        const toggle = children.previousElementSibling.querySelector('.node-toggle');
        if (toggle.textContent === '▶') {
            toggle.textContent = '▼';
        }
    });
});

collapseAllButton.addEventListener('click', () => {
    document.querySelectorAll('.node-children').forEach(children => {
        children.classList.remove('expanded');
        const toggle = children.previousElementSibling.querySelector('.node-toggle');
        if (toggle.textContent === '▼') {
            toggle.textContent = '▶';
        }
    });
});

// Modal functionality
function showNodeModal(node, title) {
    modalTitle.textContent = title;
    modalContent.textContent = JSON.stringify(node, null, 2);
    nodeModal.classList.add('show');
}

function closeModal() {
    nodeModal.classList.remove('show');
}

modalCloseButton.addEventListener('click', closeModal);
closeButton.addEventListener('click', closeModal);
nodeModal.addEventListener('click', (e) => {
    if (e.target === nodeModal) {
        closeModal();
    }
});

// Utility function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Parse initial expression if provided
if (inputExpression.value.trim()) {
    parseExpression();
}
