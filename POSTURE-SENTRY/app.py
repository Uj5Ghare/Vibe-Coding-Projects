import cv2
import mediapipe as mp
import time
import numpy as np
import subprocess
import threading
import queue

# Initialize MediaPipe Pose using the new tasks API
BaseOptions = mp.tasks.BaseOptions
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
PoseLandmark = mp.tasks.vision.PoseLandmark
PoseLandmarksConnections = mp.tasks.vision.PoseLandmarksConnections
VisionRunningMode = mp.tasks.vision.RunningMode
drawing_utils = mp.tasks.vision.drawing_utils

# Create PoseLandmarker options
import os
model_path = os.path.join(os.path.dirname(__file__), 'pose_landmarker.task')
options = PoseLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=model_path),
    min_pose_detection_confidence=0.5,
    running_mode=VisionRunningMode.VIDEO
)

# Create a function to initialize pose landmarker
def create_pose_landmarker():
    return PoseLandmarker.create_from_options(options)

pose_landmarker = create_pose_landmarker()

def ask_camera_permission(purpose="access the camera"):
    """Ask user for permission to access camera"""
    print("\n" + "="*60)
    print("📷 CAMERA PERMISSION REQUEST")
    print("="*60)
    print(f"This application needs to {purpose}.")
    print("The camera will be used to:")
    print("  - Detect your posture")
    print("  - Monitor your sitting position")
    print("  - Send alerts when poor posture is detected")
    print("\n⚠️  Privacy Note: Video data is processed locally and")
    print("   is NOT stored or transmitted anywhere.")
    print("="*60)
    
    while True:
        response = input("\nDo you grant permission to access your camera? (yes/no): ").strip().lower()
        if response in ['yes', 'y']:
            print("✓ Permission granted. Starting camera...")
            return True
        elif response in ['no', 'n']:
            print("✗ Permission denied. Exiting application.")
            return False
        else:
            print("Please enter 'yes' or 'no'.")

def check_camera_available():
    """Check if camera is available"""
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        cap.release()
        return False
    cap.release()
    return True

