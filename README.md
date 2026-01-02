# MNIST CNN Visualizer

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://shafwanadhi.github.io/mnist-handwriting-visualizer/)
[![API Repository](https://img.shields.io/badge/repo-API-blue)](https://github.com/ShafwanAdhi/mnist-cnn-torchscript-inference-api.git)
[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688)](https://fastapi.tiangolo.com/)
[![TorchScript](https://img.shields.io/badge/model-TorchScript-EE4C2C)](https://pytorch.org/docs/stable/jit.html)

> **Interactive web application for real-time handwritten digit recognition with CNN feature map visualization**

- [Live Demo](https://shafwanadhi.github.io/mnist-handwriting-visualizer/)
- [API Repository](https://github.com/ShafwanAdhi/mnist-cnn-torchscript-inference-api.git)

---

## Product Highlights

This project delivers an **end-to-end machine learning application** that bridges classical computer vision with modern web technologies:

- **Real-time handwritten digit recognition** — Draw digits and get instant predictions with confidence scores
- **CNN feature map visualization** — Watch convolutional layers extract features through Conv → ReLU → Pooling pipeline
- **Client-side MNIST preprocessing** — Automatic 28×28 grayscale normalization matching training distribution
- **Production-deployed inference API** — Low-latency TorchScript model served via FastAPI on Railway

Built to demonstrate **full-stack ML engineering skills**: from model deployment to interactive visualization.

---

## System Architecture

```
┌─────────────────┐
│   User Input    │
│  (Draw Digit)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│   Frontend (Vanilla JS + Canvas)   │
│  • 280×280 drawing canvas           │
│  • Downscale to 28×28 grayscale     │
│  • Normalize (μ=0.1307, σ=0.3081)   │
└────────┬────────────────────────────┘
         │ HTTP POST
         ▼
┌─────────────────────────────────────┐
│    Inference API (FastAPI)          │
│  • TorchScript CNN model            │
│  • Returns: predictions + features  │
│  • Deployed on Railway              │
└────────┬────────────────────────────┘
         │ JSON Response
         ▼
┌─────────────────────────────────────┐
│   Visualization Layer               │
│  • Probability bars (0-9)           │
│  • 30 feature maps (3 conv layers)  │
│  • Network architecture diagram     │
└─────────────────────────────────────┘
```

**Cross-Repository Architecture:**
- **Frontend (this repo)** → User interface, visualization, preprocessing
- **[Backend API](https://github.com/ShafwanAdhi/mnist-cnn-torchscript-inference-api.git)** → Model inference, feature extraction

---

## Tech Stack

### Frontend
- **Vanilla JavaScript**: No framework overhead
- **HTML5 Canvas API**: Drawing interface and pixel manipulation
- **TailwindCSS**: Rapid UI development with dark mode
- **SVG.js**: Dynamic network architecture visualization

### Backend (see [API repository](https://github.com/ShafwanAdhi/mnist-cnn-torchscript-inference-api.git))
- **PyTorch + TorchScript**: Optimized model serialization
- **FastAPI**: Async inference with automatic API docs
- **Railway**: Production deployment with zero-downtime

### Machine Learning
- **CNN Architecture**: 2 Conv layers (10 filters each) + Global Average Pooling
- **MNIST Dataset**: Trained on 60k handwritten digits
- **Feature Extraction**: feature maps visualized in real-time
  - 10 maps from Conv1+ReLU (28×28 resolution)
  - 10 maps from Conv2+ReLU (28×28 resolution)
  - 10 maps from MaxPool (14×14 resolution)

---

## How Inference Works

1. **User draws digit** on 280×280 canvas
2. **Canvas rasterized** to 28×28 grayscale array
3. **Preprocessing applied** (normalization with MNIST statistics)
4. **Data sent** to inference API via POST request
5. **CNN forward pass** executed with TorchScript model
6. **Response received** containing:
   - Predicted digit (0-9)
   - Confidence probabilities for all classes
   - 30 feature maps from network:
     - Layer 1: Conv1+ReLU (10 maps @ 28×28)
     - Layer 2: Conv2+ReLU (10 maps @ 28×28)
     - Layer 3: MaxPool (10 maps @ 14×14)
7. **UI updates** with animated visualization

---

## Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari)
- Active internet connection (for API calls)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/ShafwanAdhi/mnist-handwriting-visualizer.git
cd mnist-visualizer
```

2. **Update API endpoint** (optional, if running local backend)
```javascript
// js/script.js - line 15
const API_URL = 'http://localhost:8000'; // Change from production URL
```

3. **Serve the application**
```bash
# Python
python -m http.server 8080

# Node.js
npx serve

# VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

4. **Open in browser**
```
http://localhost:8080
```

---

## Project Structure

```
mnist-visualizer/
├── index.html              # Main application page
├── css/
│   └── style.css          # Custom styles and animations
├── js/
│   └── script.js          # Core logic: drawing, preprocessing, API calls
└── README.md
```

---

## Features

### Interactive Drawing Canvas
- **Smooth drawing** with mouse/touch support
- **Grid overlay** for visual reference
- **Clear button** for quick resets
- **Responsive design** adapts to screen size

### CNN Architecture Visualization
- **30 feature maps** (10 per extraction stage)
- **Multi-resolution display:**
  - Layers 1-2: High-res 28×28 activations
  - Layer 3: Downsampled 14×14 features
- **Color-coded activations** (heatmap rendering)
- **Stage-by-stage inspection:**
  - Early features: Edges, strokes, curves
  - Mid features: Digit components, loops
  - Late features: Spatially invariant patterns

---

## Related Repositories

| Repository | Description | Status |
|-----------|-------------|---------|
| **[mnist-api](https://github.com/ShafwanAdhi/mnist-cnn-torchscript-inference-api.git)** | FastAPI inference service with TorchScript model | ![Deployed](https://img.shields.io/badge/status-deployed-success) |
| **mnist-visualizer** (this repo) | Interactive web interface and visualization | ![Live](https://img.shields.io/badge/status-live-success) |

---

## Design Decisions

### Why Vanilla JavaScript?
- **Zero build complexity**: No webpack, npm dependencies, or compilation
- **Maximum performance**: Direct Canvas API manipulation for 60fps drawing
- **Easy deployment**: Static hosting on any platform (GitHub Pages, Netlify, Vercel)
- **Learning transparency**: Clear data flow without framework abstractions

### Client-Side Preprocessing Strategy
- **28×28 downsampling** matches MNIST training resolution
- **Normalization** applies training dataset statistics (μ=0.1307, σ=0.3081)
- **Grayscale conversion** ensures single-channel input
- **Reduces API payload** by sending preprocessed data

### Model Architecture Innovation
- **Global Average Pooling (GAP)** instead of traditional flatten+dense layers
  - Reduces parameters from ~1,960 to just 10 (99% reduction)
  - Acts as structural regularizer against overfitting
  - Maintains high accuracy with minimal parameters
- **Minimal architecture**: Only 2 conv layers, no dropout needed
- **Padding strategy**: Preserves 28×28 spatial resolution through conv layers

### Why Feature Map Visualization?
- **Educational value**: Shows how CNNs learn hierarchical features:
  - **Conv1:** Basic edges and stroke detection (vertical, horizontal, diagonal)
  - **Conv2:** Complex patterns and digit components (loops, curves, junctions)
  - **MaxPool:** Spatially invariant, position-tolerant features
- **Debugging tool**: Identifies model behavior on edge cases
- **Differentiator**: Most MNIST demos only show predictions, not the full feature extraction pipeline

---

## License

MIT License - feel free to use this project for learning and portfolio purposes.

---

## Author

**Shafwan Adhi Dwi Nugraha**
- GitHub: [@ShafwanAdhi](https://github.com/ShafwanAdhi)
- LinkedIn: [Shafwan Adhi Dwi](https://www.linkedin.com/in/shafwan-adhi-dwi-b90943321/)

---

## Acknowledgments

- **MNIST Dataset** — Yann LeCun et al.
- **PyTorch** — Facebook AI Research
- **FastAPI** — Sebastián Ramírez
- **TailwindCSS** — Tailwind Labs

---

**If you found this project useful, please consider starring the repository!**
