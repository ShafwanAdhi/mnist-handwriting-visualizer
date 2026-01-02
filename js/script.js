
const API_URL =
"https://mnist-cnn-torchscript-inference-api-production.up.railway.app";

// ========== CANVAS SETUP ==========
const gridCanvas = document.getElementById("gridCanvas");
const drawCanvas = document.getElementById("drawCanvas");
const gridCtx = gridCanvas.getContext("2d");
const drawCtx = drawCanvas.getContext("2d");
const clearBtn = document.getElementById("clearBtn");
const predictBtn = document.getElementById("predictBtn");

// Draw 28x28 grid with clear cell boundaries
function drawGrid() {
gridCtx.clearRect(0, 0, 280, 280);

// Background
gridCtx.fillStyle = "#000";
gridCtx.fillRect(0, 0, 280, 280);

// Grid lines
gridCtx.strokeStyle = "#1a1a1a";
gridCtx.lineWidth = 1;

// Draw vertical and horizontal lines
for (let i = 0; i <= 28; i++) {
    const pos = i * 10;

    // Make every 7th line slightly brighter for better orientation
    if (i % 7 === 0) {
    gridCtx.strokeStyle = "#2a2a2a";
    } else {
    gridCtx.strokeStyle = "#1a1a1a";
    }

    // Vertical lines
    gridCtx.beginPath();
    gridCtx.moveTo(pos, 0);
    gridCtx.lineTo(pos, 280);
    gridCtx.stroke();

    // Horizontal lines
    gridCtx.beginPath();
    gridCtx.moveTo(0, pos);
    gridCtx.lineTo(280, pos);
    gridCtx.stroke();
}
}

drawGrid();

// Initialize drawing canvas with transparent background
drawCtx.clearRect(0, 0, 280, 280);

let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Pixel-based drawing array (28x28)
let pixelData = Array(28)
.fill(null)
.map(() => Array(28).fill(0));

// MNIST-style brush with proper fading and pixel alignment
function drawMNISTBrush(x, y) {
// Convert canvas coordinates to 28x28 grid coordinates
const gridX = Math.floor(x / 10);
const gridY = Math.floor(y / 10);

// Apply MNIST-style gaussian brush pattern
const brushPattern = [
    [0.2, 0.5, 0.2],
    [0.5, 1.0, 0.5],
    [0.2, 0.5, 0.2],
];

for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
    const px = gridX + dx;
    const py = gridY + dy;

    if (px >= 0 && px < 28 && py >= 0 && py < 28) {
        const brushValue = brushPattern[dy + 1][dx + 1];
        pixelData[py][px] = Math.min(
        1.0,
        // hyperparameter
        pixelData[py][px] + brushValue * 0.15
        );
    }
    }
}

// Redraw canvas based on pixel data
redrawCanvas();
}

function redrawCanvas() {
drawCtx.clearRect(0, 0, 280, 280);

for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
    if (pixelData[y][x] > 0) {
        const value = Math.floor(pixelData[y][x] * 255);
        drawCtx.fillStyle = `rgba(255, 255, 255, ${pixelData[y][x]})`;
        drawCtx.fillRect(x * 10, y * 10, 10, 10);
    }
    }
}
}

function startDrawing(e) {
isDrawing = true;
const rect = drawCanvas.getBoundingClientRect();
lastX = (e.clientX || e.touches[0].clientX) - rect.left;
lastY = (e.clientY || e.touches[0].clientY) - rect.top;
drawMNISTBrush(lastX, lastY);
}

function draw(e) {
if (!isDrawing) return;
e.preventDefault();

const rect = drawCanvas.getBoundingClientRect();
const currentX = (e.clientX || e.touches[0].clientX) - rect.left;
const currentY = (e.clientY || e.touches[0].clientY) - rect.top;

// Interpolate points for smooth drawing
const dist = Math.sqrt(
    (currentX - lastX) ** 2 + (currentY - lastY) ** 2
);
const steps = Math.max(Math.floor(dist / 7), 1);

for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = lastX + (currentX - lastX) * t;
    const y = lastY + (currentY - lastY) * t;
    drawMNISTBrush(x, y);
}

lastX = currentX;
lastY = currentY;
}

function stopDrawing() {
isDrawing = false;
}

