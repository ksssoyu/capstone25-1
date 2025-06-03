# flask_server.py

from flask import Flask, request, jsonify
from flask_cors import CORS
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

if __name__ == '__main__':
    app.run(port=5001)
