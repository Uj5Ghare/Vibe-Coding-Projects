import os
import pickle
import mediapipe as mp
import cv2
import numpy as np

# Define the data directory path
DATA_DIR = r'/home/hello/Testing/Projects/SIGN-LANGUAGE-DETECTION-/data'

# Initialize MediaPipe with more lenient settings
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=1,
    min_detection_confidence=0.3,  # Lowered from 0.5 for better detection
    model_complexity=1
)

# Disable TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

def preprocess_image(img):
    """Preprocess image to improve hand detection"""
    # Resize image while maintaining aspect ratio
    height, width = img.shape[:2]
    max_dim = 640
    scale = max_dim / max(height, width)
    new_width = int(width * scale)
    new_height = int(height * scale)
    img = cv2.resize(img, (new_width, new_height))

    # Enhance contrast
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    l = clahe.apply(l)
    lab = cv2.merge((l,a,b))
    img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    return img

def create_dataset():
    data = []
    labels = []
    
    # Check if data directory exists
    if not os.path.exists(DATA_DIR):
        print(f"Error: Directory {DATA_DIR} not found!")
        print(f"Current working directory: {os.getcwd()}")
        print("Please make sure you have a 'data' folder in the same directory as this script.")
        return None, None

    # Print directory contents for debugging
    print(f"Contents of current directory: {os.listdir('.')}")
    if os.path.exists(DATA_DIR):
        print(f"Contents of data directory: {os.listdir(DATA_DIR)}")

    total_processed = 0
    total_detected = 0

    for dir_ in sorted(os.listdir(DATA_DIR)):
        dir_path = os.path.join(DATA_DIR, dir_)
        
        if not os.path.isdir(dir_path) or not dir_.isdigit():
            continue

        class_num = int(dir_)
        print(f"\nProcessing class {class_num}...")

        images = [f for f in os.listdir(dir_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        if not images:
            print(f"No images found in {dir_path}")
            continue

        # Limit images per class for faster processing
        MAX_IMAGES_PER_CLASS = 300
        if len(images) > MAX_IMAGES_PER_CLASS:
            import random
            random.seed(42)  # For reproducibility
            images = random.sample(images, MAX_IMAGES_PER_CLASS)

        print(f"Found {len(images)} images in class {class_num}")
        
        class_processed = 0
        class_detected = 0

        for img_name in images:
            img_path = os.path.join(dir_path, img_name)
            
            # Read and preprocess image
            img = cv2.imread(img_path)
            if img is None:
                print(f"Could not read image: {img_path}")
                continue

            # Preprocess image
            img = preprocess_image(img)
            
            # Try different color spaces for better detection
            color_spaces = [
                cv2.cvtColor(img, cv2.COLOR_BGR2RGB),
                cv2.cvtColor(img, cv2.COLOR_BGR2GRAY),
                cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            ]

            hand_detected = False
            for img_processed in color_spaces:
                if len(img_processed.shape) == 2:  # If grayscale
                    img_processed = cv2.cvtColor(img_processed, cv2.COLOR_GRAY2RGB)
                
                results = hands.process(img_processed)
                
                if results.multi_hand_landmarks:
                    hand_detected = True
                    for hand_landmarks in results.multi_hand_landmarks:
                        data_aux = []
                        x_ = []
                        y_ = []
                        z_ = []

                        for landmark in hand_landmarks.landmark:
                            x_.append(landmark.x)
                            y_.append(landmark.y)
                            z_.append(landmark.z)

                        # Only normalize if we have valid ranges
                        if len(x_) > 0 and len(y_) > 0 and len(z_) > 0:
                            x_range = max(x_) - min(x_)
                            y_range = max(y_) - min(y_)
                            z_range = max(z_) - min(z_)
                            
                            if x_range > 0 and y_range > 0 and z_range > 0:
                                for landmark in hand_landmarks.landmark:
                                    data_aux.extend([
                                        (landmark.x - min(x_)) / x_range,
                                        (landmark.y - min(y_)) / y_range,
                                        (landmark.z - min(z_)) / z_range
                                    ])
                                
                                data.append(data_aux)
                                labels.append(class_num)
                                class_detected += 1
                                break  # Break if we successfully processed a hand

                if hand_detected:
                    break

            class_processed += 1
            total_processed += 1

            # Print progress
            if class_processed % 100 == 0:
                print(f"Processed {class_processed}/{len(images)} images in class {class_num}")
                print(f"Detected hands: {class_detected}")

        print(f"\nClass {class_num} complete:")
        print(f"Processed: {class_processed} images")
        print(f"Successfully detected hands: {class_detected}")
        print(f"Detection rate: {(class_detected/class_processed)*100:.2f}%")

    print(f"\nTotal processing complete:")
    print(f"Total images processed: {total_processed}")
    print(f"Total hands detected: {len(data)}")
    print(f"Overall detection rate: {(len(data)/total_processed)*100:.2f}%")

    return data, labels

def main():
    print("Starting dataset creation...")
    print(f"Looking for data in: {os.path.abspath(DATA_DIR)}")
    
    # Create data directory if it doesn't exist
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        print(f"Created data directory at: {DATA_DIR}")
        print("Please add your image folders (0-28) to the data directory and run again.")
        return
    
    data, labels = create_dataset()
    
    if data is None or len(data) == 0:
        print("Error: No data was collected!")
        print("Please ensure your data directory has the following structure:")
        print("data/")
        print("  ├── 0/  (for letter 'A')")
        print("  │   ├── image1.jpg")
        print("  │   ├── image2.jpg")
        print("  │   └── ...")
        print("  ├── 1/  (for letter 'B')")
        print("  └── ... (up to 28 for letter 'Z')")
        return
    
    print(f"\nDataset creation completed:")
    print(f"Total samples: {len(data)}")
    print(f"Features per sample: {len(data[0]) if data else 0}")
    print(f"Number of classes: {len(set(labels))}")

    # Save dataset
    with open('data.pickle', 'wb') as f:
        pickle.dump({'data': data, 'labels': labels}, f)
    
    print("\nDataset saved successfully to data.pickle")

if __name__ == "__main__":
    main()