// --------------------------------------------------------------------------
// DOM Element and Data Initialization
// --------------------------------------------------------------------------

// Map to store box elements, with their ID as keys and an object
// containing the box element and a Map of connected lines as values.
let boxes = new Map();

// Array, currently not used for any specific functionality.
let bin = [];

// Counter for the total number of boxes created. Used to assign unique IDs.
let totalBoxes = 1;

// Track auxiliary UI state such as the canvas grid visibility.
let isGridActive = false;
let isDictating = false;
let dictationRecognition = null;
let dictationTarget = null;
const AI_PREFS_STORAGE_KEY = 'treenotes-ai-preferences';
const DICTATION_PREFS_STORAGE_KEY = 'treenotes-dictation-preferences';
const UI_LANGUAGE_STORAGE_KEY = 'treenotes-ui-language';

// Get the first DOM element with the class "box". This is likely the initial box.
const seed = document.querySelectorAll(".box")[0];
ensureBoxFooter(seed);

// --------------------------------------------------------------------------
// Event Listeners Attached on Initialization
// --------------------------------------------------------------------------

// Attach a listener to the seed box to handle pasting images directly into it.
listenForImagePaste(seed);

// Make the initial seed box draggable using the makeDraggable function.
makeDraggable(seed);

// Attach event listeners to the buttons within the box toolbar.
boxToolbarListeners();

// --------------------------------------------------------------------------
// Initialization of the 'boxes' Map with the Seed Box
// --------------------------------------------------------------------------

// Add the seed box to the 'boxes' Map. The key is the box's ID,
// and the value is an object containing the box element itself and an empty
// Map to store the IDs of the lines connected to this box.
boxes.set(seed.id, {
    box: seed,
    lines: []
});
setupBoxPlaceholder(seed);

// --------------------------------------------------------------------------
// Zoom Functionality
// --------------------------------------------------------------------------

/**
 * Zooms the canvas in or out by multiplying the current scale.
 * @param {number} times - The factor by which to zoom (e.g., 2 for 2x zoom, 0.5 for 0.5x zoom).
 */
function zoom(times) {
    const canvas = document.getElementById("zoom");
    if (!canvas) return;

    const transform = canvas.style.transform || "matrix(1, 0, 0, 1, 0, 0)";
    const matrix = new DOMMatrix(transform);
    const scale = matrix.a || 1;

    canvas.style.transform = `scale(${scale * times})`;
}

// --------------------------------------------------------------------------
// Drag and Drop Functionality for Boxes
// --------------------------------------------------------------------------

/**
 * Makes a given HTML element draggable.
 * Uses closures to maintain event listener variables without global scope.
 * @param {HTMLElement} box - The HTML element to make draggable.
 */
function makeDraggable(box) {
    let isDragging = false;
    let offsetX, offsetY;

    // Update the SVG link endpoints whenever the box loses focus — its height
    // may have changed because the user just typed into it. We deliberately
    // do NOT collapse the height here (the previous "height = 7px" on blur
    // hid most of the content and made boxes look broken).
    box.addEventListener("blur", () => {
        updateLinesPosition(box);
    });

    // Event listener for when the box is clicked.
    // Shows the toolbar associated with the clicked box.
    box.addEventListener("click", () => {
        const toolbar = document.getElementById('toolbar');
        const rect = box.getBoundingClientRect();
        toolbar.style.left = rect.right + 'px';
        toolbar.style.top = rect.top + 'px';
        const colorPicker = document.getElementById("boxColor");
        const textColorPicker = document.getElementById("boxTextColor");
        const computedStyle = getComputedStyle(box);
        colorPicker.value = colorToHex(box.style.backgroundColor || computedStyle.backgroundColor);
        textColorPicker.value = colorToHex(box.style.color || computedStyle.color);
        toolbar.style.display = 'flex';
        document.getElementById("toolbar").dataset.boxId = box.id;
    });

    box.addEventListener("input", () => {
        syncBoxPlaceholderState(box);
        updateLinesPosition(box);
    });

    // Event listener for when the mouse button is pressed down on the box.
    // Initiates the dragging process.
    box.addEventListener("mousedown", (e) => {
        if (e.target.closest('#toolbar')) return;
        isDragging = true;
        offsetX = e.clientX - box.offsetLeft;
        offsetY = e.clientY - box.offsetTop;
        box.style.cursor = "grabbing";
    });

    // Event listener for mouse movement across the window.
    // Handles the actual dragging of the box and updates line positions.
    window.addEventListener("mousemove", (e) => {
        const container = document.getElementById("tree");
        const limitReached = container.offsetLeft > e.clientX || container.offsetTop > e.clientY;
        if (!isDragging || limitReached) return;
        box.style.left = e.clientX - offsetX + "px";
        box.style.top = e.clientY - offsetY + "px";
        updateLinesPosition(box);
    });

    // Event listener for when the mouse button is released over the window.
    // Ends the dragging process.
    window.addEventListener("mouseup", () => {
        isDragging = false;
        box.style.cursor = "grab";
    });
}

// --------------------------------------------------------------------------
// Box Creation and Management
// --------------------------------------------------------------------------

function addBlock(box) {
    const [x1, y1] = getBoxCoords(box);
    const newBox = createNewBlock(x1, y1);
    newLine(box, newBox);
}

/**
 * Creates a new draggable block (div element) and appends it to the "boxes" container.
 * @param {number} [x=0] - The initial x-coordinate (left position) of the new box.
 * @param {number} [y=20] - The initial y-coordinate (top position) of the new box.
 * @param {string} [content="New Box"] - The placeholder or initial text content of the new box.
 * @param {{id?: string|number, contentIsPlaceholder?: boolean, placeholder?: string}} [options={}] - Optional metadata.
 * @returns {HTMLElement} The newly created box element.
 */
function createNewBlock(x = 0, y = 20, content = "New Box", options = {}) {
    const { id: requestedId = null, contentIsPlaceholder = true, placeholder = "Seed" } = options;
    const newBox = document.createElement('div');
    const resolvedId = requestedId !== null ? String(requestedId) : String(++totalBoxes);

    totalBoxes = Math.max(totalBoxes, Number(resolvedId));

    newBox.id = resolvedId;
    newBox.className = "box";
    newBox.style.position = "absolute";
    newBox.style.left = `${x}px`;
    newBox.style.top = `${y}px`;
    newBox.contentEditable = true;
    newBox.dataset.placeholder = contentIsPlaceholder ? (content || placeholder) : placeholder;
    newBox.textContent = contentIsPlaceholder ? "" : (content || "");
    syncBoxPlaceholderState(newBox);

    ensureBoxFooter(newBox);

    document.getElementById("boxes").appendChild(newBox);
    makeDraggable(newBox);
    listenForImagePaste(newBox);
    setupBoxPlaceholder(newBox);

    boxes.set(newBox.id, {
        box: newBox,
        lines: []
    });

    return newBox;
}

function getBoxText(box) {
    if (!box) return "";
    const clone = box.cloneNode(true);
    clone.querySelector('.boxFooter')?.remove();
    return clone.textContent.trim();
}

function syncBoxPlaceholderState(box) {
    if (!box) return;
    box.classList.toggle('is-empty', getBoxText(box).length === 0);
}

function setupBoxPlaceholder(box) {
    if (!box) return;
    syncBoxPlaceholderState(box);
    box.addEventListener('focus', () => syncBoxPlaceholderState(box));
    box.addEventListener('blur', () => syncBoxPlaceholderState(box));
}

function ensureBoxFooter(box) {
    if (!box) return;
    box.dataset.label = `#${box.id}`;
    box.querySelector('.boxFooter')?.remove();
}

function applyBoxCustomColor(box, color) {
    if (!box) return;
    const hex = colorToHex(color);
    box.style.backgroundColor = hex;
    if (!box.classList.contains('has-custom-text-color')) {
        box.style.color = readableTextColor(hex);
    }
    box.classList.add('has-custom-color');
}

function applyBoxTextColor(box, color) {
    if (!box) return;
    box.style.color = colorToHex(color);
    box.classList.add('has-custom-text-color');
}

function applyHeadingColor(color) {
    const heading = document.getElementById("heading");
    if (!heading) return;
    heading.style.background = colorToHex(color);
    heading.dataset.customBackground = "true";
}

function applyHeadingTextColor(color) {
    const heading = document.getElementById("heading");
    const headingText = document.getElementById("headingText");
    if (!heading || !headingText) return;
    const hex = colorToHex(color);
    heading.style.color = hex;
    headingText.style.color = hex;
    heading.dataset.customText = "true";
}

function resetHeadingStyle() {
    const heading = document.getElementById("heading");
    const headingText = document.getElementById("headingText");
    if (!heading || !headingText) return;
    heading.style.background = "";
    heading.style.color = "";
    headingText.style.color = "";
    delete heading.dataset.customBackground;
    delete heading.dataset.customText;
    const headingColor = document.getElementById("headingColor");
    const headingTextColor = document.getElementById("headingTextColor");
    if (headingColor) headingColor.value = "#22C55E";
    if (headingTextColor) headingTextColor.value = "#FFFFFF";
}

function getHeadingStylePayload() {
    const heading = document.getElementById("heading");
    const headingText = document.getElementById("headingText");
    return {
        backgroundColor: heading?.dataset.customBackground ? colorToHex(heading.style.backgroundColor || heading.style.background) : null,
        color: heading?.dataset.customText ? colorToHex(headingText?.style.color || heading?.style.color || "") : null
    };
}

function applyHeadingStylePayload(style = {}) {
    resetHeadingStyle();
    if (style?.backgroundColor) applyHeadingColor(style.backgroundColor);
    if (style?.color) applyHeadingTextColor(style.color);
}

function initHeadingColorControls() {
    const headingColor = document.getElementById("headingColor");
    const headingTextColor = document.getElementById("headingTextColor");
    if (!headingColor || !headingTextColor) return;

    headingColor.addEventListener("input", event => applyHeadingColor(event.target.value));
    headingColor.addEventListener("change", event => applyHeadingColor(event.target.value));
    headingTextColor.addEventListener("input", event => applyHeadingTextColor(event.target.value));
    headingTextColor.addEventListener("change", event => applyHeadingTextColor(event.target.value));
}

