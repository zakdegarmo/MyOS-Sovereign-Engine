import cv2
import sys
import os

def capture_and_crop(output_path, device_index=0):
    cap = cv2.VideoCapture(device_index, cv2.CAP_DSHOW)
    if not cap.isOpened():
        cap = cv2.VideoCapture(device_index)
    if not cap.isOpened():
        return False
        
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    
    for _ in range(5):
        cap.read()
    ret, frame = cap.read()
    cap.release()
    
    if not ret or frame is None:
        return False
        
    h, w, _ = frame.shape
    # Crop tightly to the TV monitor:
    # Based on 1920x1080 frame:
    # x approx 580 to 1240, y approx 35 to 440
    crop_y1 = int(h * 0.03)
    crop_y2 = int(h * 0.43)
    crop_x1 = int(w * 0.30)
    crop_x2 = int(w * 0.66)
    
    cropped = frame[crop_y1:crop_y2, crop_x1:crop_x2]
    
    # Also enhance contrast/sharpness for display reading
    lab = cv2.cvtColor(cropped, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    cl = clahe.apply(l)
    enhanced = cv2.merge((cl,a,b))
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
    
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    cv2.imwrite(output_path, enhanced)
    return True

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "data/monitor_crop.jpg"
    success = capture_and_crop(out)
    sys.exit(0 if success else 1)
