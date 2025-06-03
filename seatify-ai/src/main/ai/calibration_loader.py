import json
import os
import argparse
import numpy as np
import cv2

def load_calibration_from_aruco(image_path):
    """
    Detect ArUco markers in the given image and compute perspective transform.
    Requires 4 markers with IDs 0, 1, 2, and 3 placed at the corners.
    """
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
    calibration_path = os.path.join("calibration", f"{store_id}.json")
    with open(calibration_path, "w") as f:
        json.dump(calibration_data, f, indent=4)
    print(f"Calibration data saved to {calibration_path}")

def parse_arguments():
    parser = argparse.ArgumentParser(description='Generate and save perspective calibration from ArUco markers')
    parser.add_argument('--image', type=str, required=True, help='Path to image containing ArUco markers')
    parser.add_argument('--store-id', type=str, required=True, help='Unique identifier for the store (e.g., store1)')
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_arguments()

    try:
        pts1, pts2, perspect_mat, img = load_calibration_from_aruco(args.image)
        print("Perspective Matrix Loaded Successfully:")
        print(perspect_mat)

        save_calibration(args.store_id, pts1, pts2)

        # Optional: Apply and save warped image for verification
        warped = cv2.warpPerspective(img, perspect_mat, (640, 480))
        output_path = f"warped_{args.store_id}.jpg"
        cv2.imwrite(output_path, warped)
        print(f"Warped output saved as {output_path}")

    except Exception as e:
        print(e)
        exit(1)
