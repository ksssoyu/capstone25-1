# flask_server.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re
import threading
import time
import glob
import cv2
import json
import numpy as np
import subprocess
import base64
import traceback

from model_loader import load_model_instance
from detect1_core import detect_from_image
from detect2_core import detect_run2_from_image

app = Flask(__name__)
CORS(app)

HASH_CACHE_FILE = "layout_hash_cache.json"
MODEL, DEVICE = load_model_instance(
    weights_path='train/exp3_table_shape/weights/best.pt',
    data_path='yolov5/data/custom_dataset_plus_longtable.yaml',
    imgsz=(640, 640),
    device_str=''
)
MODEL_RUN2, DEVICE_RUN2 = load_model_instance(
    weights_path='train/exp8_table_state/weights/best.pt',
    data_path='yolov5/data/empty_or_using_dataset_tune.yaml',
    imgsz=(640, 640),
    device_str=''
)

detect_thread = None
stop_flag = threading.Event()
access_token = None

@app.route('/set-token', methods=['POST'])
def set_token():
    global access_token
    access_token = request.json.get("token")
    return jsonify({"message": "Token received!"})

@app.route('/get-token', methods=['GET'])
def get_token():
    if access_token:
        return jsonify({"access_token": access_token})
    return jsonify({"error": "No token set"}), 404

def load_calibration_from_aruco(image_path, padding=50):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
    detector = cv2.aruco.ArucoDetector(aruco_dict, cv2.aruco.DetectorParameters())
    corners, ids, _ = detector.detectMarkers(gray)

    if ids is not None and len(ids) >= 4:
        ref_pts = {id_: corners[i][0].mean(axis=0) for i, id_ in enumerate(ids.flatten()) if id_ in [0, 1, 2, 3]}
        if len(ref_pts) == 4:
            pts1 = np.float32([ref_pts[i] for i in range(4)])
            width, height = 640 + 2 * padding, 480 + 2 * padding
            pts2 = np.float32([
                [padding, padding],
                [padding + 640, padding],
                [padding + 640, padding + 480],
                [padding, padding + 480]
            ])
            M = cv2.getPerspectiveTransform(pts1, pts2)
            return pts1.tolist(), pts2.tolist(), M, img, (width, height)
    raise ValueError("Insufficient ArUco markers.")

def save_calibration(store_id, pts1, pts2):
    path = os.path.join("calibration", f"store{store_id}.json")
    os.makedirs("calibration", exist_ok=True)
    with open(path, "w") as f:
        json.dump({"pts1": pts1, "pts2": pts2}, f, indent=4)

