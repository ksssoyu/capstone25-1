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

# 전역에 token 저장
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

'''
@app.route('/run-detect', methods=['POST'])
def run_detect():
    cafe_id = request.args.get("cafe_id")
    if not cafe_id:
        return jsonify({"error": "cafe_id is required"}), 400

    # ✅ 디버깅용: cafe_id가 1 또는 2일 때만 실행
    if cafe_id not in ['1', '2']:
        return jsonify({"message": f"Detection skipped for cafe_id {cafe_id} (debug mode)"}), 200

    try:
        subprocess.run(["python", "detect_run1.py", "--store-id", cafe_id], check=True)
        subprocess.run(["python", "detect_run2.py", "--store-id", cafe_id], check=True)

        return jsonify({"message": f"Detection started for {cafe_id}"}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"error": f"Detection script failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
'''

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


# 자연수 추출 함수
def extract_frame_number(filename):
    match = re.search(r"frame_(\d+)\.jpg", filename)
    if match:
        return int(match.group(1))
    return -1  # 혹시라도 패턴 안 맞으면 뒤로 밀림

import subprocess
import glob
import time
import os

def continuous_detection():
    cafe_id = "41"
    calibration_path = os.path.join("calibration", f"store{cafe_id}.json")

    while not os.path.exists(calibration_path):
        print(f"⚠️ Calibration file not found for cafe_id {cafe_id}. Waiting...")
        time.sleep(10)

    print(f"✅ Calibration file found for cafe_id {cafe_id}. Starting detection loop...")

    while True:
        frame_files = glob.glob("frames/*.jpg")
        frame_files.sort(key=extract_frame_number)

        for frame_path in frame_files:
            try:
                print(f"🎯 Detecting frame: {frame_path}")
                result = subprocess.run(["python", "detect_run1.py", "--store-id", cafe_id, "--input-path", frame_path])

                if result.returncode == 0:
                    print("✅ detect_run1 성공 → detect_run2 실행")
                    subprocess.run(["python", "detect_run2.py", "--store-id", cafe_id, "--input-path", frame_path], check=True)
                else:
                    print("⚠️ detect_run1 실패 → detect_run2 스킵")

            except subprocess.CalledProcessError as e:
                print(f"⛔ Detection failed: {str(e)}")
            except Exception as e:
                print(f"⛔ Unexpected error: {str(e)}")

        print("⏳ 모든 프레임 1회 감지 완료 → 60초 대기")
        time.sleep(60)


if __name__ == '__main__':
    worker_thread = threading.Thread(target=continuous_detection, daemon=True)
    worker_thread.start()
    app.run(port=5001)