// --------------------------------------------------------------------------
// Box Lifecycle Helpers
// --------------------------------------------------------------------------

/**
 * Deletes a specified box and all the lines connected to it.
 * @param {HTMLElement} box - The box element to be deleted.
 */
function deleteBox(box) {
    const lines = getLinesAttached(box);
    lines.forEach(line => {
        deleteLine(line);
    });
    box.remove();
    boxes.delete(box.id);
}

function duplicateBox(box) {
    if (!box) return null;
    const [left, top] = getBoxCoords(box);
    const duplicate = createNewBlock(left + 28, top + 28, getBoxText(box), { contentIsPlaceholder: false });

    if (box.classList.contains('has-custom-color')) {
        applyBoxCustomColor(duplicate, box.style.backgroundColor);
    }

    if (box.classList.contains('has-custom-text-color')) {
        applyBoxTextColor(duplicate, box.style.color);
    }

    duplicate.style.width = box.style.width;
    duplicate.style.height = box.style.height;
    syncBoxPlaceholderState(duplicate);
    return duplicate;
}

// --------------------------------------------------------------------------
// Line Creation and Management
// --------------------------------------------------------------------------

/**
 * Creates a new SVG line element connecting two specified boxes.
 * @param {HTMLElement|string} box1 - The first box element or its ID.
 * @param {HTMLElement|string} box2 - The second box element or its ID.
 */
function newLine(box1, box2) {
    const firstBox = typeof box1 === "string" ? document.getElementById(box1) : box1;
    const secondBox = typeof box2 === "string" ? document.getElementById(box2) : box2;

    if (!firstBox || !secondBox) return;

    const sortedIds = [firstBox.id, secondBox.id].sort((a, b) => Number(a) - Number(b));
    const lineId = sortedIds.join("_");

    if (document.getElementById(lineId)) return;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("id", lineId);
    line.setAttribute("class", "line");

    const firstEntry = boxes.get(firstBox.id);
    const secondEntry = boxes.get(secondBox.id);

    if (firstEntry && !firstEntry.lines.includes(secondBox.id)) {
        firstEntry.lines.push(secondBox.id);
    }

    if (secondEntry && !secondEntry.lines.includes(firstBox.id)) {
        secondEntry.lines.push(firstBox.id);
    }

    const [x1, y1] = getBoxCoords(firstBox);
    const [x2, y2] = getBoxCoords(secondBox);
    updateLinePosition(line, x1, y1, x2, y2);
    document.getElementById("lines").appendChild(line);
}

/**
 * Updates the position of all lines connected to a given box.
 * @param {HTMLElement} box - The box whose connected lines need to be updated.
 */
function updateLinesPosition(box) {
    for (const line of document.querySelectorAll(".line")) {
        const [startId, endId] = line.id.split("_");
        if (box.id === startId) {
            const [x1, y1] = getBoxCoords(box);
            updateLinePosition(line, x1, y1, false, false);
        } else if (box.id === endId) {
            const [x2, y2] = getBoxCoords(box);
            updateLinePosition(line, false, false, x2, y2);
        }
    }
}

/**
 * Deletes a specified SVG line element and updates the 'boxes' Map accordingly.
 * @param {SVGLineElement} line - The SVG line element to be deleted.
 */
function deleteLine(line) {
    const [a, b] = line.id.split("_");
    const firstEntry = boxes.get(a);
    const secondEntry = boxes.get(b);

    if (firstEntry) {
        firstEntry.lines = firstEntry.lines.filter(id => id !== b);
    }
    if (secondEntry) {
        secondEntry.lines = secondEntry.lines.filter(id => id !== a);
    }

    line.remove();
}

/**
 * Retrieves all SVG line elements that are connected to a given box.
 * @param {HTMLElement} box - The box element to find connected lines for.
 * @returns {SVGLineElement[]} An array of SVG line elements connected to the box.
 */
function getLinesAttached(box) {
    return Array.from(document.querySelectorAll(".line")).filter(line => {
        const [a, b] = line.id.split("_");
        return a === box.id || b === box.id;
    });
}

/**
 * Gets the center coordinates (x, y) of a given HTML element.
 * @param {HTMLElement} box - The HTML element.
 * @returns {number[]} An array containing the x and y coordinates of the center of the box.
 */
function getBoxCoords(box) {
    const x = box.offsetLeft + box.offsetWidth / 2;
    const y = box.offsetTop + box.offsetHeight / 2;
    return [x, y];
}

/**
 * Updates the coordinates of an SVG line element.
 * @param {SVGLineElement} line - The SVG line element to update.
 * @param {number|boolean} [x1=false] - The new x1 coordinate, or false to not update.
 * @param {number|boolean} [y1=false] - The new y1 coordinate, or false to not update.
 * @param {number|boolean} [x2=false] - The new x2 coordinate, or false to not update.
 * @param {number|boolean} [y2=false] - The new y2 coordinate, or false to not update.
 */
function updateLinePosition(line, x1 = false, y1 = false, x2 = false, y2 = false) {
    if (x1 !== false) line.setAttribute("x1", x1);
    if (y1 !== false) line.setAttribute("y1", y1);
    if (x2 !== false) line.setAttribute("x2", x2);
    if (y2 !== false) line.setAttribute("y2", y2);
}


// --------------------------------------------------------------------------
// Plain Text Pasting
// --------------------------------------------------------------------------

function insertPlainTextAtSelection(text) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    selection.deleteFromDocument();
    const range = selection.getRangeAt(0);
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    selection.removeAllRanges();
    selection.addRange(range);
}

function insertTextIntoEditable(editable, text) {
    if (!editable || !text) return;
    editable.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editable);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    const prefix = editable.textContent.trim() ? ' ' : '';
    insertPlainTextAtSelection(prefix + text);
    editable.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    if (editable.classList?.contains('box')) updateLinesPosition(editable);
}

function rememberDictationTarget(event) {
    const editable = event.target.closest?.('[contenteditable="true"]');
    if (editable) dictationTarget = editable;
}

function getDictationTarget() {
    const activeEditable = document.activeElement?.closest?.('[contenteditable="true"]');
    if (activeEditable) {
        dictationTarget = activeEditable;
        return activeEditable;
    }
    if (dictationTarget?.isConnected) return dictationTarget;
    const firstEmptyBox = document.querySelector('#boxes .box');
    dictationTarget = firstEmptyBox || document.getElementById('notesText') || document.getElementById('cueText');
    return dictationTarget;
}

function listenForImagePaste(box) {
    box.addEventListener('paste', function (event) {
        event.preventDefault();
        event.stopPropagation();
        const text = event.clipboardData?.getData('text/plain') || '';
        insertPlainTextAtSelection(text);
        box.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    });
}

function setupPlainTextPaste() {
    document.addEventListener('paste', event => {
        const editable = event.target.closest?.('[contenteditable="true"]');
        if (!editable) return;
        event.preventDefault();
        const text = event.clipboardData?.getData('text/plain') || '';
        insertPlainTextAtSelection(text);
        editable.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    });
}

function setupDictationTargetTracking() {
    document.addEventListener('focusin', rememberDictationTarget);
    document.addEventListener('click', rememberDictationTarget);
}

// --------------------------------------------------------------------------
// Custom Text Context Menu and Highlighting
// --------------------------------------------------------------------------

/**
 * Checks if the current text selection is within a <span> element inside the "#text" container.
 * @param {Selection} selection - The current window text selection.
 * @returns {HTMLElement|boolean} The <span> element if selected text is within one, otherwise false.
 */
function isSpan(selection) {
    const range = selection.getRangeAt(0);
    let commonAncestor = range.commonAncestorContainer;
    if (commonAncestor.nodeType === Node.TEXT_NODE) {
        commonAncestor = commonAncestor.parentElement;
    }
    if (!commonAncestor.closest('#text')) return false;
    if (commonAncestor.tagName === "SPAN") {
        return commonAncestor;
    }
    return false;
}

/**
 * Highlights the selected text by wrapping it in a span with the given background color.
 * If the selected text is already within a span, it updates the background color.
 * @param {string} color - The background color to apply to the highlighted text.
 * @param {HTMLElement|boolean} isSpan - The existing span element if the text is already highlighted, or false otherwise.
 * @returns {HTMLElement|boolean} The created or updated span element, or false if an error occurred.
 */
function highlightText(color, isSpan) {
    if (isSpan) {
        isSpan.style.backgroundColor = color;
        addGlow(isSpan, color);
    } else {
        const span = document.createElement("span");
        span.className = "highlight";
        span.style.backgroundColor = color;
        try {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            range.surroundContents(span);
            addGlow(span, color);
            return span;
        } catch (error) {
            console.warn("Erros Highlighting", error);
            return false;
        }
    }
}

/**
 * Removes a span element, effectively removing the highlight or link.
 * @param {HTMLElement} span - The span element to remove.
 */
function removeSpan(span) {
    const content = span.textContent;
    const textNode = document.createTextNode(content);
    span.replaceWith(textNode);
}

/**
 * Updates the options in the link dropdown within the text toolbar.
 * @param {string} link - The ID of the box that should be marked as selected, if any.
 */
function updateBoxList(link) {
    const dropdown = document.getElementById("t_dropdown");
    const boxes = document.getElementById("boxes").children;
    dropdown.innerHTML = `<option value='none' ${link ? "" : "selected"}>--None--</option>`;
    Array(...boxes).forEach(box => {
        const option = document.createElement("option");
        option.value = box.id;
        option.selected = link == box.id ? "selected" : "";
        option.innerHTML = "Box# " + box.id;
        dropdown.appendChild(option);

        // Add glow effect on mouseenter/mouseleave for dropdown options
        option.addEventListener("mouseenter", e => glowBox(e));
        option.addEventListener("mouseleave", e => noGlowBox(e));

        function glowBox(e) {
            const id = e.target.value;
            document.documentElement.style.setProperty("--glow-color", "black");
            document.getElementById(id)?.classList.add("glow");
        }

        function noGlowBox(e) {
            const id = e.target.value;
            document.getElementById(id)?.classList.remove("glow");
        }
    });
}

/**
 * Extracts the box ID from a string that represents setting the window location hash.
 * @param {string} e - The string containing the window.location.href assignment.
 * @returns {string|boolean} The extracted box ID, or false if no ID is found.
 */