def calibrate_posture():
    # Ask for camera permission
    if not ask_camera_permission("calibrate your posture"):
        return None
    
    # Check if camera is available
    if not check_camera_available():
        print("❌ Error: Camera is not available. Please check your camera connection.")
        return None
    
    cap = cv2.VideoCapture(0)
    print("\nSit straight and relax! Calibration starting in 3 seconds...")
    time.sleep(3)
    
    baseline_nose_y = []
    start_time = time.time()
    frame_timestamp_ms = 0

    # Capture data for 5 seconds to get an average
    while time.time() - start_time < 5:
        ret, frame = cap.read()
        if not ret:
            break

        # Convert to RGB for MediaPipe
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        
        # Process the frame
        pose_landmarker_result = pose_landmarker.detect_for_video(mp_image, frame_timestamp_ms)
        frame_timestamp_ms += int(1000 / 30)  # Assuming ~30 fps

        if pose_landmarker_result.pose_landmarks:
            # Get the first person's landmarks
            landmarks = pose_landmarker_result.pose_landmarks[0]
            # Landmark NOSE (index 0) is the Nose
            nose_y = landmarks[int(PoseLandmark.NOSE)].y
            baseline_nose_y.append(nose_y)
            
            # Optional: Draw the landmarks so you can see it working
            drawing_utils.draw_landmarks(
                frame, 
                landmarks, 
                PoseLandmarksConnections.POSE_LANDMARKS,
                drawing_utils.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                drawing_utils.DrawingSpec(color=(0, 0, 255), thickness=2)
            )

        cv2.imshow('Calibration - Sit Straight!', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

    if baseline_nose_y:
        avg_baseline = sum(baseline_nose_y) / len(baseline_nose_y)
        print(f"Calibration Complete! Your Golden Baseline Y-coordinate is: {avg_baseline:.4f}")
        return avg_baseline
    else:
        print("Error: Could not detect landmarks. Try again in better lighting.")
        return None

def send_notification(message):
    """Send a desktop notification"""
    try:
        subprocess.run(['notify-send', 'Posture Alert', message], check=False)
    except:
        # Fallback to print if notify-send is not available
        print(f"\n🔔 NOTIFICATION: {message}\n")

def camera_capture_thread(cap, frame_queue, stop_event):
    """Background thread for capturing camera frames"""
    while not stop_event.is_set():
        ret, frame = cap.read()
        if not ret:
            break
        # Put frame in queue (non-blocking, drop old frames if queue is full)
        try:
            frame_queue.put_nowait(frame)
        except queue.Full:
            # Drop the oldest frame and add the new one
            try:
                frame_queue.get_nowait()
                frame_queue.put_nowait(frame)
            except queue.Empty:
                pass
        time.sleep(1/30)  # ~30 fps

def monitor_posture(avg_baseline, run_in_background=False):
    """Monitor posture and send notification if threshold exceeded for >10 seconds"""
    threshold = avg_baseline + 0.10
    
    # Ask for camera permission for monitoring
    if not ask_camera_permission("monitor your posture"):
        return
    
    # Check if camera is available
    if not check_camera_available():
        print("❌ Error: Camera is not available. Please check your camera connection.")
        return
    
    print(f"\nStarting posture monitoring...")
    print(f"Baseline: {avg_baseline:.4f}, Threshold: {threshold:.4f}")
    print("Monitoring will alert if nose Y-value exceeds threshold for more than 10 seconds.")
    
    if run_in_background:
        print("🔄 Running in background mode - camera will operate in background.")
        print("   Press Ctrl+C to stop monitoring.\n")
    else:
        print("Press 'q' to quit monitoring.\n")
    
    cap = cv2.VideoCapture(0)
    pose_landmarker = create_pose_landmarker()
    
    frame_timestamp_ms = 0
    threshold_exceeded_start = None
    notification_sent = False
    
    # Setup for background operation
    if run_in_background:
        frame_queue = queue.Queue(maxsize=2)
        stop_event = threading.Event()
        capture_thread = threading.Thread(target=camera_capture_thread, args=(cap, frame_queue, stop_event), daemon=True)
        capture_thread.start()
    
    try:
        while True:
            if run_in_background:
                # Get frame from queue (background mode)
                try:
                    frame = frame_queue.get(timeout=1)
                except queue.Empty:
                    continue
            else:
                # Get frame directly (foreground mode)
                ret, frame = cap.read()
                if not ret:
                    break

            # Convert to RGB for MediaPipe
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            
            # Process the frame
            pose_landmarker_result = pose_landmarker.detect_for_video(mp_image, frame_timestamp_ms)
            frame_timestamp_ms += int(1000 / 30)  # Assuming ~30 fps

            status_text = "Posture: GOOD"
            status_color = (0, 255, 0)  # Green
            
            if pose_landmarker_result.pose_landmarks:
                # Get the first person's landmarks
                landmarks = pose_landmarker_result.pose_landmarks[0]
                # Landmark NOSE (index 0) is the Nose
                current_nose_y = landmarks[int(PoseLandmark.NOSE)].y
                
                # Check if threshold is exceeded
                if current_nose_y > threshold:
                    if threshold_exceeded_start is None:
                        threshold_exceeded_start = time.time()
                        notification_sent = False
                    
                    elapsed_time = time.time() - threshold_exceeded_start
                    
                    if elapsed_time >= 10.0 and not notification_sent:
                        send_notification(f"Poor posture detected! Nose Y-value exceeded threshold for {elapsed_time:.1f} seconds.")
                        notification_sent = True
                        print(f"⚠️  ALERT: Poor posture detected for {elapsed_time:.1f} seconds!")
                    
                    status_text = f"Posture: POOR ({elapsed_time:.1f}s)" if threshold_exceeded_start else "Posture: POOR"
                    status_color = (0, 0, 255)  # Red
                else:
                    # Reset if posture is good again
                    if threshold_exceeded_start is not None:
                        elapsed = time.time() - threshold_exceeded_start
                        print(f"✓ Posture corrected after {elapsed:.1f} seconds")
                    threshold_exceeded_start = None
                    notification_sent = False
                
                # Draw the landmarks
                drawing_utils.draw_landmarks(
                    frame, 
                    landmarks, 
                    PoseLandmarksConnections.POSE_LANDMARKS,
                    drawing_utils.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                    drawing_utils.DrawingSpec(color=(0, 0, 255), thickness=2)
                )
                
                # Display status on frame
                cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, status_color, 2)
                cv2.putText(frame, f"Baseline: {avg_baseline:.4f}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                cv2.putText(frame, f"Threshold: {threshold:.4f}", (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            if not run_in_background:
                cv2.imshow('Posture Monitoring - Press Q to Quit', frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
            else:
                # In background mode, don't show window but still process frames
                pass

    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    finally:
        if run_in_background:
            stop_event.set()
            capture_thread.join(timeout=2)
        cap.release()
        if not run_in_background:
            cv2.destroyAllWindows()
        pose_landmarker.close()
        print("\nMonitoring stopped.")

if __name__ == "__main__":
    baseline = calibrate_posture()
    if baseline is not None:
        # Ask user if they want to run monitoring in background
        print("\n" + "="*60)
        print("MONITORING MODE SELECTION")
        print("="*60)
        print("Choose how you want to run posture monitoring:")
        print("  1. Foreground mode - Shows camera window (default)")
        print("  2. Background mode - Runs silently in background")
        print("="*60)
        
        choice = input("\nEnter choice (1 or 2, default=2): ").strip()
        run_background = (choice == '2')
        
        monitor_posture(baseline, run_in_background=run_background)