@app.route('/upload-image', methods=['POST'])
def upload_image():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        store_id = request.args.get("store_id")
        if not store_id:
            return jsonify({"error": "store_id is required"}), 400

        file = request.files['file']
        path = os.path.join("uploads", f"aruco{store_id}.png")
        os.makedirs("uploads", exist_ok=True)
        file.save(path)

        pts1, pts2, M, img, size = load_calibration_from_aruco(path)
        save_calibration(store_id, pts1, pts2)
        warped = cv2.warpPerspective(img, M, size)
        warped_path = os.path.join("uploads", f"warped_{store_id}.jpg")
        cv2.imwrite(warped_path, warped)

        return jsonify({
            "message": "Calibration completed",
            "calibration_file": f"calibration/store{store_id}.json",
            "warped_image": warped_path
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def extract_frame_number(filename):
    match = re.search(r"frame_(\d+).jpg", filename)
    return int(match.group(1)) if match else -1

def extract_frame_filename(time_str: str):
    return f"{time_str}.jpg"
'''
def detect_loop(cafe_id):
    frame_files = sorted(glob.glob("frames/*.jpg"), key=extract_frame_number)
    for frame_path in frame_files:
        if stop_flag.is_set():
            break
        subprocess.run(["python", "detect_run1.py", "--store-id", cafe_id, "--input-path", frame_path])
        subprocess.run(["python", "detect_run2.py", "--store-id", cafe_id, "--input-path", frame_path])
        time.sleep(0.5)

@app.route('/start-detect', methods=['POST'])
def start_detect():
    global detect_thread, stop_flag
    cafe_id = request.json.get("cafeId", "20")
    if detect_thread and detect_thread.is_alive():
        return jsonify({"message": "Detection already in progress"}), 400
    stop_flag.clear()
    detect_thread = threading.Thread(target=detect_loop, args=(cafe_id,), daemon=True)
    detect_thread.start()
    return jsonify({"message": "Detection started"})

def detect_loop(store_id):
    frame_files = sorted(glob.glob("frames/*.jpg"), key=extract_frame_number)
    for frame_path in frame_files:
        if stop_flag.is_set():
            break

        filename = os.path.basename(frame_path)

        try:
            # RUN1: detect_from_image
            result1, annotated_img1 = detect_from_image(
                model=MODEL,
                image_path=frame_path,
                store_id=store_id,
                device=DEVICE
            )
            save_path1 = os.path.join("results", f"annotated_run1_{filename}")
            os.makedirs("results", exist_ok=True)
            cv2.imwrite(save_path1, annotated_img1)

            # RUN2: detect_run2_from_image
            result2, annotated_img2 = detect_run2_from_image(
                model=MODEL_RUN2,
                image_path=frame_path,
                store_id=store_id,
                device=DEVICE_RUN2
            )
            save_path2 = os.path.join("results", f"annotated_run2_{filename}")
            cv2.imwrite(save_path2, annotated_img2)

            print(f"[INFO] Processed {filename}")

        except Exception as e:
            print(f"[ERROR] Failed on {filename}: {e}")


        time.sleep(0.5)

@app.route('/start-detect', methods=['POST'])
def start_detect():
    global detect_thread, stop_flag
    store_id = request.json.get("cafeId", "20")

    if detect_thread and detect_thread.is_alive():
        return jsonify({"message": "Detection already in progress"}), 400

    stop_flag.clear()
    detect_thread = threading.Thread(target=detect_loop, args=(store_id,), daemon=True)
    detect_thread.start()

    return jsonify({"message": "Detection started"})
'''

@app.route('/stop-detect', methods=['POST'])
def stop_detect():
    stop_flag.set()
    return jsonify({"message": "Detection stopping..."})

def find_nearest_existing_frame(base_time_str, frames_dir="frames", max_attempts=5):
    """ 'mm-ss' 포맷 기준으로 프레임 파일 존재하는 가장 가까운 이전 시점 반환 """
    minute, second = map(int, base_time_str.split("-"))
    total_seconds = minute * 60 + second

    for offset in range(max_attempts + 1):  # 자기 자신 포함
        check_time = total_seconds - offset
        if check_time < 0:
            break

        mm = check_time // 60
        ss = check_time % 60
        candidate_time_str = f"{mm:02d}-{ss:02d}"
        filename = f"{candidate_time_str}.jpg"
        frame_path = os.path.join(frames_dir, filename)

        if os.path.exists(frame_path):
            return candidate_time_str, frame_path

    return None, None  # 찾지 못함

@app.route('/detect-frame-run1', methods=['GET'])
def detect_frame_run1():
    time_str = request.args.get("time")
    store_id = request.args.get("store_id", "20")

    if not time_str:
        return jsonify({"error": "time is required"}), 400

    print(f"[DEBUG] 원래 요청 time: {time_str}")
    adjusted_time_str, frame_path = find_nearest_existing_frame(time_str)

    if not frame_path:
        return jsonify({"error": f"No available frame near {time_str}"}), 404

    print(f"[DEBUG] 분석에 사용할 프레임: {frame_path}")

    try:
        result, annotated_img = detect_from_image(
            model=MODEL,
            image_path=frame_path,
            store_id=store_id,
            device=DEVICE
        )

        # 생략 가능
        # ...

        return jsonify(result), 200

    except Exception as e:
        print("[ERROR] Exception occurred!")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


import traceback  # 맨 위에 import
@app.route('/detect-frame-run2', methods=['GET'])
def detect_frame_run2():
    time_str = request.args.get("time")
    store_id = request.args.get("store_id", "20")

    if not time_str:
        return jsonify({"error": "time is required"}), 400

    adjusted_time_str, frame_path = find_nearest_existing_frame(time_str)

    if not frame_path:
        return jsonify({"error": f"No available frame near {time_str}"}), 404

    print(f"[DEBUG] Run2 분석 프레임: {frame_path}")

    try:
        result = detect_run2_from_image(
            model=MODEL_RUN2,
            image_path=frame_path,
            store_id=store_id,
            device=DEVICE_RUN2
        )

        annotated_img = result.get("annotated_img")
        if annotated_img is not None:
            save_path = os.path.join("results", f"annotated_run2_{adjusted_time_str}.jpg")
            cv2.imwrite(save_path, annotated_img)
            with open(save_path, "rb") as f:
                result["annotated_image_base64"] = base64.b64encode(f.read()).decode()
                result["annotated_image"] = save_path

        return jsonify(result), 200

    except Exception as e:
        print(f"[ERROR] detect-frame-run2에서 예외 발생:\n{e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    if os.path.exists(HASH_CACHE_FILE):
        os.remove(HASH_CACHE_FILE)
    app.run(port=5001)
