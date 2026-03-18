import streamlit as st
import cv2
import mediapipe as mp
import numpy as np
import pickle
import time

st.set_page_config(page_title="Sign Detection", layout="wide")
st.title("📷 Real-Time Sign Language Detection")

# Load model and label map
@st.cache_resource
def load_model():
    with open('./model.p', 'rb') as f:
        model_dict = pickle.load(f)
    return model_dict['model'], model_dict['label_map']

model, label_map = load_model()

# MediaPipe hands setup
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.5
)

# Session state for sentence
if 'sentence' not in st.session_state:
    st.session_state.sentence = ""
if 'last_predicted_char' not in st.session_state:
    st.session_state.last_predicted_char = None
if 'last_char_time' not in st.session_state:
    st.session_state.last_char_time = time.time()

# Sidebar
st.sidebar.header("🛠 Controls")
if st.sidebar.button("🔁 Clear Sentence"):
    st.session_state.sentence = ""
    st.rerun()

st.sidebar.markdown("### ➕ Navigation")
if st.sidebar.button("🏠 Back to Home"):
    st.switch_page("app.py")

# Display sentence
st.markdown("### ✍ Predicted Sentence:")
sentence_placeholder = st.empty()
sentence_placeholder.markdown(f"{st.session_state.sentence}")

# Webcam capture
cap = cv2.VideoCapture(0)
cap.set(3, 640)
cap.set(4, 480)

stframe = st.empty()
debounce_time = 1.0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        st.error("Failed to capture webcam frame")
        break

    frame = cv2.flip(frame, 1)
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    H, W, _ = frame.shape

    results = hands.process(frame_rgb)
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            mp_drawing.draw_landmarks(
                frame, hand_landmarks,
                mp_hands.HAND_CONNECTIONS,
                mp_drawing_styles.get_default_hand_landmarks_style(),
                mp_drawing_styles.get_default_hand_connections_style()
            )

            # Extract landmark coordinates
            data_aux = []
            x_ = [lm.x for lm in hand_landmarks.landmark]
            y_ = [lm.y for lm in hand_landmarks.landmark]
            z_ = [lm.z for lm in hand_landmarks.landmark]

            for i in range(21):
                x = (hand_landmarks.landmark[i].x - min(x_)) / (max(x_) - min(x_) + 1e-6)
                y = (hand_landmarks.landmark[i].y - min(y_)) / (max(y_) - min(y_) + 1e-6)
                z = (hand_landmarks.landmark[i].z - min(z_)) / (max(z_) - min(z_) + 1e-6)
                data_aux.extend([x, y, z])

            if len(data_aux) == 63:
                prediction = model.predict([np.asarray(data_aux)])
                predicted_char = label_map[int(prediction[0])]

                current_time = time.time()
                if predicted_char != st.session_state.last_predicted_char:
                    st.session_state.last_predicted_char = predicted_char
                    st.session_state.last_char_time = current_time
                elif current_time - st.session_state.last_char_time >= debounce_time:
                    if predicted_char == 'space':
                        st.session_state.sentence += " "
                    elif predicted_char == 'del':
                        st.session_state.sentence = st.session_state.sentence[:-1]
                    else:
                        st.session_state.sentence += predicted_char
                    st.session_state.last_char_time = current_time

                sentence_placeholder.markdown(f"{st.session_state.sentence}")

                x1, y1 = int(min(x_) * W) - 10, int(min(y_) * H) - 10
                x2, y2 = int(max(x_) * W) + 10, int(max(y_) * H) + 10
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, predicted_char, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 0), 3)

    stframe.image(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB), channels="RGB")

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()