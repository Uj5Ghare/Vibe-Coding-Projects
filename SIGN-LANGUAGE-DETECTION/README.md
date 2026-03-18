## Sign Detect — Real‑Time Sign Language Detection

![Sign Language Detection](images/homepage.jpg)


A Streamlit app that detects hand gestures from your webcam using MediaPipe and classifies them into A–Z plus special tokens (`space`, `del`, `nothing`) with a scikit‑learn Random Forest model.

### Features
- Real‑time webcam inference with MediaPipe Hands
- RandomForestClassifier trained on 63‑dim landmark features (21 points × x,y,z)
- Streamlit UI with multi‑page navigation
- Utilities to build a dataset and train/evaluate the model

### Project Structure
```
.
├─ app.py                      # Streamlit home page
├─ pages/
│  └─ _Sign_Language_Detection.py   # Streamlit detection page
├─ create_dataset.py           # Build dataset (data.pickle) from image folders
├─ train_model.py              # Train Random Forest, save model.p and reports
├─ inference_classifier.py     # Standalone OpenCV webcam inference (no Streamlit)
├─ images/                     # App images
├─ data/                       # Image dataset folders 0..28 (ignored by git)
├─ requirements.txt
└─ (artifacts) model.p, data.pickle, training_report.txt, confusion_matrix.png
```

### Requirements
- Python 3.9–3.11
- Windows/macOS/Linux

Install dependencies:
```bash
pip install -r requirements.txt
```

### Dataset Preparation
The app expects a dataset organized as numbered class folders:
```
data/
  0/  1/  2/ ... 28/
  # 0..28 map to: A..Z plus {del, nothing, space}
```

By default, `create_dataset.py` uses a Windows path in `DATA_DIR`:
```python
DATA_DIR = r'C:\Users\Jay Sadhu\OneDrive\Desktop\sgp\data'
```
If your path differs, update that constant, or change it to be relative to the repo:
```python
# Optionally replace in create_dataset.py
import os
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
```

Generate the feature dataset:
```bash
python create_dataset.py
# → writes data.pickle
```

### Train the Model
```bash
python train_model.py
# → saves model.p, training_report.txt, confusion_matrix.png
```

### Run the Streamlit App
```bash
streamlit run app.py
```
In the home page, click “Go to Sign Language Detection”. Allow camera permissions.

### Real-Time Detection Page (`_Sign_Language_Detection.py`)
This page is the core of the project, providing interactive webcam inference:
-   **Live Webcam Feed:** Renders 640×480 video with real-time gesture overlays.
-   **Hand Landmarks:** Uses MediaPipe to track 21 hand points and draw bounding boxes.
-   **Sentence Building:** 
    -   **Debouncing:** Predicted signs are added to a sentence after staying steady for 1.0 second.
    -   **Special Tokens:** Support for `space` (adds a space) and `del` (removes last character).
-   **Controls:** A sidebar toggle to clear the entire sentence and a "Back to Home" button.
-   **Performance:** Uses `@st.cache_resource` to load the model once, ensuring fast inference.


### Standalone Webcam Inference (optional)
```bash
python inference_classifier.py
# Press 'q' to quit
```

### Tips & Troubleshooting
- Webcam not detected: try a different camera index in `cv2.VideoCapture(0)` → `1` or `2`.
- Mediapipe install issues on Windows: ensure Python 64‑bit and upgrade pip (`python -m pip install -U pip`).
- Low accuracy: collect more balanced images per class, then regenerate `data.pickle` and retrain.