function getLink(e) {
    let match = e.match(/window\.location\.href\s*=\s*['"]#(.*?)['"]/);
    if (match) {
        match = match[1];
        console.log("ID:", match);
        return match;
    }
    return false;
}

/**
 * Event listener for the "text" element's context menu (right-click).
 * Prevents the default context menu and displays a custom text toolbar.
 */
document.getElementById("text").addEventListener("contextmenu", (e) => {
    e.preventDefault();

    // To remove all event listeners on the toolbar (for updating them)
    const loadToolbar = document.getElementById("textToolbar");
    loadToolbar.parentNode.replaceChild(loadToolbar.cloneNode(true), loadToolbar);

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    let span = isSpan(selection);

    // Event listener for the text highlight color picker
    document.getElementById("t_boxColor").addEventListener("change", e => {
        const color = colorToHex(e.target.value);
        highlightText(color, span);
    });

    // Event listener for the link dropdown
    document.getElementById("t_dropdown").addEventListener("change", e => {
        if (!span) {
            span = highlightText("#FFFF00", false);
            document.getElementById("t_boxColor").value = "#FFFF00";
        }
        span.dataset.boxId = e.target.value;
        span.setAttribute("onclick", `window.location.href='#${e.target.value}'`);
    });

    // Event listener for removing the text highlight/link
    document.getElementById("t_remove").addEventListener("click", e => {
        if (span) {
            removeSpan(span);
            removetoolbar();
        }
    });

    // Update the color picker value and visibility of the remove button
    document.getElementById("t_boxColor").value = span ? colorToHex(span.style.backgroundColor) : "#ffffff";
    document.getElementById("t_remove").style.display = span ? "inline" : "none";
    updateBoxList(span.dataset?.boxId);

    const toolbar = document.getElementById("textToolbar");
    toolbar.style.left = e.clientX + 'px';
    toolbar.style.top = e.clientY + 'px';

    toolbar.style.display = 'block'; // Show the toolbar

    // Function to hide the text toolbar and clear selection
    function removetoolbar() {
        selection?.removeAllRanges();
        toolbar.style.display = 'none';
    }
});

// --------------------------------------------------------------------------
// Toolbar Visibility Management (General)
// --------------------------------------------------------------------------

/**
 * Event listener for clicks anywhere on the document to hide the toolbars.
 */
document.addEventListener('click', function (event) {
    const toolbar = document.getElementById('toolbar');
    const textToolbar = document.getElementById("textToolbar");
    const treeMenu = document.getElementById("treeQuickMenu");

    if (toolbar && !event.target.closest('#boxes') && !event.target.closest('#toolbar')) {
        toolbar.style.display = 'none';
    }

    if (textToolbar && !event.target.closest("#textToolbar")) {
        textToolbar.style.display = 'none';
    }

    // Tree quick-menu only opens on right-click (see initTreeMenu); any
    // left-click outside the menu itself should dismiss it, even if it
    // happens inside the canvas (selecting a box, dragging, etc.).
    if (treeMenu && !event.target.closest('#treeQuickMenu')) {
        treeMenu.classList.remove('visible');
        treeMenu.setAttribute('aria-hidden', 'true');
    }
});

// --------------------------------------------------------------------------
// Box Toolbar Event Listeners
// --------------------------------------------------------------------------

/**
 * Attaches event listeners to the buttons within the box toolbar.
 */
function boxToolbarListeners() {
    // Event listener for the box color picker
    const boxColorInput = document.getElementById("boxColor");
    const boxTextColorInput = document.getElementById("boxTextColor");
    const getToolbarBox = (target) => {
        const toolbar = target.closest('#toolbar');
        return document.getElementById(toolbar?.dataset.boxId || '');
    };
    const applyBoxColor = (e) => {
        const box = getToolbarBox(e.target);
        if (!box) return;
        applyBoxCustomColor(box, e.target.value);
    };
    const applyTextColor = (e) => {
        const box = getToolbarBox(e.target);
        if (!box) return;
        applyBoxTextColor(box, e.target.value);
    };
    boxColorInput.addEventListener("input", applyBoxColor);
    boxColorInput.addEventListener("change", applyBoxColor);
    boxColorInput.addEventListener("click", event => {
        event.stopPropagation();
    });
    boxTextColorInput.addEventListener("input", applyTextColor);
    boxTextColorInput.addEventListener("change", applyTextColor);
    boxTextColorInput.addEventListener("click", event => {
        event.stopPropagation();
    });

    // Event listener for the "addBox" button
    document.getElementById("addBox").addEventListener("click", e => {
        const box = getToolbarBox(e.target);
        addBlock(box);
    });

    // Event listener for the "deleteBox" button
    document.getElementById("deleteBox").addEventListener("click", e => {
        const box = getToolbarBox(e.target);
        deleteBox(box);
    });

    document.getElementById("duplicateBox").addEventListener("click", e => {
        duplicateBox(getToolbarBox(e.target));
    });
}


// --------------------------------------------------------------------------
// Text Highlighting and Link Styling
// --------------------------------------------------------------------------

/**
 * Adds mouseenter and mouseleave event listeners to a span element to apply a glow effect
 * to the associated box.
 * @param {HTMLElement} span - The span element that triggers the glow.
 * @param {string} color - The color of the glow effect.
 */
function addGlow(span, color) {
    span.addEventListener("mouseenter", e => glowBox(e));
    span.addEventListener("mouseleave", e => noGlowBox(e));

    function glowBox(e) {
        const id = e.target.dataset?.boxId;
        document.documentElement.style.setProperty("--glow-color", color);
        document.getElementById(id)?.classList.add("glow");
    }

    function noGlowBox(e) {
        const id = e.target.dataset?.boxId;
        document.getElementById(id)?.classList.remove("glow");
    }
}

// --------------------------------------------------------------------------
// Dropdown Menu for Connecting Boxes
// --------------------------------------------------------------------------

// Toggle the dropdown visibility when the button is hovered over
document.querySelector(".dropdown-button").addEventListener('mouseover', e => {
    const dropdown = e.currentTarget.closest(".dropdown");
    const container = dropdown.querySelector(".dropdown-content");
    const toolbar = dropdown.closest(".toolbar");
    const boxId = toolbar?.dataset.boxId;

    if (!boxId || !boxes.has(boxId)) return;

    container.innerHTML = "";

    const connectedIds = new Set((boxes.get(boxId)?.lines || []).map(String));

    Array.from(boxes.keys())
        .filter(id => id !== boxId)
        .sort((a, b) => Number(a) - Number(b))
        .forEach(id => {
            const item = document.createElement("div");
            item.className = "dropdown-item";

            const lesser = String(Math.min(Number(boxId), Number(id)));
            const greater = String(Math.max(Number(boxId), Number(id)));
            const lineId = `${lesser}_${greater}`;
            const isConnected = connectedIds.has(String(id));

            item.dataset.a = lesser;
            item.dataset.b = greater;
            item.dataset.c = isConnected ? "1" : "0";
            item.textContent = `Box# ${id}${isConnected ? " ✅" : ""}`;

            item.addEventListener("click", evt => {
                const { a, b, c } = evt.currentTarget.dataset;
                if (c === "1") {
                    const existingLine = document.getElementById(`${a}_${b}`);
                    if (existingLine) deleteLine(existingLine);
                } else {
                    newLine(a, b);
                }
            });

            container.appendChild(item);
        });

    dropdown.classList.add("show");
});

document.getElementById("link").addEventListener('mouseleave', () => {
    document.getElementById("link").classList.remove("show");
});


// --------------------------------------------------------------------------
// Color Conversion Functions
// --------------------------------------------------------------------------

/**
 * Converts a color string (hex, rgb, or hsl) to its hexadecimal representation.
 * Returns '#f1f1f1' for invalid color formats.
 * @param {string} color - The color string to convert.
 * @returns {string} The hexadecimal representation of the color.
 */
function colorToHex(color) {
    if (typeof color !== "string") {
        return "#f1f1f1";
    }

    const normalized = color.trim();

    if (!normalized) {
        return "#f1f1f1";
    }

    if (normalized.startsWith("#")) {
        return normalized.length === 4 || normalized.length === 7 ? normalized.toUpperCase() : "#f1f1f1";
    }

    if (normalized.startsWith("rgb")) {
        const rgb = normalized.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/);
        if (rgb) {
            return rgbToHex(parseInt(rgb[1], 10), parseInt(rgb[2], 10), parseInt(rgb[3], 10));
        }
    }

    if (normalized.startsWith("hsl")) {
        const hsl = normalized.match(/hsl\(\s*(\d+),\s*(\d+)%,\s*(\d+)%\s*\)/);
        if (hsl) {
            return hslToHex(parseInt(hsl[1], 10), parseInt(hsl[2], 10), parseInt(hsl[3], 10));
        }
    }

    console.warn("Invalid Color ", color);
    return "#f1f1f1";
}

/**
 * Converts RGB color values to a hexadecimal color string.
 * @param {number} r - The red color value (0-255).
 * @param {number} g - The green color value (0-255).
 * @param {number} b - The blue color value (0-255).
 * @returns {string} The hexadecimal representation of the RGB color.
 */
function rgbToHex(r, g, b) {
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase()}`;
}

function readableTextColor(color) {
    const hex = colorToHex(color);
    const expandedHex = hex.length === 4
        ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex;
    const red = parseInt(expandedHex.slice(1, 3), 16) / 255;
    const green = parseInt(expandedHex.slice(3, 5), 16) / 255;
    const blue = parseInt(expandedHex.slice(5, 7), 16) / 255;
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    return luminance > 0.55 ? "#111827" : "#F8FAFC";
}

/**
 * Converts HSL color values to a hexadecimal color string.
 * @param {number} h - The hue value (0-360).
 * @param {number} s - The saturation value (0-100).
 * @param {number} l - The lightness value (0-100).
 * @returns {string} The hexadecimal representation of the HSL color.
 */
function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let m = l - c / 2;
    let r, g, b;
    if (h >= 0 && h < 60) {
        r = c;
        g = x;
        b = 0;
    } else if (h >= 60 && h < 120) {
        r = x;
        g = c;
        b = 0;
    } else if (h >= 120 && h < 180) {
        r = 0;
        g = c;
        b = x;
    } else if (h >= 180 && h < 240) {
        r = 0;
        g = x;
        b = c;
    } else if (h >= 240 && h < 300) {
        r = x;
        g = 0;
        b = c;
    } else {
        r = c;
        g = 0;
        b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase()}`;
}

