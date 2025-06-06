import cv2
import os
import shutil  # 폴더 삭제를 위해 필요

# 사용할 영상 파일 경로
video_path = 'cafe.mp4'

# 프레임 저장 폴더
frames_dir = "frames"

# 기존 frames 폴더가 있으면 삭제하고 새로 생성
if os.path.exists(frames_dir):
    shutil.rmtree(frames_dir)
os.makedirs(frames_dir)

# 영상 열기
cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("비디오 파일 열기 실패")
    exit()

frame_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1

    # 30프레임마다 1장씩 저장 (FPS=30 기준: 1초당 1장)
    if frame_count % 30 == 0:
        frame_filename = os.path.join(frames_dir, f"frame_{frame_count}.jpg")
        cv2.imwrite(frame_filename, frame)
        print(f"Saved frame: {frame_filename}")

cap.release()
print("모든 프레임 추출 완료")
