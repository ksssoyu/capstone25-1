# flask_server.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import json
import threading
import glob
import os
import re
import time
import subprocess

app = Flask(__name__)
CORS(app)  # ✅ 모든 origin 허용


# === 글로벌 변수 ===
detect_thread = None
stop_flag = threading.Event()
access_token = None

@app.route('/set-token', methods=['POST'])
def set_token():
    global access_token
    data = request.json
    access_token = data.get("token")
    return jsonify({"message": "Token received!"}), 200

@app.route('/get-token', methods=['GET'])
def get_token():
    if access_token:
        return jsonify({"access_token": access_token}), 200
    else:
        return jsonify({"error": "No token set"}), 404


# 기존 calibration 관련 함수 그대로 포함
def load_calibration_from_aruco(image_path):
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Image not found: {image_path}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
    parameters = cv2.aruco.DetectorParameters()
    detector = cv2.aruco.ArucoDetector(aruco_dict, parameters)

    corners, ids, _ = detector.detectMarkers(gray)

    if ids is not None and len(ids) >= 4:
        ids = ids.flatten()
        ref_pts = {}

        for i in range(len(ids)):
            if ids[i] in [0, 1, 2, 3]:
                ref_pts[ids[i]] = corners[i][0].mean(axis=0)

        if len(ref_pts) == 4:
            pts1 = np.float32([
                ref_pts[0],  # top-left
                ref_pts[1],  # top-right
                ref_pts[2],  # bottom-right
                ref_pts[3],  # bottom-left
            ])

            pts2 = np.float32([
                [0, 0],
                [640, 0],
                [640, 480],
                [0, 480]
            ])

            perspect_mat = cv2.getPerspectiveTransform(pts1, pts2)
            return pts1.tolist(), pts2.tolist(), perspect_mat, img

        else:
            raise ValueError("Required ArUco markers with IDs 0, 1, 2, 3 not detected.")
    else:
        raise ValueError("No sufficient ArUco markers detected.")

def save_calibration(store_id, pts1, pts2):
    calibration_data = {
        "pts1": pts1,
        "pts2": pts2
    }
    os.makedirs("calibration", exist_ok=True)
    calibration_path = os.path.join("calibration", f"store{store_id}.json")
    with open(calibration_path, "w") as f:
        json.dump(calibration_data, f, indent=4)
    print(f"Calibration data saved to {calibration_path}")


@app.route('/upload-image', methods=['POST'])
def upload_image():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        store_id = request.args.get("store_id")
        if not store_id:
            return jsonify({"error": "store_id is required"}), 400

        file = request.files['file']
        filename = f'aruco{store_id}.png'

        # 업로드된 파일 저장 (uploads 폴더)
        os.makedirs("uploads", exist_ok=True)
        save_path = os.path.join("uploads", filename)
        file.save(save_path)
        print(f"파일 저장 완료: {save_path}")

        # 캘리브레이션 생성 및 저장
        pts1, pts2, perspect_mat, img = load_calibration_from_aruco(save_path)
        save_calibration(store_id, pts1, pts2)

        # warped 이미지 생성
        warped = cv2.warpPerspective(img, perspect_mat, (640, 480))
        warped_path = os.path.join("uploads", f"warped_{store_id}.jpg")
        cv2.imwrite(warped_path, warped)
        print(f"Warped image saved: {warped_path}")

        return jsonify({
            "message": "Calibration completed successfully.",
            "calibration_file": f"calibration/{store_id}.json",
            "warped_image": warped_path
        }), 200

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


# 유틸: 자연수 추출
def extract_frame_number(filename):
    match = re.search(r"frame_(\d+)\.jpg", filename)
    if match:
        return int(match.group(1))
    return -1

# === detect loop ===
def detect_loop(cafe_id):
    frame_files = glob.glob("frames/*.jpg")
    frame_files.sort(key=extract_frame_number)

    try:
        for frame_path in frame_files:
            if stop_flag.is_set():
                print("🛑 Detection 중단됨.")
                break

            print(f"🎯 Detecting frame: {frame_path}")
            result = subprocess.run(["python", "detect_run1.py", "--store-id", cafe_id, "--input-path", frame_path])
            if result.returncode == 0:
                subprocess.run(["python", "detect_run2.py", "--store-id", cafe_id, "--input-path", frame_path])
            else:
                print(f"⚠️ detect_run1 실패: {frame_path}, detect_run2 스킵")

            time.sleep(0.5)  # 너무 과부하 안 주게 약간 쉬어줌

        print("✅ 모든 frame 처리 완료")
    except Exception as e:
        print(f"⛔ Error: {str(e)}")

# === start-detect API ===
@app.route('/start-detect', methods=['POST'])
def start_detect():
    global detect_thread, stop_flag

    cafe_id = request.json.get("cafeId", "20")
    print(f"🚀 Detection 시작: {cafe_id}")

    if detect_thread and detect_thread.is_alive():
        return jsonify({"message": "이미 detection 진행 중입니다"}), 400

    stop_flag.clear()

    detect_thread = threading.Thread(target=detect_loop, args=(cafe_id,), daemon=True)
    detect_thread.start()

    return jsonify({"message": "Detection started"}), 200

# === stop-detect API ===
@app.route('/stop-detect', methods=['POST'])
def stop_detect():
    global stop_flag

    cafe_id = request.json.get("cafeId", "20")
    print(f"🛑 Stop 요청 수신: {cafe_id}")

    stop_flag.set()

    return jsonify({"message": "Detection stopping..."}), 200

if __name__ == '__main__':
    app.run(port=5001)