// --------------------------------------------------------------------------
// Canvas Grid Toggle & Panning
// --------------------------------------------------------------------------

function toggleGrid(forceState = null, persist = true) {
    const canvas = document.getElementById('zoom');
    const toggleButton = document.getElementById('gridToggle');
    if (!canvas || !toggleButton) return;

    if (typeof forceState === 'boolean') {
        isGridActive = forceState;
    } else {
        isGridActive = !isGridActive;
    }

    canvas.classList.toggle('grid-on', isGridActive);
    toggleButton.classList.toggle('is-active', isGridActive);
    toggleButton.setAttribute('aria-pressed', String(isGridActive));

    if (persist) {
        try {
            localStorage.setItem('treenotes-grid', isGridActive ? 'true' : 'false');
        } catch (error) {
            console.warn('Unable to persist grid preference', error);
        }
    }
}

function initGridToggle() {
    let savedState = null;
    try {
        savedState = localStorage.getItem('treenotes-grid');
    } catch (error) {
        savedState = null;
    }

    if (savedState === 'true' || savedState === 'false') {
        toggleGrid(savedState === 'true', false);
    } else {
        toggleGrid(false, false);
    }

    const button = document.getElementById('gridToggle');
    if (button) {
        button.addEventListener('click', () => toggleGrid(null, true));
    }
}

function initTreePanning() {
    const container = document.querySelector('#tree .container');
    if (!container) return;

    let isPanning = false;
    let panMoved = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    container.addEventListener('mousedown', event => {
        if (event.button !== 0) return;
        if (
            event.target.closest('.box') ||
            event.target.closest('#toolbarBar') ||
            event.target.closest('#treeQuickMenu') ||
            event.target.closest('.status-message') ||
            event.target.closest('.analysis-panel')
        ) {
            return;
        }

        isPanning = true;
        panMoved = false;
        container.classList.add('is-panning');
        startX = event.clientX;
        startY = event.clientY;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;
        event.preventDefault();
    });

    window.addEventListener('mousemove', event => {
        if (!isPanning) return;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (!panMoved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
            panMoved = true;
        }

        container.scrollLeft = scrollLeft - dx;
        container.scrollTop = scrollTop - dy;
    });

    const endPan = () => {
        if (!isPanning) return;
        isPanning = false;
        container.classList.remove('is-panning');
    };

    window.addEventListener('mouseup', endPan);
    window.addEventListener('blur', endPan);
    container.addEventListener('mouseup', endPan);
    container.addEventListener('mouseleave', endPan);

    container.addEventListener('click', event => {
        if (panMoved) {
            panMoved = false;
            event.stopPropagation();
        }
    }, true);
}

// --------------------------------------------------------------------------
// Assistive Controls (Speech-to-Text & AI Analysis)
// --------------------------------------------------------------------------

function setStatusMessage(message = '', variant = 'info') {
    const statusEl = document.getElementById('statusMessage');
    if (!statusEl) return;

    if (message) {
        statusEl.textContent = message;
        statusEl.classList.add('is-active');
    } else {
        statusEl.textContent = '';
        statusEl.classList.remove('is-active');
    }

    if (variant === 'error') {
        statusEl.classList.add('is-alert');
    } else {
        statusEl.classList.remove('is-alert');
    }
}

function getSpeechRecognitionCtor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function getDictationPreferences() {
    return {
        language: document.getElementById('dictation-language')?.value || '',
        continuous: document.getElementById('dictation-continuous')?.checked !== false,
        interim: document.getElementById('dictation-interim')?.checked !== false
    };
}

function saveDictationPreferences() {
    try {
        localStorage.setItem(DICTATION_PREFS_STORAGE_KEY, JSON.stringify(getDictationPreferences()));
    } catch (_) {
        // Keep browser defaults if localStorage is unavailable.
    }
}

function initDictationPreferences() {
    const languageSelect = document.getElementById('dictation-language');
    const continuousToggle = document.getElementById('dictation-continuous');
    const interimToggle = document.getElementById('dictation-interim');
    const testButton = document.getElementById('dictationTestBtn');

    try {
        const saved = JSON.parse(localStorage.getItem(DICTATION_PREFS_STORAGE_KEY) || '{}');
        if (languageSelect && typeof saved.language === 'string') languageSelect.value = saved.language;
        if (continuousToggle && typeof saved.continuous === 'boolean') continuousToggle.checked = saved.continuous;
        if (interimToggle && typeof saved.interim === 'boolean') interimToggle.checked = saved.interim;
    } catch (_) {
        // Ignore malformed saved state.
    }

    languageSelect?.addEventListener('change', saveDictationPreferences);
    continuousToggle?.addEventListener('change', saveDictationPreferences);
    interimToggle?.addEventListener('change', saveDictationPreferences);
    testButton?.addEventListener('click', () => {
        const button = document.getElementById('dictateToggle');
        if (isDictating) stopDictation('Dictation stopped.');
        else startDictation(button);
    });
}

function setDictationActive(active, dictateButton = document.getElementById('dictateToggle')) {
    isDictating = active;
    if (dictateButton) {
        dictateButton.classList.toggle('is-active', isDictating);
        dictateButton.setAttribute('aria-pressed', String(isDictating));
        dictateButton.title = isDictating ? 'Stop dictation' : 'Toggle dictation';
    }
}

function stopDictation(message = 'Dictation stopped.') {
    if (dictationRecognition && isDictating) {
        dictationRecognition.stop();
    }
    setDictationActive(false);
    if (message) setStatusMessage(message, 'info');
}

function startDictation(dictateButton) {
    const Recognition = getSpeechRecognitionCtor();
    if (!Recognition) {
        setDictationActive(false, dictateButton);
        setStatusMessage('Dictation is not supported in this browser. Try Chrome or Edge.', 'error');
        return;
    }

    const target = getDictationTarget();
    if (!target) {
        setDictationActive(false, dictateButton);
        setStatusMessage('Click a text field or note box before starting dictation.', 'error');
        return;
    }

    dictationRecognition = new Recognition();
    const preferences = getDictationPreferences();
    dictationRecognition.lang = preferences.language || navigator.language || 'en-US';
    dictationRecognition.continuous = preferences.continuous;
    dictationRecognition.interimResults = preferences.interim;

    dictationRecognition.onstart = () => {
        setDictationActive(true, dictateButton);
        setStatusMessage('Dictation active. Speak now; recognized text goes into the selected field.', 'info');
    };

    dictationRecognition.onresult = (event) => {
        let finalText = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const result = event.results[index];
            if (result.isFinal) finalText += result[0].transcript;
        }
        finalText = finalText.trim();
        if (!finalText) return;
        insertTextIntoEditable(getDictationTarget(), finalText);
    };

    dictationRecognition.onerror = (event) => {
        const message = event.error === 'not-allowed'
            ? 'Microphone permission denied. Enable microphone access to use dictation.'
            : `Dictation error: ${event.error || 'unknown error'}.`;
        setDictationActive(false, dictateButton);
        setStatusMessage(message, 'error');
    };

    dictationRecognition.onend = () => {
        if (isDictating) {
            setDictationActive(false, dictateButton);
            setStatusMessage('Dictation ended.', 'info');
        }
    };

    try {
        dictationRecognition.start();
    } catch (error) {
        setDictationActive(false, dictateButton);
        setStatusMessage('Dictation could not start. Try clicking a text field first.', 'error');
    }
}

function gatherCornellNotes() {
    const boxesWrapper = document.getElementById('boxes');
    let noteBody = '';

    if (boxesWrapper) {
        noteBody = Array.from(boxesWrapper.querySelectorAll('.box'))
            .map(box => {
                const id = box.id ? `#${box.id}` : '';
                return `Box ${id}`.trim() + ': ' + getBoxText(box);
            })
            .join('\n');
    }

    return {
        heading: document.getElementById('headingText')?.innerText.trim() || '',
        cues: document.getElementById('cueText')?.innerText.trim() || '',
        notes: noteBody || document.getElementById('tree')?.innerText.trim() || '',
        summary: document.getElementById('notesText')?.innerText.trim() || ''
    };
}

