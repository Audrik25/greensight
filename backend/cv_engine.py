import cv2
import numpy as np


def analyze_turf_image(image_path: str) -> dict:
    image = cv2.imread(image_path)
    if image is None:
        return {
            "overall_health_score": 75,
            "health_status": "UNKNOWN",
            "health_indicators": {"color_health": 75, "density": 75, "growth": 75, "stress": 25},
            "detected_issues": [],
            "affected_area_percent": 0.0,
            "affected_regions": [],
            "soil_visual": {"visual_type": "loamy", "moisture": "moderate", "drainage_risk": "low", "confidence": 0.7}
        }

    h, w, _ = image.shape
    total_pixels = h * w

    # Convert to HSV for color masking
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # 1. Detect Healthy Green Turf
    lower_green = np.array([30, 40, 40])
    upper_green = np.array([85, 255, 255])
    green_mask = cv2.inRange(hsv, lower_green, upper_green)
    green_pixels = cv2.countNonZero(green_mask)

    # 2. Detect Stressed / Brown / Yellow Patches (Disease/Drought)
    lower_yellow = np.array([10, 50, 50])
    upper_yellow = np.array([30, 255, 255])
    yellow_mask = cv2.inRange(hsv, lower_yellow, upper_yellow)
    yellow_pixels = cv2.countNonZero(yellow_mask)

    # 3. Detect Dark / Bare Soil Patches
    lower_brown = np.array([0, 30, 20])
    upper_brown = np.array([20, 200, 150])
    brown_mask = cv2.inRange(hsv, lower_brown, upper_brown)
    brown_pixels = cv2.countNonZero(brown_mask)

    # Percentages
    green_pct = round((green_pixels / total_pixels) * 100, 1)
    yellow_pct = round((yellow_pixels / total_pixels) * 100, 1)
    brown_pct = round((brown_pixels / total_pixels) * 100, 1)
    affected_pct = round(min(100.0, yellow_pct + (brown_pct * 0.5)), 1)

    # Calculate overall health score (0-100)
    health_score = int(np.clip(green_pct * 1.1 - (yellow_pct * 1.5) - brown_pct, 10, 98))
    
    if health_score >= 80:
        health_status = "EXCELLENT"
    elif health_score >= 65:
        health_status = "GOOD"
    elif health_score >= 50:
        health_status = "FAIR"
    else:
        health_status = "POOR"

    # Find bounding box regions for stressed areas
    contours, _ = cv2.findContours(yellow_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    affected_regions = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > (total_pixels * 0.005):  # Filter out tiny noise
            x, y, bw, bh = cv2.boundingRect(cnt)
            affected_regions.append({
                "x": int(x),
                "y": int(y),
                "width": int(bw),
                "height": int(bh),
                "type": "disease_or_stress",
                "label": "stress_patch",
                "confidence": 0.82
            })

    detected_issues = []
    if yellow_pct > 3.0:
        detected_issues.append({
            "type": "disease",
            "name": "foliar_stress_or_fungal",
            "confidence": 0.85,
            "affected_area_percent": yellow_pct
        })
    if brown_pct > 5.0:
        detected_issues.append({
            "type": "soil_bare",
            "name": "patchy_coverage",
            "confidence": 0.78,
            "affected_area_percent": brown_pct
        })

    return {
        "overall_health_score": health_score,
        "health_status": health_status,
        "health_indicators": {
            "color_health": int(np.clip(green_pct, 10, 99)),
            "density": int(np.clip(100 - brown_pct * 2, 20, 99)),
            "growth": int(np.clip(green_pct * 0.9, 20, 95)),
            "stress": int(np.clip(yellow_pct * 3, 5, 95))
        },
        "detected_issues": detected_issues,
        "affected_area_percent": affected_pct,
        "affected_regions": affected_regions[:5],  # Top 5 regions
        "soil_visual": {
            "visual_type": "loamy",
            "moisture": "high" if brown_pct > 8.0 else "moderate",
            "drainage_risk": "moderate" if yellow_pct > 6.0 else "low",
            "confidence": 0.80
        }
    }