drawCanvas.addEventListener("mousedown", startDrawing);
drawCanvas.addEventListener("mousemove", draw);
drawCanvas.addEventListener("mouseup", stopDrawing);
drawCanvas.addEventListener("mouseout", stopDrawing);

drawCanvas.addEventListener("touchstart", startDrawing);
drawCanvas.addEventListener("touchmove", draw);
drawCanvas.addEventListener("touchend", stopDrawing);

clearBtn.addEventListener("click", () => {
// Clear pixel data
pixelData = Array(28)
    .fill(null)
    .map(() => Array(28).fill(0));
drawCtx.clearRect(0, 0, 280, 280);
document.getElementById("scoresContainer").innerHTML = "";
document.getElementById("bestMatch").textContent = "-";
document.getElementById("latency").classList.add("hidden");
initializeNetwork();
});

// ========== NEURAL NETWORK VISUALIZATION ==========
const svg = document.getElementById("networkSvg");
const layers = {
input: { x: 50, neurons: 1, size: 130, cols: 1, label: "Input" },
conv: {
    x: 400,
    neurons: 10,
    size: 70,
    cols: 1,
    label: "Conv2d + Relu",
},
relu: {
    x: 600,
    neurons: 10,
    size: 70,
    cols: 1,
    label: "conv2d 10 + Relu",
},
maxpool: { x: 800, neurons: 10, size: 70, cols: 1, label: "Maxpool2d" },
dense: { x: 1050, neurons: 10, size: 40, cols: 1, label: "GAP" },
dense2: { x: 1150, neurons: 10, size: 40, cols: 1, label: "FCL" },
output: { x: 1350, neurons: 10, size: 35, cols: 1, label: "Output" },
};

function initializeNetwork() {
svg.innerHTML = "";

// Draw connections first (so they appear behind neurons)
drawConnections("input", "conv");
drawConnections("conv", "relu");
drawConnections("relu", "maxpool");
drawConnections("maxpool", "dense");
drawConnections("dense", "dense2");
drawConnections("dense2", "output");

// Draw neurons
drawLayer("input", layers.input, "#3b82f6");
drawLayerLabel(layers.input);

drawLayer("conv", layers.conv, "#3b82f6");
drawLayerLabel(layers.conv);

drawLayer("relu", layers.relu, "#eab308");
drawLayerLabel(layers.relu);

drawLayer("maxpool", layers.maxpool, "#a855f7");
drawLayerLabel(layers.maxpool);

drawLayer("dense", layers.dense, "#3b82f6");
drawLayerLabel(layers.dense);

drawLayer("dense2", layers.dense2, "#3b82f6");
drawLayerLabel(layers.dense2);

drawLayer("output", layers.output, "#137fec");
drawLayerLabel(layers.output);
}

function drawConnections(fromLayer, toLayer) {
const from = layers[fromLayer];
const to = layers[toLayer];

// Calculate grid layout positions
const fromRows = Math.ceil(from.neurons / from.cols);
const toRows = Math.ceil(to.neurons / to.cols);

const fromStartY = 450 - (fromRows * (from.size + 10)) / 2;
const toStartY = 450 - (toRows * (to.size + 10)) / 2;

for (let i = 0; i < from.neurons; i++) {
    const fromRow = Math.floor(i / from.cols);
    const fromCol = i % from.cols;
    const fromX = from.x + fromCol * (from.size + 15);
    const fromY = fromStartY + fromRow * (from.size + 10);

    // Only draw a subset of connections to avoid clutter
    const step = Math.ceil(to.neurons / 3);
    for (let j = 0; j < to.neurons; j += step) {
    const toRow = Math.floor(j / to.cols);
    const toCol = j % to.cols;
    const toX = to.x + toCol * (to.size + 15);
    const toY = toStartY + toRow * (to.size + 10);

    const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
    );
    line.setAttribute("x1", fromX + from.size / 2);
    line.setAttribute("y1", fromY + from.size / 2);
    line.setAttribute("x2", toX + to.size / 2);
    line.setAttribute("y2", toY + to.size / 2);
    line.setAttribute("class", "connection-line");
    svg.appendChild(line);
    }
}
}

