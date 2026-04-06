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

// Get the first DOM element with the class "box". This is likely the initial box.
const seed = document.querySelectorAll(".box")[0];

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

    // Event listener for when the box loses focus (blur event).
    // Resets the box height and updates connected lines.
    box.addEventListener("blur", () => {
        box.style.height = "7px";
        updateLinesPosition(box);
    });

    // Event listener for when the box is clicked.
    // Shows the toolbar associated with the clicked box.
    box.addEventListener("click", () => {
        box.style.height = "fit-content";
        const toolbar = document.getElementById('toolbar');
        const rect = box.getBoundingClientRect();
        toolbar.style.left = rect.right + 'px';
        toolbar.style.top = rect.top + 'px';
        const colorPicker = document.getElementById("boxColor");
        colorPicker.value = colorToHex(box.style.backgroundColor);
        toolbar.style.display = 'block';
        document.getElementById("toolbar").dataset.boxId = box.id;
    });

    // Event listener for when the mouse button is pressed down on the box.
    // Initiates the dragging process.
    box.addEventListener("mousedown", (e) => {
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
 * @param {string} [content="New Box"] - The initial text content of the new box.
 * @param {{id?: string|number}} [options={}] - Optional metadata (currently only supports an explicit id).
 * @returns {HTMLElement} The newly created box element.
 */
function createNewBlock(x = 0, y = 20, content = "New Box", options = {}) {
    const { id: requestedId = null } = options;
    const newBox = document.createElement('div');
    const resolvedId = requestedId !== null ? String(requestedId) : String(++totalBoxes);

    totalBoxes = Math.max(totalBoxes, Number(resolvedId));

    newBox.id = resolvedId;
    newBox.className = "box";
    newBox.style.position = "absolute";
    newBox.style.left = `${x}px`;
    newBox.style.top = `${y}px`;
    newBox.style.backgroundColor = "#f1f1f1";
    newBox.contentEditable = true;
    newBox.textContent = content;

    const footer = document.createElement("h6");
    footer.innerHTML = `#${resolvedId}`;
    footer.className = "boxFooter";
    newBox.appendChild(footer);

    document.getElementById("boxes").appendChild(newBox);
    makeDraggable(newBox);
    listenForImagePaste(newBox);

    boxes.set(newBox.id, {
        box: newBox,
        lines: []
    });

    return newBox;
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
// Image Pasting Functionality
// --------------------------------------------------------------------------

/**
 * Attaches an event listener to a given HTML element to handle image pasting.
 * When an image is pasted, it creates an <img> tag and appends it to the element.
 * @param {HTMLElement} box - The HTML element to which the paste listener will be attached.
 */
function listenForImagePaste(box) {
    box.addEventListener('paste', function (event) {
        let items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (let item of items) {
            if (item.type.indexOf("image") === 0) {
                event.preventDefault();
                let blob = item.getAsFile();
                let reader = new FileReader();
                reader.onload = function (event) {
                    let img = document.createElement("img");
                    img.src = event.target.result;
                    img.style.maxWidth = "100%";
                    box.appendChild(img);
                };
                reader.readAsDataURL(blob);
            }
        }
    });
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

    if (toolbar && !event.target.closest('#boxes')) {
        toolbar.style.display = 'none';
    }

    if (textToolbar && !event.target.closest("#textToolbar")) {
        textToolbar.style.display = 'none';
    }

    if (treeMenu && !event.target.closest('#treeQuickMenu') && !event.target.closest('#tree .container')) {
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
    document.getElementById("boxColor").addEventListener("change", (e) => {
        const box = document.getElementById(e.target.parentNode.dataset.boxId);
        box.style.backgroundColor = colorToHex(e.target.value);
    });

    // Event listener for the "addBox" button
    document.getElementById("addBox").addEventListener("click", e => {
        const box = document.getElementById(e.target.parentNode.dataset.boxId);
        addBlock(box);
    });

    // Event listener for the "deleteBox" button
    document.getElementById("deleteBox").addEventListener("click", e => {
        const box = document.getElementById(e.target.parentNode.dataset.boxId);
        deleteBox(box);
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

function gatherCornellNotes() {
    const boxesWrapper = document.getElementById('boxes');
    let noteBody = '';

    if (boxesWrapper) {
        noteBody = Array.from(boxesWrapper.querySelectorAll('.box'))
            .map(box => {
                const id = box.id ? `#${box.id}` : '';
                const text = box.cloneNode(true);
                text.querySelector('.boxFooter')?.remove();
                return `Box ${id}`.trim() + ': ' + text.textContent.trim();
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

async function analyzeNotesWithLLM() {
    const analyzeBtn = document.getElementById('analyzeNotesBtn');
    const panel = document.getElementById('analysisPanel');
    const contentEl = document.getElementById('analysisContent');

    if (!analyzeBtn || !panel || !contentEl) return;

    const { heading, cues, notes, summary } = gatherCornellNotes();

    const prompt = [
        'You are an academic assistant analysing Cornell notes.',
        'Review the provided sections (Heading, Cue column, Notes, Summary) and return:',
        '- Three bullet-point insights that connect cues to notes.',
        '- Any gaps or follow-up questions the student should address.',
        '- One actionable recommendation to deepen understanding.',
        '',
        'Heading:',
        heading || '(none)',
        '',
        'Cue Column:',
        cues || '(empty)',
        '',
        'Notes Column:',
        notes || '(empty)',
        '',
        'Summary:',
        summary || '(empty)',
        '',
        'Respond concisely using Markdown bullets where appropriate.'
    ].join('\n');

    analyzeBtn.disabled = true;
    analyzeBtn.classList.add('is-active');
    panel.hidden = true;
    contentEl.textContent = '';
    setStatusMessage('Contacting local Ollama model...', 'info');

    const model = localStorage.getItem('treenotes-ollama-model') || 'llama3';

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`Model request failed (${response.status})`);
        }

        let aggregate = '';

        if (response.body && response.body.getReader) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(Boolean);

                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.response) {
                            aggregate += parsed.response;
                            contentEl.textContent = aggregate;
                        }
                    } catch (error) {
                        aggregate += line;
                        contentEl.textContent = aggregate;
                    }
                }
            }
        } else {
            const data = await response.json();
            aggregate = data.response || '';
            contentEl.textContent = aggregate;
        }

        aggregate = (aggregate || '').trim();

        if (aggregate) {
            panel.hidden = false;
            contentEl.textContent = aggregate;
            setStatusMessage('Analysis complete.', 'info');
        } else {
            setStatusMessage('Model returned no content.', 'error');
        }
    } catch (error) {
        console.error('LLM analysis error:', error);
        setStatusMessage('Unable to reach Ollama. Ensure it is running at http://localhost:11434.', 'error');
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.classList.remove('is-active');
    }
}

function initToolbarAssistControls() {
    const dictateButton = document.getElementById('dictateToggle');
    const analyzeButton = document.getElementById('analyzeNotesBtn');
    const closeAnalysis = document.getElementById('closeAnalysis');
    const panel = document.getElementById('analysisPanel');
    const contentEl = document.getElementById('analysisContent');

    if (dictateButton) {
        const updateButton = () => {
            dictateButton.classList.toggle('is-active', isDictating);
            dictateButton.setAttribute('aria-pressed', String(isDictating));
        };

        updateButton();

        dictateButton.addEventListener('click', () => {
            isDictating = !isDictating;
            updateButton();
            if (isDictating) {
                setStatusMessage('Dictation placeholder active (integration pending).', 'info');
            } else {
                setStatusMessage('', 'info');
            }
        });
    }

    if (analyzeButton) {
        analyzeButton.addEventListener('click', analyzeNotesWithLLM);
    }

    if (closeAnalysis && panel && contentEl) {
        closeAnalysis.addEventListener('click', () => {
            panel.hidden = true;
            contentEl.textContent = '';
            setStatusMessage('', 'info');
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
// new additions
// --------------------------------------------------------------------------

 // --------------------------------------------------------------------------
// Download Functionality
// --------------------------------------------------------------------------
function download() {
    const data = {
        heading: document.getElementById("headingText").innerText.trim(),
        cueText: document.getElementById("cueText").innerText.trim(),
        summary: document.getElementById("notesText").innerText.trim(),
        boxes: [...boxes.entries()].map(([id, { box, lines }]) => ({
            id,
            content: box.childNodes[0]?.textContent?.trim() || "",
            style: {
                left: box.style.left,
                top: box.style.top,
                backgroundColor: box.style.backgroundColor
            },
            lines: lines.map(String)
        }))
    };

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

            document.getElementById("headingText").innerText = data.heading || "";
            document.getElementById("cueText").innerText = data.cueText || "";
            document.getElementById("notesText").innerText = data.summary || "";
            document.getElementById("boxes").innerHTML = '';
            document.getElementById("lines").innerHTML = '';
            boxes.clear();
            totalBoxes = 0;

            (data.boxes || []).forEach(({ id, content, style, lines }) => {
                const left = parseInt(style?.left, 10) || 0;
                const top = parseInt(style?.top, 10) || 0;
                const newBox = createNewBlock(left, top, content, { id });

                if (style?.backgroundColor) {
                    newBox.style.backgroundColor = style.backgroundColor;
                }

                const entry = boxes.get(newBox.id);
                entry.lines = Array.isArray(lines) ? [...new Set(lines.map(String))] : [];
            });

            (data.boxes || []).forEach(({ id, lines }) => {
                (lines || []).forEach(linkId => {
                    newLine(String(id), String(linkId));
                });
            });
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
function setupEditablePlaceholders() {
    const editables = document.querySelectorAll('[contenteditable][data-placeholder]');

    const syncState = (el) => {
        const text = el.textContent.replace(/\u00A0/g, ' ').trim();
        const isEmpty = text.length === 0;
        el.classList.toggle('is-empty', isEmpty);
        if (isEmpty && el.innerHTML !== '') {
            el.innerHTML = '';
        }
    };

    editables.forEach(el => {
        syncState(el);

        el.addEventListener('focus', () => {
            if (el.classList.contains('is-empty')) {
                el.innerHTML = '';
                el.classList.remove('is-empty');
            }
        });

        el.addEventListener('input', () => syncState(el));
        el.addEventListener('blur', () => syncState(el));
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

    treeContainer.addEventListener('click', event => {
        if (event.target.closest('.box') || event.target.closest('#toolbarBar') || event.target.closest('#treeQuickMenu')) {
            return;
        }

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
                alert('Coming soon!');
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
    initGridToggle();
    initTreePanning();
    initTreeMenu();
    initToolbarAssistControls();
    initResizer();

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
        document.getElementById('help').addEventListener('click', () => alert('Coming soon!'));
        document.getElementById('about').addEventListener('click', () => alert('Coming soon!'));
    }
});