// --------------------------------------------------------------------------
// LLM Insights — markdown renderer + concepts / suggested-links sections
// --------------------------------------------------------------------------

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Tiny markdown subset: bullets (* or -), **bold**, *italic*, _italic_, `code`,
// blank-line separated paragraphs. Enough for what Gemini emits in `analysis`.
function renderInlineMarkdown(escaped) {
    // Bold first so the leftover singles can be parsed as italics safely.
    let out = escaped.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?=[^*\w]|$)/g, '$1<em>$2</em>');
    out = out.replace(/(^|[^_\w])_([^_\s][^_]*?)_(?=[^_\w]|$)/g, '$1<em>$2</em>');
    out = out.replace(/`([^`]+?)`/g, '<code>$1</code>');
    return out;
}

function renderSimpleMarkdown(text) {
    if (!text) return '';
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let listOpen = false;
    let paragraphBuf = [];

    const flushParagraph = () => {
        if (!paragraphBuf.length) return;
        const joined = paragraphBuf.join(' ').trim();
        if (joined) {
            html.push('<p>' + renderInlineMarkdown(escapeHtml(joined)) + '</p>');
        }
        paragraphBuf = [];
    };

    for (const raw of lines) {
        const line = raw.trim();
        const bullet = line.match(/^[\*\-]\s+(.*)$/);
        if (bullet) {
            flushParagraph();
            if (!listOpen) { html.push('<ul>'); listOpen = true; }
            html.push('<li>' + renderInlineMarkdown(escapeHtml(bullet[1])) + '</li>');
        } else if (!line) {
            if (listOpen) { html.push('</ul>'); listOpen = false; }
            flushParagraph();
        } else {
            if (listOpen) { html.push('</ul>'); listOpen = false; }
            paragraphBuf.push(line);
        }
    }

    if (listOpen) html.push('</ul>');
    flushParagraph();
    return html.join('');
}

function renderBulletListHtml(items) {
    const values = Array.isArray(items)
        ? items.filter(s => typeof s === 'string' && s.trim())
        : [];
    if (!values.length) return '';
    return '<ul>' + values.map(item => '<li>' + renderInlineMarkdown(escapeHtml(item.trim())) + '</li>').join('') + '</ul>';
}

function renderStructuredAnalysis(data, contentEl) {
    const overviewSection = document.getElementById('analysisOverview');
    const overviewList = document.getElementById('overviewList');
    const swotSection = document.getElementById('analysisSwot');
    const swotList = document.getElementById('swotList');

    if (!overviewSection || !overviewList || !swotSection || !swotList) return false;

    const overviewHtml = renderBulletListHtml(data.overview);
    overviewList.innerHTML = overviewHtml;
    overviewSection.hidden = !overviewHtml;

    const studyAnalysis = data.study_analysis && typeof data.study_analysis === 'object'
        ? data.study_analysis
        : {};
    const groups = [
        ['Strengths', studyAnalysis.strengths],
        ['Weaknesses', studyAnalysis.weaknesses],
        ['Opportunities', studyAnalysis.opportunities],
        ['Threats', studyAnalysis.threats],
        ['Recommended improvements', studyAnalysis.recommended_improvements]
    ];

    swotList.innerHTML = '';
    for (const [title, items] of groups) {
        const html = renderBulletListHtml(items);
        if (!html) continue;
        const group = document.createElement('div');
        group.className = 'swot-group';
        const heading = document.createElement('h5');
        heading.className = 'swot-group__title';
        heading.textContent = title;
        const body = document.createElement('div');
        body.className = 'analysis-panel__content';
        body.innerHTML = html;
        group.append(heading, body);
        swotList.appendChild(group);
    }
    swotSection.hidden = !swotList.children.length;

    if (contentEl) contentEl.innerHTML = '';
    return !!overviewHtml || !!swotList.children.length;
}

function structuredDataFromResponse(data) {
    if (Array.isArray(data.overview) || (data.study_analysis && typeof data.study_analysis === 'object')) {
        return data;
    }
    if (typeof data.analysis !== 'string') return data;
    const raw = data.analysis.trim();
    if (!raw.startsWith('{') && !raw.startsWith('```')) return data;
    const normalizeParsed = (parsed) => {
        if (typeof parsed === 'string') {
            try {
                parsed = JSON.parse(parsed);
            } catch (_) {
                return { ...data, analysis: '', message: data.message || 'The model returned malformed JSON. Please retry analysis.' };
            }
        }
        if (parsed?.analysis && typeof parsed.analysis === 'object' && !parsed.overview) {
            parsed = parsed.analysis;
        }
        if (parsed && typeof parsed === 'object') {
            const safeAnalysis = typeof parsed.analysis === 'string' && !parsed.analysis.trim().startsWith('{')
                ? parsed.analysis
                : '';
            return { ...data, ...parsed, analysis: safeAnalysis };
        }
        return { ...data, analysis: '', message: data.message || 'The model returned malformed JSON. Please retry analysis.' };
    };
    const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    try {
        return normalizeParsed(JSON.parse(cleaned));
    } catch (_) {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end > start) {
            try {
                return normalizeParsed(JSON.parse(cleaned.slice(start, end + 1)));
            } catch (__) {
                return { ...data, analysis: '', message: data.message || 'The model returned malformed JSON. Please retry analysis.' };
            }
        }
    }
    return { ...data, analysis: '', message: data.message || 'The model returned malformed JSON. Please retry analysis.' };
}

function renderConceptsAndSuggestions(data) {
    const conceptsSection = document.getElementById('analysisConcepts');
    const conceptsList = document.getElementById('conceptsList');
    const suggestedSection = document.getElementById('analysisSuggested');
    const suggestedList = document.getElementById('suggestedLinksList');
    let seeAlsoSection = document.getElementById('analysisSeeAlso');
    let seeAlsoList = document.getElementById('seeAlsoList');
    const videosSection = document.getElementById('analysisVideos');
    const videosList = document.getElementById('videosList');

    if (!conceptsSection || !conceptsList || !suggestedSection || !suggestedList) return;

    // Dynamically add the "Further Reading" section right below "Concepts" if missing
    if (!seeAlsoSection) {
        seeAlsoSection = document.createElement('div');
        seeAlsoSection.id = 'analysisSeeAlso';
        seeAlsoSection.hidden = true;
        
        const heading = document.createElement('h4');
        heading.textContent = 'Further Reading';
        seeAlsoSection.appendChild(heading);
        
        seeAlsoList = document.createElement('ul');
        seeAlsoList.id = 'seeAlsoList';
        seeAlsoList.style.paddingLeft = '20px';
        seeAlsoSection.appendChild(seeAlsoList);
        
        conceptsSection.parentNode.insertBefore(seeAlsoSection, conceptsSection.nextSibling);
    }

    const concepts = Array.isArray(data.concepts)
        ? data.concepts.filter(s => typeof s === 'string' && s.trim())
        : [];
    const rawLinks = Array.isArray(data.suggested_links) ? data.suggested_links : [];

    conceptsList.innerHTML = '';
    if (concepts.length) {
        for (const c of concepts) {
            const chip = document.createElement('span');
            chip.className = 'concept-chip';
            chip.textContent = c;
            conceptsList.appendChild(chip);
        }
        conceptsSection.hidden = false;
    } else {
        conceptsSection.hidden = true;
    }

    suggestedList.innerHTML = '';
    // Drop suggestions that point at boxes the user has since renamed/removed,
    // and self-links that the server's sanitizer somehow let through.
    const validLinks = rawLinks.filter(l => {
        const a = String(l?.a ?? '');
        const b = String(l?.b ?? '');
        return a && b && a !== b && boxes.has(a) && boxes.has(b);
    });

    if (validLinks.length) {
        for (const link of validLinks) {
            const a = String(link.a);
            const b = String(link.b);
            const lo = String(Math.min(Number(a), Number(b)));
            const hi = String(Math.max(Number(a), Number(b)));
            const lineId = `${lo}_${hi}`;
            const alreadyLinked = !!document.getElementById(lineId);

            const item = document.createElement('li');
            item.className = 'suggested-link-item';

            const label = document.createElement('span');
            label.className = 'suggested-link-item__label';
            const aContent = typeof link.a_content === 'string' ? link.a_content.trim() : '';
            const bContent = typeof link.b_content === 'string' ? link.b_content.trim() : '';
            label.textContent = `Box ${lo} ↔ Box ${hi}`;
            if (aContent || bContent) {
                const detail = document.createElement('span');
                detail.className = 'suggested-link-item__boxes';
                detail.textContent = `${aContent || 'Empty box'} ↔ ${bContent || 'Empty box'}`;
                label.appendChild(detail);
            }

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'suggested-link-item__btn';
            if (alreadyLinked) {
                btn.textContent = 'Linked ✓';
                btn.disabled = true;
            } else {
                btn.textContent = '+ Create';
                btn.addEventListener('click', () => {
                    // Client-side only — same flow as the box quick-toolbar Link
                    // dropdown. Persist server-side via the existing Save button.
                    newLine(lo, hi);
                    btn.textContent = 'Linked ✓';
                    btn.disabled = true;
                });
            }

            item.append(label, btn);
            suggestedList.appendChild(item);
        }
        suggestedSection.hidden = false;
    } else {
        suggestedSection.hidden = true;
    }

    const seeAlsoLinks = Array.isArray(data.see_also) ? data.see_also : [];
    seeAlsoList.innerHTML = '';
    if (seeAlsoLinks.length) {
        for (const link of seeAlsoLinks) {
            const item = document.createElement('li');
            item.className = 'suggested-link-item';
            item.style.marginBottom = '8px';

            const a = document.createElement('a');
            a.href = link.url || '#';
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = `${link.favicon ? `${link.favicon} ` : ''}${link.title || link.url || 'External Link'}`;
            a.style.textDecoration = 'underline';
            a.style.wordBreak = 'break-word';

            item.appendChild(a);
            seeAlsoList.appendChild(item);
        }
        seeAlsoSection.hidden = false;
    } else {
        seeAlsoSection.hidden = true;
    }

    const videoLinks = Array.isArray(data.videos) ? data.videos : [];
    if (videosList) videosList.innerHTML = '';
    if (videosSection && videosList && videoLinks.length) {
        for (const link of videoLinks) {
            const item = document.createElement('li');
            item.className = 'suggested-link-item video-link-item';
            item.style.marginBottom = '8px';

            const a = document.createElement('a');
            a.href = link.url || '#';
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'video-link-item__anchor';
            a.style.textDecoration = 'underline';
            a.style.wordBreak = 'break-word';
            if (link.thumbnail) {
                const img = document.createElement('img');
                img.className = 'video-link-item__thumbnail';
                img.src = link.thumbnail;
                img.alt = '';
                img.loading = 'lazy';
                a.appendChild(img);
            }
            const label = document.createElement('span');
            label.textContent = link.title || link.url || 'Video';
            a.appendChild(label);
            if (link.channel) {
                const channel = document.createElement('span');
                channel.className = 'video-link-item__channel';
                channel.textContent = link.channel;
                a.appendChild(channel);
            }

            item.appendChild(a);
            videosList.appendChild(item);
        }
        videosSection.hidden = false;
    } else if (videosSection) {
        videosSection.hidden = true;
    }
}

function getAiPreferences() {
    const provider = document.getElementById('llm-provider')?.value || 'auto';
    const model = document.getElementById('llm-model')?.value || '';
    const proMode = !!document.getElementById('pro-mode')?.checked;
    const geminiApiKey = document.getElementById('gemini-api-key')?.value.trim() || '';
    const openaiApiKey = document.getElementById('openai-api-key')?.value.trim() || '';
    const ollamaBaseUrl = document.getElementById('ollama-base-url')?.value.trim() || '';
    return { provider, model, proMode, geminiApiKey, openaiApiKey, ollamaBaseUrl };
}

function saveAiPreferences() {
    try {
        localStorage.setItem(AI_PREFS_STORAGE_KEY, JSON.stringify(getAiPreferences()));
    } catch (_) {
        // localStorage can fail in private browsing; defaults still work.
    }
}