function drawLayer(layerName, layer, color) {
const rows = Math.ceil(layer.neurons / layer.cols);
const startY = 450 - (rows * (layer.size + 10)) / 2;

for (let i = 0; i < layer.neurons; i++) {
    const row = Math.floor(i / layer.cols);
    const col = i % layer.cols;
    const x = layer.x + col * (layer.size + 15);
    const y = startY + row * (layer.size + 10);

    // Create group for neuron
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "neuron");
    g.setAttribute("id", `${layerName}-${i}`);

    // Background rect
    const rect = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
    );
    if (layerName === "dense" || layerName === "dense2") {
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", layer.size);
    rect.setAttribute("height", layer.size);
    rect.setAttribute("fill", "#3b82f6");
    rect.setAttribute("stroke", color);
    rect.setAttribute("stroke-width", "2");
    rect.setAttribute("rx", "180");
    g.appendChild(rect);
    } else {
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", layer.size);
    rect.setAttribute("height", layer.size);
    rect.setAttribute("fill", "#000");
    rect.setAttribute("stroke", color);
    rect.setAttribute("stroke-width", "2");
    rect.setAttribute("rx", "4");
    g.appendChild(rect);
    }

    // Image placeholder
    const image = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "image"
    );
    image.setAttribute("x", x);
    image.setAttribute("y", y);
    image.setAttribute("width", layer.size);
    image.setAttribute("height", layer.size);
    image.setAttribute("id", `${layerName}-img-${i}`);
    image.style.opacity = "0";
    g.appendChild(image);

    // Output layer labels
    if (layerName === "output") {
    const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
    );
    text.setAttribute("x", x + layer.size / 2);
    text.setAttribute("y", y + layer.size / 2);
    text.setAttribute("fill", "#9dabb9");
    text.setAttribute("font-size", "16");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.textContent = i;
    g.appendChild(text);
    }

    svg.appendChild(g);
}
}
function drawLayerLabel(layer) {
const rows = Math.ceil(layer.neurons / layer.cols);
const layerHeight = rows * (layer.size + 10);

const centerX =
    layer.x + ((layer.cols - 1) * (layer.size + 15)) / 2 + layer.size / 2;

const labelY = 450 + layerHeight / 2 + 30;

const title = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
);
title.setAttribute("x", centerX);
title.setAttribute("y", labelY);
title.setAttribute("text-anchor", "middle");
title.setAttribute("fill", "#e5e7eb");
title.setAttribute("font-size", "14");
title.setAttribute("font-weight", "700");
title.textContent = layer.label;
title.setAttribute("class", "layer-title");

svg.appendChild(title);

if (layer.subLabel) {
    const subtitle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
    );
    subtitle.setAttribute("x", centerX);
    subtitle.setAttribute("y", labelY + 16);
    subtitle.setAttribute("text-anchor", "middle");
    subtitle.setAttribute("fill", "#9dabb9");
    subtitle.setAttribute("font-size", "11");
    subtitle.textContent = layer.subLabel;

    svg.appendChild(subtitle);
}
}

initializeNetwork();

// ========== FEATURE MAP VISUALIZATION ==========
function featureMapToDataURL(fmap) {
const size = fmap.length;
const canvas = document.createElement("canvas");
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext("2d");
const imageData = ctx.createImageData(size, size);

let min = Infinity,
    max = -Infinity;
for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
    min = Math.min(min, fmap[i][j]);
    max = Math.max(max, fmap[i][j]);
    }
}

for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
    const normalized = max > min ? (fmap[i][j] - min) / (max - min) : 0;
    const value = Math.floor(normalized * 255);
    const idx = (i * size + j) * 4;
    imageData.data[idx] = value;
    imageData.data[idx + 1] = value;
    imageData.data[idx + 2] = value;
    imageData.data[idx + 3] = 255;
    }
}

ctx.putImageData(imageData, 0, 0);
return canvas.toDataURL();
}

