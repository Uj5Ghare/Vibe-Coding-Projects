import pickle
import cv2
import mediapipe as mp
import numpy as np
import time

# Load the trained model and label mapping
with open('./model.p', 'rb') as f:
    model_dict = pickle.load(f)
model = model_dict['model']
label_map = {
    0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'del', 5: 'E',
    6: 'F', 7: 'G', 8: 'H', 9: 'I', 10: 'J', 11: 'K',
    12: 'L', 13: 'M', 14: 'N', 15: 'nothing', 16: 'O',
    17: 'P', 18: 'Q', 19: 'R', 20: 'S', 21: 'space',
    22: 'T', 23: 'U', 24: 'V', 25: 'W', 26: 'X',
    27: 'Y', 28: 'Z'
}

# Print model info for debugging
print(f"Model expects {model.n_features_in_} features")

# Initialize webcam
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# Initialize MediaPipe
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.3
)

# Initialize variables
sentence = ""
last_predicted_char = None
last_char_time = time.time()
debounce_time = 1.0

# Button properties
button_pos = (10, 100)
button_size = (100, 40)
button_color = (255, 0, 0)
button_text = "Clear"

def clear_sentence(event, x, y, flags, param):
    global sentence
    if event == cv2.EVENT_LBUTTONDOWN:
        if (button_pos[0] <= x <= button_pos[0] + button_size[0] and
            button_pos[1] <= y <= button_pos[1] + button_size[1]):
            sentence = ""

cv2.namedWindow('Sign Language Detector')
cv2.setMouseCallback('Sign Language Detector', clear_sentence)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame")
        break

    # Flip the frame horizontally
    frame = cv2.flip(frame, 1)
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    H, W, _ = frame.shape

    results = hands.process(frame_rgb)

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            # Draw landmarks
            mp_drawing.draw_landmarks(
                frame,
                hand_landmarks,
                mp_hands.HAND_CONNECTIONS,
                mp_drawing_styles.get_default_hand_landmarks_style(),
                mp_drawing_styles.get_default_hand_connections_style()
            )

            # Extract coordinates
            data_aux = []
            x_ = []
            y_ = []
            z_ = []

            # Collect coordinates
            for landmark in hand_landmarks.landmark:
                x_.append(landmark.x)
                y_.append(landmark.y)
                z_.append(landmark.z)

            # Process all 21 landmarks
            for i in range(21):
                x = hand_landmarks.landmark[i].x
                y = hand_landmarks.landmark[i].y
                z = hand_landmarks.landmark[i].z
                
                # Normalize coordinates
                data_aux.extend([
                    (x - min(x_)) / (max(x_) - min(x_) + 1e-6),
                    (y - min(y_)) / (max(y_) - min(y_) + 1e-6),
                    (z - min(z_)) / (max(z_) - min(z_) + 1e-6)
                ])

            # Make prediction if we have the correct number of features
            if len(data_aux) == 63:  # 21 landmarks * 3 coordinates
                prediction = model.predict([np.asarray(data_aux)])
                predicted_char = label_map[int(prediction[0])]

                # Debouncing logic
                current_time = time.time()
                if predicted_char != last_predicted_char:
                    last_predicted_char = predicted_char
                    last_char_time = current_time
                elif current_time - last_char_time >= debounce_time:
                    if sentence == "" or predicted_char != sentence[-1]:
                        if predicted_char == 'space':
                            sentence += " "
                        elif predicted_char == 'del':
                            sentence = sentence[:-1] if sentence else ""
                        else:
                            sentence += predicted_char
                    last_char_time = current_time

                # Draw bounding box and prediction
                x1, y1 = int(min(x_) * W) - 10, int(min(y_) * H) - 10
                x2, y2 = int(max(x_) * W) + 10, int(max(y_) * H) + 10
                
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, predicted_char, (x1, y1 - 10),
                          cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 0), 3,
                          cv2.LINE_AA)

    # Draw the clear button
    cv2.rectangle(frame, button_pos, 
                 (button_pos[0] + button_size[0], button_pos[1] + button_size[1]),
                 button_color, -1)
    cv2.putText(frame, button_text, (button_pos[0] + 10, button_pos[1] + 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)

    # Display the sentence
    cv2.putText(frame, "Sentence: " + sentence, (10, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2, cv2.LINE_AA)

    # Show the frame
    cv2.imshow('Sign Language Detector', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()