function updateAiModelOptions() {
    const providerSelect = document.getElementById('llm-provider');
    const modelSelect = document.getElementById('llm-model');
    if (!providerSelect || !modelSelect) return;

    const provider = providerSelect.value;
    for (const option of modelSelect.options) {
        const optionProvider = option.dataset.provider || '';
        option.hidden = !!optionProvider && provider !== 'auto' && optionProvider !== provider;
    }
    const selected = modelSelect.selectedOptions[0];
    if (selected?.hidden) modelSelect.value = '';
}

function initAiPreferences() {
    const providerSelect = document.getElementById('llm-provider');
    const modelSelect = document.getElementById('llm-model');
    const proToggle = document.getElementById('pro-mode');
    const geminiKeyInput = document.getElementById('gemini-api-key');
    const openaiKeyInput = document.getElementById('openai-api-key');
    const ollamaUrlInput = document.getElementById('ollama-base-url');
    if (!providerSelect || !modelSelect || !proToggle) return;

    try {
        const saved = JSON.parse(localStorage.getItem(AI_PREFS_STORAGE_KEY) || '{}');
        if (typeof saved.provider === 'string') providerSelect.value = saved.provider;
        if (typeof saved.model === 'string') modelSelect.value = saved.model;
        proToggle.checked = !!saved.proMode;
        if (geminiKeyInput && typeof saved.geminiApiKey === 'string') geminiKeyInput.value = saved.geminiApiKey;
        if (openaiKeyInput && typeof saved.openaiApiKey === 'string') openaiKeyInput.value = saved.openaiApiKey;
        if (ollamaUrlInput && typeof saved.ollamaBaseUrl === 'string') ollamaUrlInput.value = saved.ollamaBaseUrl;
    } catch (_) {
        // Ignore malformed saved state and keep defaults.
    }

    updateAiModelOptions();
    providerSelect.addEventListener('change', () => {
        updateAiModelOptions();
        saveAiPreferences();
    });
    modelSelect.addEventListener('change', saveAiPreferences);
    proToggle.addEventListener('change', saveAiPreferences);
    geminiKeyInput?.addEventListener('change', saveAiPreferences);
    openaiKeyInput?.addEventListener('change', saveAiPreferences);
    ollamaUrlInput?.addEventListener('change', saveAiPreferences);
}

function initUiLanguagePreference() {
    const languageSelect = document.getElementById('ui-language');
    if (!languageSelect) return;

    try {
        languageSelect.value = localStorage.getItem(UI_LANGUAGE_STORAGE_KEY) || 'en';
    } catch (_) {
        languageSelect.value = 'en';
    }

    languageSelect.addEventListener('change', () => {
        try {
            localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, languageSelect.value);
        } catch (_) {}
        if (languageSelect.value !== 'en') {
            setStatusMessage('This beta currently supports English UI text only.', 'info');
            languageSelect.value = 'en';
        }
    });
}

function initFeedbackControls() {
    const feedbackButton = document.getElementById('feedback');
    const feedbackDialog = document.getElementById('feedbackDialog');
    const emailButton = document.getElementById('feedbackEmailBtn');
    const forumButton = document.getElementById('feedbackForumBtn');

    feedbackButton?.addEventListener('click', () => feedbackDialog?.showModal());
    emailButton?.addEventListener('click', () => {
        const message = document.getElementById('feedbackMessage')?.value.trim() || '';
        const subject = encodeURIComponent('TreeNotes beta feedback');
        const body = encodeURIComponent(message || 'Feedback: ');
        window.location.href = `mailto:treenotes.feedback@example.com?subject=${subject}&body=${body}`;
    });
    forumButton?.addEventListener('click', () => {
        setStatusMessage('Forums/Discord link is not configured in this beta build.', 'info');
    });
}

function openInsightsPanel(panel) {
    if (!panel) return;
    panel.classList.add('is-open');
    document.body.classList.add('has-insights');
}

function closeInsightsPanel(panel) {
    if (!panel) return;
    panel.classList.remove('is-open');
    document.body.classList.remove('has-insights');
}

function resetAnalysisContent(contentEl) {
    if (contentEl) contentEl.innerHTML = '';
    const overviewSection = document.getElementById('analysisOverview');
    const swotSection = document.getElementById('analysisSwot');
    const conceptsSection = document.getElementById('analysisConcepts');
    const suggestedSection = document.getElementById('analysisSuggested');
    const seeAlsoSection = document.getElementById('analysisSeeAlso');
    const videosSection = document.getElementById('analysisVideos');
    if (overviewSection) overviewSection.hidden = true;
    if (swotSection) swotSection.hidden = true;
    if (conceptsSection) conceptsSection.hidden = true;
    if (suggestedSection) suggestedSection.hidden = true;
    if (seeAlsoSection) seeAlsoSection.hidden = true;
    if (videosSection) videosSection.hidden = true;
}

function setAnalysisPanelTitle(title) {
    const titleEl = document.querySelector('#analysisPanel .analysis-panel__title');
    if (titleEl) titleEl.textContent = title;
}

function clearAnalysisPanel(panel, contentEl) {
    closeInsightsPanel(panel);
    resetAnalysisContent(contentEl);
}

async function analyzeNotesWithLLM() {
    const analyzeBtn = document.getElementById('analyzeNotesBtn');
    const panel = document.getElementById('analysisPanel');
    const contentEl = document.getElementById('analysisContent');

    if (!analyzeBtn || !panel || !contentEl) return;

    setAnalysisPanelTitle('LLM Insights');
    const body = aiAnalyzeBodyFromCanvas();

    analyzeBtn.disabled = true;
    analyzeBtn.classList.add('is-active');
    // Wipe stale insights but keep the sidebar in whatever state the user
    // left it (open / closed) — the success path will open it again.
    resetAnalysisContent(contentEl);
    setStatusMessage('Calling analysis API…', 'info');

    const base = getApiBase();
    const url = `${base}/ai/analyze`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(errText || `HTTP ${response.status}`);
        }

        const data = structuredDataFromResponse(await response.json());
        const status = data.status;
        const analysis = (data.analysis || '').trim();
        const message = (data.message || '').trim();

        if (status === 'ok') {
            const renderedStructured = renderStructuredAnalysis(data, contentEl);
            if (!renderedStructured) {
                contentEl.innerHTML = analysis
                    ? renderSimpleMarkdown(analysis)
                    : '<p><em>The model returned no narrative summary, but you can still review the concepts and suggested links below.</em></p>';
            }
            renderConceptsAndSuggestions(data);
            openInsightsPanel(panel);
            setStatusMessage('Analysis complete.', 'info');
            return;
        }

        if (status === 'placeholder') {
            setStatusMessage(
                message || 'Server AI is off. Add GEMINI_API_KEY (or set AI_PROVIDER) on the API host, then retry.',
                'error'
            );
            return;
        }

        setStatusMessage(message || 'Analysis failed.', 'error');
    } catch (error) {
        console.error('LLM analysis error:', error);
        setStatusMessage(
            `Could not reach ${url}. Check API URL in the menu and that the backend is running.`,
            'error'
        );
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.classList.remove('is-active');
    }
}

function buildCoachQuestions() {
    const notes = gatherCornellNotes();
    const text = [
        notes.heading,
        notes.cues,
        notes.notes,
        notes.summary
    ].filter(Boolean).join('\n');
    const boxTerms = [...boxes.values()]
        .map(({ box }) => getBoxText(box))
        .filter(Boolean)
        .slice(0, 4);
    const questions = [];

    if (notes.summary) {
        questions.push({
            prompt: 'Explain the main idea of these notes in your own words.',
            explanation: 'Good recall starts with a concise summary before checking details.'
        });
    }

    for (const term of boxTerms) {
        questions.push({
            prompt: `What does “${term}” connect to, and why is that connection useful?`,
            explanation: 'Coach Mode focuses on reasoning about links between note cells, not punishment for wrong answers.'
        });
    }

    if (text) {
        questions.push({
            prompt: 'Name one weak spot or missing detail that would improve these notes.',
            explanation: 'This turns review into active note improvement, similar to a study coach.'
        });
    }

    return questions.slice(0, 6);
}

function showCoachMode() {
    const coachButton = document.getElementById('coachModeBtn');
    const panel = document.getElementById('analysisPanel');
    const contentEl = document.getElementById('analysisContent');
    if (!panel || !contentEl) return;

    resetAnalysisContent(contentEl);
    setAnalysisPanelTitle('Coach Mode 🧠');
    const questions = buildCoachQuestions();
    contentEl.innerHTML = questions.length
        ? `<p><strong>Study coach preview.</strong> Answer these mentally or aloud, then open each explanation.</p>
           <ol class="coach-question-list">${questions.map((item, index) => `
              <li class="coach-question">
                  <p>${escapeHtml(item.prompt)}</p>
                  <details>
                      <summary>Explanation</summary>
                      <p>${escapeHtml(item.explanation)}</p>
                  </details>
              </li>`).join('')}</ol>`
        : '<p><strong>Coach Mode 🧠</strong></p><p>Add cue text, summary text, or seed cells first. Future AI Coach Mode can then quiz your content for retention with explanations.</p>';
    openInsightsPanel(panel);
    coachButton?.classList.add('is-active');
    setTimeout(() => coachButton?.classList.remove('is-active'), 800);
    setStatusMessage('Coach Mode opened.', 'info');
}