function updateNetworkVisualization(data) {
// Update input neuron with drawn image
const inputImg = document.getElementById("input-img-0");
inputImg.setAttribute("href", drawCanvas.toDataURL());
inputImg.style.opacity = "1";

// Update conv layer (10 features)
const convMaps = [
    data.featuremap11,
    data.featuremap12,
    data.featuremap13,
    data.featuremap14,
    data.featuremap15,
    data.featuremap16,
    data.featuremap17,
    data.featuremap18,
    data.featuremap19,
    data.featuremap110,
];
convMaps.forEach((fmap, i) => {
    const img = document.getElementById(`conv-img-${i}`);
    img.setAttribute("href", featureMapToDataURL(fmap));
    img.style.opacity = "1";
});

// Update relu layer (10 features)
const reluMaps = [
    data.featuremap21,
    data.featuremap22,
    data.featuremap23,
    data.featuremap24,
    data.featuremap25,
    data.featuremap26,
    data.featuremap27,
    data.featuremap28,
    data.featuremap29,
    data.featuremap210,
];
reluMaps.forEach((fmap, i) => {
    const img = document.getElementById(`relu-img-${i}`);
    img.setAttribute("href", featureMapToDataURL(fmap));
    img.style.opacity = "1";
});

// Update maxpool layer (10 features)
const poolMaps = [
    data.featuremap31,
    data.featuremap32,
    data.featuremap33,
    data.featuremap34,
    data.featuremap35,
    data.featuremap36,
    data.featuremap37,
    data.featuremap38,
    data.featuremap39,
    data.featuremap310,
];
poolMaps.forEach((fmap, i) => {
    const img = document.getElementById(`maxpool-img-${i}`);
    img.setAttribute("href", featureMapToDataURL(fmap));
    img.style.opacity = "1";
});

// Update output layer with probabilities
data.probabilities.forEach((prob, i) => {
    const neuron = document.getElementById(`output-${i}`);
    const rect = neuron.querySelector("rect");
    rect.setAttribute("fill", `rgba(19, 127, 236, ${prob})`);
});
}

// ========== API INTEGRATION ==========
function canvasTo28x28() {
// Simply return the pixel data array since we're already tracking it
return pixelData.map((row) => [...row]);
}

function updateScores(probabilities) {
const container = document.getElementById("scoresContainer");
container.innerHTML = "";

const scores = probabilities.map((prob, idx) => ({
    digit: idx,
    prob: prob,
}));
scores.sort((a, b) => b.prob - a.prob);

document.getElementById(
    "bestMatch"
).textContent = `Digit "${scores[0].digit}"`;

scores.forEach((score, idx) => {
    const percentage = (score.prob * 100).toFixed(1);
    const isTop = idx === 0;

    const row = document.createElement("div");
    row.className = `flex items-center gap-4 group ${
    isTop ? "" : "opacity-70"
    }`;

    row.innerHTML = `
        <span class="font-mono w-4 text-center ${
            isTop
            ? "text-white font-bold text-lg"
            : "text-[#9dabb9] text-sm"
        }">${score.digit}</span>
        <div class="flex-1 ${
            isTop ? "h-8" : "h-6"
        } bg-[#111418] rounded-md relative overflow-hidden">
            <div class="absolute top-0 left-0 h-full ${
                isTop
                ? "bg-gradient-to-r from-primary/80 to-primary shadow-[0_0_10px_rgba(19,127,236,0.5)]"
                : "bg-gray-600"
            } rounded-md transition-all duration-1000" style="width: ${percentage}%"></div>
        </div>
        <span class="font-mono w-12 text-right ${
            isTop ? "text-primary font-bold" : "text-[#9dabb9] text-sm"
        }">${percentage}%</span>
    `;

    container.appendChild(row);
});
}

