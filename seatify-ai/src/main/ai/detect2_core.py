# detect_core/detect_run2_core.py
import torch
import cv2
import os
import pickle
import numpy as np
from pathlib import Path
from utils.datasets import LoadImages
from utils.general import non_max_suppression
from utils.torch_utils import time_sync
from models.common import DetectMultiBackend
from seat_api_sender import send_seat_status
from calibration_loader import load_calibration_from_aruco, load_calibration
from seat_class import seatClass

@torch.no_grad()
def detect_run2_from_image(model, image_path, store_id, imgsz=(640, 640), conf_thres=0.25, iou_thres=0.45, device='cpu'):
    print(f"[INFO] detect_run2_from_image 실행 - store_id={store_id}, image_path={image_path}")
    dataset = LoadImages(image_path, img_size=imgsz, stride=model.stride, auto=model.pt)
    for path, im, im0s, _, _ in dataset:
        im = torch.from_numpy(im).to(device)
        im = im.float()
        im /= 255.0
        if len(im.shape) == 3:
            im = im[None]

        pred = model(im)
        pred = non_max_suppression(pred, conf_thres, iou_thres)

        if len(pred) == 0 or pred[0] is None:
            print("[INFO] No detection found.")
            return {"message": "No detections"}

        det = pred[0]
        print(f"[DEBUG] 감지된 객체 수: {len(det)}")

        mid_x, mid_y, labels = [], [], []
        names = model.names

        for *xyxy, conf, cls in det:
            x_center = (xyxy[0] + xyxy[2]) / 2
            y_center = (xyxy[1] + xyxy[3]) / 2
            mid_x.append(x_center.item())
            mid_y.append(y_center.item())
            label_str = names[int(cls)]
            labels.append(label_str)
            print(f"[DEBUG] 감지된 객체: label={label_str}, center=({x_center.item():.1f}, {y_center.item():.1f})")

        try:
            with open('backup/seat_Num.p', 'rb') as f:
                seats = []
                while True:
                    try:
                        entry = pickle.load(f)
                        if isinstance(entry, seatClass):
                            seat = entry
                        elif isinstance(entry, (list, tuple)):
                            seat = seatClass(*entry[:6], entry[6], entry[7])
                        else:
                            print(f"[⚠️ 경고] 알 수 없는 entry 타입: {type(entry)}")
                            continue
                        seats.append(seat)
                    except EOFError:
                        break
        except FileNotFoundError:
            print("[ERROR] seat_Num.p not found")
            return {"message": "seat_Num.p not found"}

        perspect_mat = load_calibration(store_id)
        OFFSET_X = 300
        OFFSET_Y = 220
        status_list = []
        updated_seats = set()
        state_map = {"empty_table": 0, "using_table": 1, "step_out": 2, "long_step_out": 3}

        used_seats = set()  # ✅ 이미 매핑된 좌석 기록용

        for x, y, label in zip(mid_x, mid_y, labels):
            dst = cv2.perspectiveTransform(np.array([[[x, y]]], dtype=np.float32), perspect_mat)[0][0]
            px, py = int(dst[0]) + OFFSET_X, int(dst[1]) + OFFSET_Y

            # ✅ 아직 사용되지 않은 좌석들만 대상으로 매핑
            available_seats = [s for s in seats if s.seatNum not in used_seats]
            if not available_seats:
                print("[⚠️ 경고] 사용 가능한 좌석이 없습니다.")
                continue

            closest_seat = min(available_seats, key=lambda s: (s.xPos - px) ** 2 + (s.yPos - py) ** 2)
            seat_id = closest_seat.seatNum
            used_seats.add(seat_id)  # ✅ 중복 방지용

            new_state = state_map.get(label, 0)
            print(f"[DEBUG] label={label} → 좌표 변환 ({x:.1f},{y:.1f}) → ({px},{py}) → 좌석 {seat_id}로 매핑, 상태={new_state}")

            if closest_seat.seatCount != new_state:
                closest_seat.seatCount = new_state
                updated_seats.add(seat_id)

            status_list.append({"seatID": seat_id, "state": new_state})
        try:
            send_seat_status(cafe_id=int(store_id), status_list=status_list)
        except Exception as e:
            print(f"[Warning] Failed to send seat status: {e}")

        # Save updated seat pickle
        with open('backup/seat_Num.p', 'wb') as f:
            for s in seats:
                pickle.dump(s, f)

        return {"message": "detect_run2 completed", "statusList": status_list}