function initToolbarAssistControls() {
    const dictateButton = document.getElementById('dictateToggle');
    const analyzeButton = document.getElementById('analyzeNotesBtn');
    const coachButton = document.getElementById('coachModeBtn');
    const closeAnalysis = document.getElementById('closeAnalysis');
    const panel = document.getElementById('analysisPanel');
    const contentEl = document.getElementById('analysisContent');

    if (dictateButton) {
        setDictationActive(false, dictateButton);

        dictateButton.addEventListener('click', () => {
            if (isDictating) {
                stopDictation('Dictation stopped.');
            } else {
                startDictation(dictateButton);
            }
        });
    }

    if (analyzeButton) {
        analyzeButton.addEventListener('click', analyzeNotesWithLLM);
    }

    if (coachButton) {
        coachButton.addEventListener('click', showCoachMode);
    }

    if (closeAnalysis && panel && contentEl) {
        closeAnalysis.addEventListener('click', (event) => {
            event.stopPropagation();
            clearAnalysisPanel(panel, contentEl);
            setAnalysisPanelTitle('LLM Insights');
            setStatusMessage('', 'info');
        });
    }

    // Make the LLM Insights header collapse/expand the body, and remember the
    // user's preference between sessions so opening another note keeps the same
    // layout. The close (✕) button stops propagation above so it never toggles.
    const analysisHeader = document.getElementById('analysisHeader');
    if (analysisHeader && panel) {
        const STORAGE_KEY = 'treenotes-analysis-collapsed';
        const apply = (collapsed) => {
            panel.classList.toggle('is-collapsed', collapsed);
            analysisHeader.setAttribute('aria-expanded', String(!collapsed));
        };
        try {
            apply(localStorage.getItem(STORAGE_KEY) === '1');
        } catch (_) {
            // localStorage may be unavailable (private mode); default to expanded.
            apply(false);
        }
        analysisHeader.addEventListener('click', (event) => {
            if (event.target.closest('.analysis-panel__close')) return;
            const next = !panel.classList.contains('is-collapsed');
            apply(next);
            try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch (_) {}
        });
    }

    setStatusMessage('', 'info');
}

function noteInfo() {
    const { heading, cues, notes, summary } = gatherCornellNotes();
    alert(
        [
            heading ? `Heading: ${heading}` : 'Heading: (empty)',
            cues ? `Cue items: ${cues}` : 'Cue items: (empty)',
            notes ? `Notes: ${notes}` : 'Notes: (empty)',
            summary ? `Summary: ${summary}` : 'Summary: (empty)'
        ].join('\n\n')
    );
}

// --------------------------------------------------------------------------
// API (FastAPI backend)
// --------------------------------------------------------------------------

const TREENOTES_API_BASE_KEY = 'treenotes-api-base';
const TREENOTES_NOTE_ID_KEY = 'treenotes-current-note-id';

function getApiBase() {
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get('api');
    if (fromQuery) return fromQuery.replace(/\/$/, '');

    const stored = localStorage.getItem(TREENOTES_API_BASE_KEY);
    if (stored) return stored.replace(/\/$/, '');

    const meta = document.querySelector('meta[name="treenotes-api-base"]');
    if (meta?.content?.trim()) {
        const c = meta.content.trim();
        if (c.startsWith('/')) {
            return `${location.origin}${c.replace(/\/$/, '')}`;
        }
        return c.replace(/\/$/, '');
    }

    if (typeof window.TREENOTES_API_BASE === 'string' && window.TREENOTES_API_BASE.trim()) {
        return window.TREENOTES_API_BASE.trim().replace(/\/$/, '');
    }
    return 'http://127.0.0.1:8000';
}

let currentNoteId = sessionStorage.getItem(TREENOTES_NOTE_ID_KEY) || null;

function setCurrentNoteId(id) {
    currentNoteId = id || null;
    if (id) sessionStorage.setItem(TREENOTES_NOTE_ID_KEY, id);
    else sessionStorage.removeItem(TREENOTES_NOTE_ID_KEY);
    updateApiNoteIndicator();
}

function updateApiNoteIndicator() {
    const el = document.getElementById('apiNoteIndicator');
    if (!el) return;
    if (!currentNoteId) {
        el.hidden = true;
        el.textContent = '';
        return;
    }
    el.hidden = false;
    el.textContent = currentNoteId.slice(0, 8) + '…';
    el.title = 'Server note: ' + currentNoteId;
}

function replaceUrlNoteParam(noteId) {
    const url = new URL(location.href);
    if (noteId) url.searchParams.set('note', noteId);
    else url.searchParams.delete('note');
    history.replaceState({}, '', url);
}

function collectNotebookPayload() {
    return {
        heading: document.getElementById("headingText").innerText.trim(),
        headingStyle: getHeadingStylePayload(),
        cueText: document.getElementById("cueText").innerText.trim(),
        summary: document.getElementById("notesText").innerText.trim(),
        boxes: [...boxes.entries()].map(([id, { box, lines }]) => ({
            id,
            content: getBoxText(box),
            style: {
                left: box.style.left,
                top: box.style.top,
                backgroundColor: box.classList.contains('has-custom-color') ? box.style.backgroundColor : null,
                color: box.classList.contains('has-custom-text-color') ? box.style.color : null
            },
            lines: lines.map(String)
        }))
    };
}

function apiBodyFromCanvas() {
    const raw = collectNotebookPayload();
    return {
        heading: raw.heading,
        headingStyle: raw.headingStyle,
        cueText: raw.cueText,
        summary: raw.summary,
        boxes: raw.boxes.map(b => ({
            id: Number(b.id),
            content: b.content,
            style: {
                left: b.style.left || '0px',
                top: b.style.top || '20px',
                backgroundColor: b.style.backgroundColor || null,
                color: b.style.color || null
            },
            lines: (b.lines || []).map(String)
        }))
    };
}

function aiAnalyzeBodyFromCanvas() {
    const body = apiBodyFromCanvas();
    const aiPrefs = getAiPreferences();
    return {
        ...body,
        llm_provider: aiPrefs.provider,
        llm_model: aiPrefs.model,
        pro_mode: aiPrefs.proMode,
        gemini_api_key: aiPrefs.geminiApiKey,
        openai_api_key: aiPrefs.openaiApiKey,
        ollama_base_url: aiPrefs.ollamaBaseUrl
    };
}

function applyImportedData(data) {
    document.getElementById("headingText").innerText = data.heading || "";
    applyHeadingStylePayload(data.headingStyle || {});
    document.getElementById("cueText").innerText = data.cueText || "";
    document.getElementById("notesText").innerText = data.summary || "";
    // Programmatic innerText assignments above don't fire `input`, so the
    // placeholder system never re-evaluates whether the field is "empty".
    // Recompute it explicitly so placeholder text stops rendering on top of
    // the freshly imported content.
    refreshPlaceholderState(['headingText', 'cueText', 'notesText']);
    document.getElementById("boxes").innerHTML = '';
    document.getElementById("lines").innerHTML = '';
    boxes.clear();
    totalBoxes = 0;

    (data.boxes || []).forEach(({ id, content, style, lines }) => {
        const left = parseInt(style?.left, 10) || 0;
        const top = parseInt(style?.top, 10) || 0;
        const newBox = createNewBlock(left, top, content, { id, contentIsPlaceholder: false });

        if (style?.backgroundColor) {
            if (colorToHex(style.backgroundColor) !== '#F1F1F1') {
                applyBoxCustomColor(newBox, style.backgroundColor);
            } else {
                newBox.style.backgroundColor = '';
                newBox.style.color = '';
                newBox.classList.remove('has-custom-color');
            }
        }

        if (style?.color) {
            applyBoxTextColor(newBox, style.color);
        }

        const entry = boxes.get(newBox.id);
        entry.lines = Array.isArray(lines) ? [...new Set(lines.map(String))] : [];
    });

    (data.boxes || []).forEach(({ id, lines }) => {
        (lines || []).forEach(linkId => {
            newLine(String(id), String(linkId));
        });
    });
}

async function saveNotebookToApi() {
    const api = getApiBase();
    const body = apiBodyFromCanvas();
    setStatusMessage('Saving to server…', 'info');
    try {
        const url = currentNoteId
            ? `${api}/notes/${encodeURIComponent(currentNoteId)}`
            : `${api}/notes`;
        const method = currentNoteId ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const t = await res.text();
            throw new Error(t || res.statusText);
        }
        const doc = await res.json();
        if (doc.id) {
            setCurrentNoteId(doc.id);
            replaceUrlNoteParam(doc.id);
        }
        setStatusMessage('Saved to server.', 'info');
    } catch (e) {
        setStatusMessage('Save failed: ' + (e.message || String(e)), 'error');
    }
}

async function loadNotebookFromApiById(noteId) {
    const api = getApiBase();
    setStatusMessage('Loading from server…', 'info');
    try {
        const res = await fetch(`${api}/notes/${encodeURIComponent(noteId)}`);
        if (res.status === 404) {
            setCurrentNoteId(null);
            replaceUrlNoteParam(null);
            setStatusMessage('Note not found on server.', 'error');
            return;
        }
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        applyImportedData(data);
        const nid = data.id || noteId;
        setCurrentNoteId(nid);
        replaceUrlNoteParam(nid);
        setStatusMessage('Loaded from server.', 'info');
    } catch (e) {
        setStatusMessage('Load failed: ' + (e.message || String(e)), 'error');
    }
}

async function fetchNotesListForDialog() {
    const api = getApiBase();
    const listEl = document.getElementById('apiOpenList');
    const errEl = document.getElementById('apiOpenError');
    if (errEl) {
        errEl.hidden = true;
        errEl.textContent = '';
    }
    if (!listEl) return;
    listEl.innerHTML = '';
    try {
        const res = await fetch(`${api}/notes`);
        if (!res.ok) throw new Error(await res.text());
        const rows = await res.json();
        if (!rows.length) {
            const li = document.createElement('li');
            li.className = 'api-open-list__empty';
            li.textContent = 'No notes yet.';
            listEl.appendChild(li);
            return;
        }
        rows.forEach(row => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            const title = (row.heading || '(no title)').trim() || '(no title)';
            const updated = row.updated_at ? new Date(row.updated_at).toLocaleString() : '';
            btn.type = 'button';
            btn.textContent = title + (updated ? ' — ' + updated : '');
            btn.addEventListener('click', async () => {
                document.getElementById('apiOpenDialog')?.close();
                await loadNotebookFromApiById(row.id);
            });
            li.appendChild(btn);
            listEl.appendChild(li);
        });
    } catch (e) {
        if (errEl) {
            errEl.textContent = e.message || String(e);
            errEl.hidden = false;
        }
    }
}

function openApiNotesDialog() {
    const dlg = document.getElementById('apiOpenDialog');
    if (!dlg) return;
    void fetchNotesListForDialog();
    dlg.showModal();
}

