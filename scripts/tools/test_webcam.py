import cv2
import sys
import os

def capture_frame(output_path, device_index=0):
    # Try DirectShow backend first on Windows
    cap = cv2.VideoCapture(device_index, cv2.CAP_DSHOW)
    if not cap.isOpened():
        print(f"DirectShow failed for index {device_index}, trying default backend...")
        cap = cv2.VideoCapture(device_index)
        
    if not cap.isOpened():
        print(f"ERROR: Could not open video device at index {device_index}")
        return False
        
    # Set HD resolution if supported
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    
    # Let auto-exposure settle for a few frames
    for _ in range(5):
        ret, frame = cap.read()
        
    ret, frame = cap.read()
    cap.release()
    
    if not ret or frame is None:
        print(f"ERROR: Failed to read frame from device {device_index}")
        return False
        
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    cv2.imwrite(output_path, frame)
    h, w, c = frame.shape
    print(f"SUCCESS: Captured {w}x{h} frame to {output_path}")
    return True

if __name__ == "__main__":
    idx = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    out = sys.argv[2] if len(sys.argv) > 2 else "data/webcam_frame.jpg"
    success = capture_frame(out, idx)
    sys.exit(0 if success else 1)
