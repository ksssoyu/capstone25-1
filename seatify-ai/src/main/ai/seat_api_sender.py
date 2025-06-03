import requests
import json
import hashlib
import math

_last_layout_hash = None  # 파일 상단에 전역 변수로 선언

def get_access_token_from_flask():
    try:
        res = requests.get("http://localhost:5001/get-token")
        res.raise_for_status()
        token = res.json().get("access_token")
        if not token:
            raise ValueError("No token received")
        return token
    except Exception as e:
        print(f"[❌ Token Error] {e}")
        return None

def send_seat_layout(cafe_id, seat_list):
    token = get_access_token_from_flask()
    if not token:
        print("🚫 토큰 없음 - Layout 전송 취소")
        return

    seats = [{
        "seatID": seat["seatID"],
        "x": seat["x"],
        "y": seat["y"],
        "width": seat["width"],
        "height": seat["height"]
    } for seat in seat_list]

    payload = {
        "data": json.dumps(seats)
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    url = f"http://localhost:8080/api/seat/{cafe_id}/layout"
    response = requests.post(url, json=payload, headers=headers)
    print(f"[Layout] {response.status_code}: {response.text}")

def send_seat_status(cafe_id, status_list):
    token = get_access_token_from_flask()
    if not token:
        print("🚫 토큰 없음 - Status 전송 취소")
        return

    status_entries = [{
        "seatID": seat["seatID"],
        "state": seat["state"]  # ✅ key 이름 일치시킴
    } for seat in status_list]

    payload = {
        "status_list": status_entries
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    url = f"http://localhost:8080/api/seat/{cafe_id}/status"
    response = requests.post(url, json=payload, headers=headers)
    print(f"[Status] {response.status_code}: {response.text}")

def normalize_seat(seat, precision=1):
    """
    좌표와 크기를 반올림하여 오차를 줄임.
    precision=1 → 소수점 첫째자리까지 반올림
    """
    return {
        "seatID": seat["seatID"],
        "x": round(seat["x"], precision),
        "y": round(seat["y"], precision),
        "width": round(seat["width"], precision),
        "height": round(seat["height"], precision)
    }

def send_seat_layout_if_changed(cafe_id, seat_list):
    global _last_layout_hash

    print(f"📌 [Debug] cafe_id: {cafe_id}")
    print(f"📌 [Debug] seat_list 타입: {type(seat_list)}")
    if len(seat_list) > 0:
        print(f"📌 [Debug] seat_list[0] 타입: {type(seat_list[0])}")
        print(f"📌 [Debug] seat_list[0]: {seat_list[0]}")
    else:
        print("⚠️ seat_list가 비어 있음")

    # 오차 허용을 위한 정규화
    normalized_seats = [normalize_seat(seat) for seat in seat_list]

    # 정렬 및 문자열 변환 → 항상 일관된 hash 생성
    seats_str = json.dumps(normalized_seats, sort_keys=True)
    current_hash = hashlib.md5(seats_str.encode()).hexdigest()

    if _last_layout_hash == current_hash:
        print("✅ 동일한 레이아웃 (오차 허용) - 전송 생략")
        return
    else:
        _last_layout_hash = current_hash
        print("📤 변경된 레이아웃 감지 - 서버로 전송")
        send_seat_layout(cafe_id, seat_list)