predictBtn.addEventListener("click", async () => {
const statusBadge = document.getElementById("statusBadge");
statusBadge.innerHTML = "Processing";
statusBadge.className =
    "px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 text-xs font-bold border border-yellow-500/20 flex items-center gap-1";

predictBtn.disabled = true;
predictBtn.innerHTML =
    '<span class="material-symbols-outlined text-lg animate-spin">progress_activity</span> Processing...';

try {
    const pixels = canvasTo28x28();

    const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({ pixels }),
    });
    console.log(pixels);

    const data = await response.json();

    if (data.status === "success") {
    updateScores(data.probabilities);
    updateNetworkVisualization(data);

    document.getElementById(
        "latency"
    ).textContent = `Latency: ${data.latency_ms}ms`;
    document.getElementById("latency").classList.remove("hidden");

    statusBadge.innerHTML = "Success";
    statusBadge.className =
        "px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20 flex items-center gap-1";
    } else {
    throw new Error(data.message || "Prediction failed");
    }
} catch (error) {
    console.error("Error:", error);
    statusBadge.innerHTML =
    '<span class="w-2 h-2 rounded-full bg-red-500"></span> Error';
    statusBadge.className =
    "px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 flex items-center gap-1";
    alert("Prediction failed: " + error.message);
} finally {
    predictBtn.disabled = false;
    predictBtn.innerHTML =
    '<span class="material-symbols-outlined text-lg">auto_awesome</span> Predict';
}
});
async function performPrediction() {
const statusBadge = document.getElementById("statusBadge");
statusBadge.innerHTML = "Processing";
statusBadge.className =
    "px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 text-xs font-bold border border-yellow-500/20 flex items-center gap-1";

predictBtn.disabled = true;
predictBtn.innerHTML =
    '<span class="material-symbols-outlined text-lg animate-spin">progress_activity</span> Processing...';

try {
    const pixels = canvasTo28x28();

    const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({ pixels }),
    });

    const data = await response.json();

    if (data.status === "success") {
    updateScores(data.probabilities);
    updateNetworkVisualization(data);

    document.getElementById(
        "latency"
    ).textContent = `Latency: ${data.latency_ms}ms`;
    document.getElementById("latency").classList.remove("hidden");

    statusBadge.innerHTML = "Success";
    statusBadge.className =
        "px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20 flex items-center gap-1";
    } else {
    throw new Error(data.message || "Prediction failed");
    }
} catch (error) {
    console.error("Error:", error);
    statusBadge.innerHTML =
    '<span class="w-2 h-2 rounded-full bg-red-500"></span> Error';
    statusBadge.className =
    "px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 flex items-center gap-1";
    alert("Prediction failed: " + error.message);
} finally {
    predictBtn.disabled = false;
    predictBtn.innerHTML =
    '<span class="material-symbols-outlined text-lg">auto_awesome</span> Predict';
}
}

predictBtn.addEventListener("click", performPrediction);

// ========== LOAD DEFAULT EXAMPLE ON PAGE LOAD ==========
function drawDigit2() {
// Pattern untuk angka 2 (28x28 pixel data)
const digit2Pattern = [
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 0.6, 0.9, 0.9, 0.9, 0.8, 0.4, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.7, 0.9, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
    0.6, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0.2, 0.8, 1.0, 1.0, 1.0, 0.8, 0.5, 0.4, 0.6, 0.9,
    1.0, 1.0, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0.4, 0.9, 1.0, 1.0, 0.7, 0.3, 0, 0, 0, 0, 0.2, 0.8,
    1.0, 0.8, 0.1, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0.3, 0.9, 1.0, 0.6, 0, 0, 0, 0, 0, 0, 0, 0.5, 1.0,
    0.9, 0.2, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0.4, 0.9, 0.5, 0, 0, 0, 0, 0, 0, 0, 0.3, 1.0, 1.0,
    0.3, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0.2, 0.1, 0, 0, 0, 0, 0, 0, 0, 0.4, 1.0, 0.9,
    0.2, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 1.0, 0.8, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 1.0, 1.0, 0.5, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 0.9, 1.0, 0.7, 0.1,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.1, 0.8, 1.0, 0.9, 0.2, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.1, 0.7, 1.0, 1.0, 0.4, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.2, 0.8, 1.0, 1.0, 0.5, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0.1, 0.5, 0.9, 1.0, 1.0, 0.6, 0.1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0.1, 0.6, 0.9, 1.0, 1.0, 0.9, 0.4, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0.2, 0.7, 0.9, 1.0, 1.0, 1.0, 0.7, 0.2, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0.3, 0.9, 1.0, 1.0, 1.0, 0.8, 0.3, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0.1, 0.7, 1.0, 1.0, 1.0, 0.9, 0.4, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 0.9, 0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0.8, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 0.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 0.8, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    ],
    [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    ],
];

// Set pixel data
pixelData = digit2Pattern;
redrawCanvas();
}

// Load default example when page loads
window.addEventListener("load", async () => {
// Draw digit 2
drawDigit2();

// Wait a bit for UI to settle, then perform prediction
setTimeout(async () => {
    await performPrediction();
}, 500);
});