function newBlankNotebook() {
    document.getElementById("headingText").innerText = "";
    resetHeadingStyle();
    document.getElementById("cueText").innerText = "";
    document.getElementById("notesText").innerText = "";
    refreshPlaceholderState(['headingText', 'cueText', 'notesText']);
    document.getElementById("boxes").innerHTML = '';
    document.getElementById("lines").innerHTML = '';
    boxes.clear();
    totalBoxes = 0;
    createNewBlock(0, 20, "New Box", {});
    setCurrentNoteId(null);
    replaceUrlNoteParam(null);
    setStatusMessage('New note (not saved to server yet).', 'info');
}

function initApiIntegration() {
    const baseInput = document.getElementById('api-base-url');
    if (baseInput) {
        baseInput.value = localStorage.getItem(TREENOTES_API_BASE_KEY) || getApiBase();
        baseInput.addEventListener('change', () => {
            const v = baseInput.value.trim();
            if (v) localStorage.setItem(TREENOTES_API_BASE_KEY, v.replace(/\/$/, ''));
            else localStorage.removeItem(TREENOTES_API_BASE_KEY);
        });
    }

    document.getElementById('apiSaveBtn')?.addEventListener('click', () => void saveNotebookToApi());
    document.getElementById('apiOpenBtn')?.addEventListener('click', () => openApiNotesDialog());
    document.getElementById('apiNewBtn')?.addEventListener('click', () => newBlankNotebook());
    document.getElementById('localSaveBtn')?.addEventListener('click', () => download());
    document.getElementById('localOpenBtn')?.addEventListener('click', () => upload());
    document.getElementById('apiOpenRefresh')?.addEventListener('click', () => void fetchNotesListForDialog());
    document.getElementById('apiOpenCancel')?.addEventListener('click', () => {
        document.getElementById('apiOpenDialog')?.close();
    });

    const params = new URLSearchParams(location.search);
    const noteFromUrl = params.get('note');
    if (noteFromUrl && /^[0-9a-f-]{36}$/i.test(noteFromUrl)) {
        void loadNotebookFromApiById(noteFromUrl);
    } else {
        setCurrentNoteId(null);
    }
}

// --------------------------------------------------------------------------
// new additions
// --------------------------------------------------------------------------

 // --------------------------------------------------------------------------
// Download Functionality
// --------------------------------------------------------------------------
function download() {
    const data = collectNotebookPayload();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "treenotes.json";
    a.click();
}

// --------------------------------------------------------------------------
// Upload Functionality
// --------------------------------------------------------------------------
function upload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = evt => {
            const data = JSON.parse(evt.target.result);
            applyImportedData(data);
            setCurrentNoteId(null);
            replaceUrlNoteParam(null);
            setStatusMessage('Loaded from file.', 'info');
        };

        reader.readAsText(file);
    };

    input.click();
}

function toggleDarkMode() {
    const isDarkMode = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = isDarkMode ? '' : 'dark';
    localStorage.setItem('treenotes-theme', document.documentElement.dataset.theme);
}

(function applySavedTheme() {
    const savedTheme = localStorage.getItem('treenotes-theme');
    if (savedTheme) {
        document.documentElement.dataset.theme = savedTheme;
    }
})();

// --------------------------------------------------------------------------
// placeholders and tree menu
// --------------------------------------------------------------------------  
function syncPlaceholderState(el) {
    if (!el) return;
    const text = el.textContent.replace(/\u00A0/g, ' ').trim();
    const isEmpty = text.length === 0;
    el.classList.toggle('is-empty', isEmpty);
    if (isEmpty && el.innerHTML !== '') {
        el.innerHTML = '';
    }
}

// Call after programmatic innerText changes (e.g. importing JSON, clearing on
// "New") — `input` only fires for real user typing, so without this the
// placeholder ::before keeps rendering on top of the freshly assigned text.
function refreshPlaceholderState(idsOrEls) {
    if (!Array.isArray(idsOrEls)) idsOrEls = [idsOrEls];
    idsOrEls.forEach(item => {
        const el = typeof item === 'string' ? document.getElementById(item) : item;
        syncPlaceholderState(el);
    });
}

function setupEditablePlaceholders() {
    const editables = document.querySelectorAll('[contenteditable][data-placeholder]:not(.box)');
    editables.forEach(el => {
        syncPlaceholderState(el);

        el.addEventListener('focus', () => {
            if (el.classList.contains('is-empty')) {
                el.innerHTML = '';
                el.classList.remove('is-empty');
            }
        });

        el.addEventListener('input', () => syncPlaceholderState(el));
        el.addEventListener('blur', () => syncPlaceholderState(el));
    });
}

function initTreeMenu() {
    const treeContainer = document.querySelector('#tree .container');
    const treeMenu = document.getElementById('treeQuickMenu');

    if (!treeContainer || !treeMenu) return;

    const hideMenu = () => {
        treeMenu.classList.remove('visible');
        treeMenu.setAttribute('aria-hidden', 'true');
    };

    // Right-click anywhere on the empty canvas opens the quick menu — left
    // clicks are reserved for selecting/dragging boxes and editing text.
    treeContainer.addEventListener('contextmenu', event => {
        if (event.target.closest('.box') || event.target.closest('#toolbarBar') || event.target.closest('#treeQuickMenu')) {
            return;
        }
        event.preventDefault();

        const rect = treeContainer.getBoundingClientRect();
        const x = event.clientX - rect.left + treeContainer.scrollLeft;
        const y = event.clientY - rect.top + treeContainer.scrollTop;

        treeMenu.classList.add('visible');
        treeMenu.setAttribute('aria-hidden', 'false');
        treeMenu.style.left = `${x}px`;
        treeMenu.style.top = `${y}px`;

        requestAnimationFrame(() => {
            const menuWidth = treeMenu.offsetWidth;
            const menuHeight = treeMenu.offsetHeight;
            const maxLeft = treeContainer.scrollWidth - menuWidth - 12;
            const maxTop = treeContainer.scrollHeight - menuHeight - 12;
            const nextLeft = Math.max(12, Math.min(x, maxLeft));
            const nextTop = Math.max(12, Math.min(y, maxTop));
            treeMenu.style.left = `${nextLeft}px`;
            treeMenu.style.top = `${nextTop}px`;
        });
    });

    // Dismiss the quick menu on Escape.
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && treeMenu.classList.contains('visible')) {
            hideMenu();
        }
    });

    treeMenu.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button) return;

        event.stopPropagation();
        switch (button.dataset.action) {
            case 'info':
                if (typeof noteInfo === 'function') {
                    noteInfo();
                } else {
                    alert('Coming soon!');
                }
                break;
            case 'help':
                document.getElementById('helpDialog').showModal();
                break;
            case 'dark':
                toggleDarkMode();
                break;
            default:
                break;
        }

        hideMenu();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            hideMenu();
        }
    });

    hideMenu();
}

function initResizer() {
    const resizer = document.getElementById('cornell-resizer');
    const leftPanel = document.getElementById('text');
    const rightPanel = document.getElementById('tree');

    if (!resizer || !leftPanel || !rightPanel) return;

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizer.classList.add('is-resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const startX = e.clientX;
        const startWidthLeft = leftPanel.offsetWidth;
        const startWidthRight = rightPanel.offsetWidth;

        const onMouseMove = (e) => {
            if (!isResizing) return;

            const deltaX = e.clientX - startX;
            const newWidthLeft = startWidthLeft + deltaX;
            const newWidthRight = startWidthRight - deltaX;
            
            const totalWidth = leftPanel.parentElement.offsetWidth;
            const leftPercentage = (newWidthLeft / totalWidth) * 100;
            const rightPercentage = (newWidthRight / totalWidth) * 100;

            leftPanel.style.flexBasis = `${leftPercentage}%`;
            rightPanel.style.flexBasis = `${rightPercentage}%`;
        };

        const onMouseUp = () => {
            if (!isResizing) return;
            isResizing = false;
            resizer.classList.remove('is-resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupEditablePlaceholders();
    setupPlainTextPaste();
    setupDictationTargetTracking();
    initDictationPreferences();
    initGridToggle();
    initTreePanning();
    initTreeMenu();
    initToolbarAssistControls();
    initHeadingColorControls();
    initAiPreferences();
    initUiLanguagePreference();
    initFeedbackControls();
    initResizer();
    initApiIntegration();

    // --- GUI Enhancements ---
    // Enforce visibility of status messages and styling of the Cornell canvas
    const guiStyle = document.createElement('style');
    guiStyle.textContent = `
        /* Position status messages prominently just below the top toolbar */
        #statusMessage {
            display: none;
        }
        #statusMessage.is-active {
            display: block !important;
            position: fixed !important;
            top: 70px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            z-index: 10000 !important;
            padding: 12px 24px !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            font-weight: 500 !important;
            background-color: #e6f7ff !important;
            color: #0056b3 !important;
            border: 1px solid #bae1ff !important;
        }
        #statusMessage.is-alert {
            background-color: #fff1f0 !important;
            color: #cf1322 !important;
            border: 1px solid #ffa39e !important;
        }
        
        /* Make main Cornell canvas area all white (in light mode) and large enough for many boxes/seeds */
        html:not([data-theme="dark"]) #tree,
        html:not([data-theme="dark"]) #tree .container,
        html:not([data-theme="dark"]) #zoom {
            background-color: #ffffff !important;
        }
        #zoom {
            min-width: 4000px !important;
            min-height: 4000px !important;
        }
    `;
    document.head.appendChild(guiStyle);

    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if(fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        });
    }

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            fullscreenBtn.textContent = 'Exit Fullscreen';
        } else {
            fullscreenBtn.textContent = '⛶';
        }
    });

    const menuIcon = document.getElementById('menuIcon');
    const menuPopup = document.getElementById('menuPopup');

    if (menuIcon && menuPopup) {
        menuIcon.addEventListener('click', (event) => {
            event.stopPropagation();
            const isHidden = menuPopup.style.display === 'none' || !menuPopup.style.display;
            menuPopup.style.display = isHidden ? 'block' : 'none';
        });

        document.addEventListener('click', () => {
            menuPopup.style.display = 'none';
        });

        menuPopup.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        document.getElementById('toggleDarkMode').addEventListener('click', toggleDarkMode);
        document.getElementById('help').addEventListener('click', () => document.getElementById('helpDialog').showModal());
        document.getElementById('about').addEventListener('click', () => document.getElementById('aboutDialog').showModal());
    }
});
