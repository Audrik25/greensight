import asyncio
import json
import os
from datetime import datetime, timedelta

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend import consultant_engine, db, forecast_engine
from backend.weather_service import fetch_weather
from backend.cv_engine import analyze_turf_image


app = FastAPI(title="Precision Turf & Agronomy Backend")


# --------------------------------------------------
# DATABASE (self-hosted — replaces the base44 entity store)
# --------------------------------------------------

db.init_db()
NORTH_FIELD_ID = db.seed_default_field()


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# FILE STORAGE
# --------------------------------------------------

UPLOAD_DIR = "backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

LATEST_ANALYSIS_FILE = "backend/latest_analysis.json"

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads"
)


# --------------------------------------------------
# RESTORE LAST ANALYSIS
# --------------------------------------------------

app.state.latest_analysis = {}

if os.path.exists(LATEST_ANALYSIS_FILE):
    try:
        with open(LATEST_ANALYSIS_FILE, "r") as f:
            app.state.latest_analysis = json.load(f)
    except Exception:
        app.state.latest_analysis = {}


def _persist_latest_analysis(payload: dict) -> None:
    try:
        with open(LATEST_ANALYSIS_FILE, "w") as f:
            json.dump(payload, f)
    except Exception:
        pass


# --------------------------------------------------
# ON-DEMAND CAPTURE REQUESTS
#
# The Raspberry Pi is a separate device polling this backend on its own
# schedule (edge/edge_capture.py) — it has no listening server the backend
# could call into directly. So an on-demand "capture now" request from the
# frontend works as a short-lived flag: this sets a monotonically increasing
# request id, the edge node polls GET /api/capture/pending frequently and
# breaks its normal wait loop early to capture+upload as soon as one shows
# up, and POST /api/capture long-polls for that upload to land before
# replying (falling back to "still pending" if the Pi doesn't check in
# quickly enough, e.g. it's offline).
# --------------------------------------------------

app.state.capture_request_id = 0
app.state.capture_requested_at = None
app.state.fulfilled_request_id = 0

CAPTURE_REQUEST_TIMEOUT_SEC = 25
CAPTURE_REQUEST_POLL_INTERVAL_SEC = 1


@app.get("/api/capture/pending")
async def get_capture_pending():
    """Cheap poll target for the edge node — no image data, just a flag."""
    pending = app.state.capture_request_id > app.state.fulfilled_request_id
    return {
        "pending": pending,
        "request_id": app.state.capture_request_id if pending else None,
    }


@app.post("/api/capture")
async def request_capture():
    """Ask the Raspberry Pi to take a photo now, and wait (briefly) for it."""
    app.state.capture_request_id += 1
    app.state.capture_requested_at = datetime.now().isoformat()
    my_request_id = app.state.capture_request_id

    elapsed = 0
    while elapsed < CAPTURE_REQUEST_TIMEOUT_SEC:
        if app.state.fulfilled_request_id >= my_request_id and app.state.latest_analysis:
            return {
                "status": "captured",
                **app.state.latest_analysis,
            }
        await asyncio.sleep(CAPTURE_REQUEST_POLL_INTERVAL_SEC)
        elapsed += CAPTURE_REQUEST_POLL_INTERVAL_SEC

    return {
        "status": "pending",
        "message": (
            "Capture requested — the edge node hasn't checked in yet. "
            "It will pick this up on its next poll; refresh shortly."
        ),
    }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/api/health")
async def health():
    return {"status": "online"}


# --------------------------------------------------
# BUILD ANALYSIS PAYLOAD
# --------------------------------------------------

def build_analysis_payload(
    filename: str,
    weather_data: dict,
    cv_data: dict,
    is_placeholder: bool = False,
    field: dict | None = None
) -> dict:

    now = datetime.now()

    # Defaults to the Pi's own field when no other field is given (the two callers
    # that build a payload for a specific manually-added field always pass one in).
    field = field or db.NORTH_FIELD_DEFAULTS

    # --------------------------------------------------
    # WEATHER
    # --------------------------------------------------

    cur_weather = weather_data.get("current", {})

    temp = cur_weather.get(
        "temperature_c",
        15.7
    )

    rh = cur_weather.get(
        "humidity_percent",
        cur_weather.get(
            "relative_humidity_pct",
            73
        )
    )

    wind = cur_weather.get(
        "wind_speed_kmh",
        6.9
    )

    precipitation = cur_weather.get(
        "precipitation_mm",
        0.0
    )

    weather_code = cur_weather.get(
        "weather_code",
        None
    )

    # --------------------------------------------------
    # CV DATA
    # --------------------------------------------------

    affected_pct = cv_data.get(
        "affected_area_percent",
        0.0
    )

    health_score = cv_data.get(
        "overall_health_score",
        80
    )

    health_status = cv_data.get(
        "health_status",
        "GOOD"
    )

    health_indicators = cv_data.get(
        "health_indicators",
        {}
    )

    detected_issues = cv_data.get(
        "detected_issues",
        []
    )

    affected_regions = cv_data.get(
        "affected_regions",
        []
    )

    # --------------------------------------------------
    # ENVIRONMENTAL IMPACT
    # --------------------------------------------------

    treatment_reduction = round(
        max(
            0.0,
            100.0 - affected_pct
        ),
        1
    )

    env_score = int(
        min(
            100,
            max(
                20,
                health_score + 10
            )
        )
    )

    # --------------------------------------------------
    # WEATHER / AGRICULTURAL RISK
    # --------------------------------------------------

    leaf_wetness = weather_data.get(
        "agricultural",
        {}
    ).get(
        "leaf_wetness_probability_percent",
        75 if rh > 70 else 35
    )

    if (
        affected_pct > 15.0
        or (
            leaf_wetness > 65
            and rh > 70
        )
    ):
        risk_level = "HIGH"

        rec_action = (
            "targeted_spray_and_reduce_water"
        )

        rec_msg = (
            f"Treat {affected_pct}% affected "
            "target zones. Suspend overhead "
            "irrigation immediately."
        )

    elif (
        affected_pct > 5.0
        or leaf_wetness > 50
    ):
        risk_level = "MODERATE"

        rec_action = "targeted_monitoring"

        rec_msg = (
            f"Monitor {affected_pct}% affected "
            "area. Delay irrigation until "
            "humidity decreases."
        )

    else:
        risk_level = "LOW"

        rec_action = "routine_maintenance"

        rec_msg = (
            "Field conditions optimal. "
            "Continue standard management schedule."
        )

    # --------------------------------------------------
    # WEATHER AGRICULTURAL DATA
    # --------------------------------------------------

    agricultural = weather_data.get(
        "agricultural",
        {}
    )

    # --------------------------------------------------
    # FORECAST DATA
    # --------------------------------------------------

    forecast = weather_data.get(
        "forecast",
        {}
    )

    # --------------------------------------------------
    # WEEKLY REPORT DATES
    # --------------------------------------------------

    report_start = now
    report_end = now + timedelta(days=6)

    # --------------------------------------------------
    # RECOMMENDED ACTION DATES
    # --------------------------------------------------

    action_1 = now
    action_2 = now + timedelta(days=2)
    action_3 = now + timedelta(days=4)

    # --------------------------------------------------
    # FINAL PAYLOAD
    # --------------------------------------------------

    return {

        # ==================================================
        # FIELD
        # ==================================================

        "field": {
            "field_id": field.get("id", "north_field"),
            "name": field.get("name"),
            "crop": field.get("crop"),
            "grass_type": field.get("grass_type"),
            "area_acres": field.get("area_acres"),
            "latitude": field.get("latitude"),
            "longitude": field.get("longitude"),
            "elevation_m": field.get("elevation_m")
        },

        # ==================================================
        # CAPTURE
        # ==================================================

        "capture": {
            "timestamp": now.isoformat(),
            "image_url": f"/uploads/{filename}",
            "source": (
                "none"
                if is_placeholder
                else "raspberry_pi"
            )
        },

        "is_placeholder": is_placeholder,

        # ==================================================
        # GRASS ANALYSIS
        # ==================================================

        "grass_analysis": {

            "overall_health_score": health_score,

            "health_status": health_status,

            "health_indicators": health_indicators,

            "detected_issues": detected_issues,

            "affected_area_percent": affected_pct,

            "affected_regions": affected_regions
        },

        # ==================================================
        # SOIL ANALYSIS
        # ==================================================

        "soil_analysis": {

            "visual_type": cv_data.get(
                "soil_visual",
                {}
            ).get(
                "visual_type",
                "loamy"
            ),

            "moisture": cv_data.get(
                "soil_visual",
                {}
            ).get(
                "moisture",
                "moderate"
            ),

            "drainage_risk": cv_data.get(
                "soil_visual",
                {}
            ).get(
                "drainage_risk",
                "low"
            ),

            "confidence": cv_data.get(
                "soil_visual",
                {}
            ).get(
                "confidence",
                0.80
            ),

            "soil_indicators": {

                "surface_moisture": (
                    0.38
                    if cv_data.get(
                        "soil_visual",
                        {}
                    ).get("moisture") == "high"
                    else 0.24
                ),

                "apparent_compaction": "low",

                "apparent_drainage": "moderate"
            }
        },

        # ==================================================
        # WEATHER
        # ==================================================

        "weather": {

            "current": {

                "temperature_c": temp,

                "humidity_percent": rh,

                "relative_humidity_pct": rh,

                "precipitation_mm": precipitation,

                "wind_speed_kmh": wind,

                "wind_direction_deg": cur_weather.get("wind_direction_deg"),

                "cloud_cover_pct": cur_weather.get("cloud_cover_pct"),

                "pressure_hpa": cur_weather.get("pressure_hpa"),

                "weather_code": weather_code,

                "weather_description": cur_weather.get("weather_description")
            },

            "forecast": forecast,

            "agricultural": agricultural
        },

        # ==================================================
        # RISK ASSESSMENT
        # ==================================================

        "risk_assessment": {

            "overall_risk": risk_level,

            "risks": [

                {
                    "type": "fungal_disease",

                    "level": (
                        "HIGH"
                        if rh > 70
                        else "LOW"
                    ),

                    "confidence": 0.82
                },

                {
                    "type": "turf_stress",

                    "level": (
                        "HIGH"
                        if affected_pct > 12.0
                        else "MODERATE"
                    ),

                    "confidence": 0.79
                }
            ],

            "risk_factors": [

                f"Relative humidity at {rh}%",

                (
                    f"Detected stress/weed "
                    f"coverage at {affected_pct}%"
                ),

                "Automated leaf wetness risk"
            ]
        },

        # ==================================================
        # RECOMMENDATIONS
        # ==================================================

        "recommendations": {

            "immediate": {

                "priority": (
                    "HIGH"
                    if risk_level != "LOW"
                    else "LOW"
                ),

                "action": rec_action,

                "message": rec_msg
            },

            "actions": [

                {
                    "action": "spot_treatment",

                    "priority": "HIGH",

                    "reason": (
                        f"Only treat {affected_pct}% "
                        "of total field area."
                    )
                },

                {
                    "action": "adjust_irrigation",

                    "priority": "MEDIUM",

                    "reason": (
                        "Balance soil moisture "
                        "with ambient humidity."
                    )
                }
            ]
        },

        # ==================================================
        # ENVIRONMENTAL IMPACT
        # ==================================================

        "environmental_impact": {

            "affected_area_percent": affected_pct,

            "potential_treatment_area_reduction_percent":
                treatment_reduction,

            "estimated_chemical_use_reduction_percent":
                treatment_reduction,

            "water_use_status": (
                "REDUCE_IRRIGATION"
                if rh > 70
                else "STANDARD_IRRIGATION"
            ),

            "environmental_score": env_score,

            "explanation": (
                f"Precision spot-treating the "
                f"detected {affected_pct}% affected "
                f"area avoids blanket spraying and "
                f"saves {treatment_reduction}% "
                "in chemical volume."
            )
        },

        # ==================================================
        # HEAT MAP
        # ==================================================

        "heat_map": {

            "enabled": True,

            "resolution": "grid",

            "regions": affected_regions
        },

        # ==================================================
        # WEEKLY REPORT
        # ==================================================

        "weekly_report": {

            "period": {

                "start": report_start.strftime(
                    "%Y-%m-%d"
                ),

                "end": report_end.strftime(
                    "%Y-%m-%d"
                )
            },

            "predicted_health_score":
                health_score,

            "predicted_health_status":
                health_status,

            "trend": (
                "STABLE"
                if risk_level == "LOW"
                else "NEEDS_ATTENTION"
            ),

            "summary": (
                f"Current health index is "
                f"{health_score}/100 with "
                f"{affected_pct}% stressed coverage."
            ),

            "future_risks": [

                {
                    "risk": "fungal_disease",

                    "probability": (
                        0.75
                        if rh > 70
                        else 0.25
                    ),

                    "reason": (
                        "Ambient moisture conditions."
                    )
                }
            ],

            "weekly_advice": [

                "Prioritize spot-treatment over broad application.",

                "Review daily humidity patterns before scheduled watering.",

                "Monitor affected regions identified by the AI.",

                "Reassess field conditions after significant rainfall."
            ],

            "recommended_actions": [

                {
                    "day": action_1.strftime("%A"),

                    "date": action_1.strftime(
                        "%Y-%m-%d"
                    ),

                    "action": (
                        "Inspect high-risk areas "
                        "identified by the AI."
                    )
                },

                {
                    "day": action_2.strftime("%A"),

                    "date": action_2.strftime(
                        "%Y-%m-%d"
                    ),

                    "action": (
                        "Reassess soil moisture "
                        "before irrigation."
                    )
                },

                {
                    "day": action_3.strftime("%A"),

                    "date": action_3.strftime(
                        "%Y-%m-%d"
                    ),

                    "action": (
                        "Capture another field scan "
                        "and compare health trends."
                    )
                }
            ]
        }
    }


# --------------------------------------------------
# LATEST STATUS
# --------------------------------------------------

@app.get("/api/latest-status")
async def get_latest_status():

    if app.state.latest_analysis:
        return app.state.latest_analysis

    weather_data = await fetch_weather(
        lat=43.4663,
        lon=-79.9786
    )

    fallback_cv = {

        "overall_health_score": 85,

        "health_status": "GOOD",

        "health_indicators": {
            "color_health": 88,
            "density": 82,
            "growth": 85,
            "stress": 15
        },

        "detected_issues": [],

        "affected_area_percent": 4.5,

        "affected_regions": [],

        "soil_visual": {
            "visual_type": "loamy",
            "moisture": "moderate",
            "drainage_risk": "low",
            "confidence": 0.8
        }
    }

    return build_analysis_payload(
        "field_placeholder.jpg",
        weather_data,
        fallback_cv,
        is_placeholder=True
    )


# --------------------------------------------------
# UPLOAD / ANALYZE IMAGE
# --------------------------------------------------

ALLOWED_UPLOAD_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif"
}


async def _save_upload(file: UploadFile) -> str:
    """Validates and saves an uploaded image under a server-generated name (never the
    client-supplied filename — see the path-traversal note in analyze_field's history).
    Returns the filename (relative to UPLOAD_DIR)."""
    if file.content_type not in ALLOWED_UPLOAD_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported content type: {file.content_type}")

    original_name = os.path.basename(file.filename or "")
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"):
        ext = ".jpg"
    safe_filename = f"field_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(saved_path, "wb") as buffer:
        buffer.write(await file.read())

    return safe_filename


async def _analyze_upload(file: UploadFile, lat: float, lon: float, field: dict | None = None) -> tuple[str, dict]:
    """Shared pipeline behind both /api/analyze (the Pi's own field) and
    /api/fields/{id}/scans (any manually-added field): save the image, run the same
    CV engine, fetch live weather for that field's coordinates, and build the payload."""
    safe_filename = await _save_upload(file)
    cv_data = analyze_turf_image(os.path.join(UPLOAD_DIR, safe_filename))
    weather_data = await fetch_weather(lat=lat, lon=lon)
    payload = build_analysis_payload(safe_filename, weather_data, cv_data, field=field)
    return safe_filename, payload


@app.post("/api/analyze")
async def analyze_field(
    file: UploadFile = File(...)
):
    """The Raspberry Pi's own endpoint — always the seeded North Field, and always
    updates the live /api/latest-status state in addition to the scan history."""
    _, payload = await _analyze_upload(file, lat=43.4663, lon=-79.9786, field=None)

    app.state.latest_analysis = payload
    app.state.fulfilled_request_id = app.state.capture_request_id
    _persist_latest_analysis(payload)

    db.create_scan(NORTH_FIELD_ID, payload, source="raspberry_pi")

    return payload


# --------------------------------------------------
# FIELDS (self-hosted replacement for base44's Field entity)
# --------------------------------------------------

class FieldCreate(BaseModel):
    name: str
    crop: str | None = None
    grass_type: str | None = None
    area_acres: float | None = None
    latitude: float | None = None
    longitude: float | None = None
    elevation_m: float | None = None


class FieldUpdate(BaseModel):
    name: str | None = None
    crop: str | None = None
    grass_type: str | None = None
    area_acres: float | None = None
    latitude: float | None = None
    longitude: float | None = None
    elevation_m: float | None = None


@app.get("/api/fields")
async def api_list_fields():
    return db.list_fields()


@app.post("/api/fields")
async def api_create_field(body: FieldCreate):
    return db.create_field(body.model_dump())


@app.get("/api/fields/{field_id}")
async def api_get_field(field_id: int):
    field = db.get_field(field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field


@app.patch("/api/fields/{field_id}")
async def api_update_field(field_id: int, body: FieldUpdate):
    field = db.update_field(field_id, body.model_dump())
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field


@app.delete("/api/fields/{field_id}")
async def api_delete_field(field_id: int):
    if field_id == NORTH_FIELD_ID:
        raise HTTPException(status_code=400, detail="Can't delete the Raspberry Pi's own field")
    if not db.delete_field(field_id):
        raise HTTPException(status_code=404, detail="Field not found")
    return {"deleted": True}


@app.get("/api/fields/{field_id}/weather")
async def api_field_weather(field_id: int):
    field = db.get_field(field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    lat = field.get("latitude") if field.get("latitude") is not None else 43.4663
    lon = field.get("longitude") if field.get("longitude") is not None else -79.9786
    return await fetch_weather(lat=lat, lon=lon)


@app.get("/api/fields/{field_id}/scans")
async def api_list_field_scans(field_id: int, limit: int = 50):
    field = db.get_field(field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return db.list_scans(field_id=field_id, limit=limit)


@app.post("/api/fields/{field_id}/scans")
async def api_create_field_scan(field_id: int, file: UploadFile = File(...)):
    """New Scan workflow: upload a photo for any manually-added field. Runs the exact
    same CV engine and weather fetch the Raspberry Pi's own pipeline uses, scoped to
    this field's coordinates, and stores the result in its scan history."""
    field = db.get_field(field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    lat = field.get("latitude") if field.get("latitude") is not None else 43.4663
    lon = field.get("longitude") if field.get("longitude") is not None else -79.9786
    _, payload = await _analyze_upload(file, lat=lat, lon=lon, field=field)
    return db.create_scan(field_id, payload, source="manual")


@app.get("/api/scans/{scan_id}")
async def api_get_scan(scan_id: int):
    scan = db.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


# --------------------------------------------------
# FORECAST (rule-based — projects real scan/weather history forward, no LLM)
# --------------------------------------------------

@app.get("/api/forecast")
async def api_forecast(field_id: int | None = None):
    field = db.get_field(field_id) if field_id is not None else db.get_field(NORTH_FIELD_ID)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    scans = db.list_scans(field_id=field["id"], limit=30)
    lat = field.get("latitude") if field.get("latitude") is not None else 43.4663
    lon = field.get("longitude") if field.get("longitude") is not None else -79.9786
    weather_data = await fetch_weather(lat=lat, lon=lon)
    return forecast_engine.build_forecast(field, scans, weather_data)


# --------------------------------------------------
# FARM CONSULTANT (rule-based Q&A over real live data — no LLM)
# --------------------------------------------------

class ConsultantMessage(BaseModel):
    message: str
    field_id: int | None = None


@app.post("/api/consultant")
async def api_consultant(body: ConsultantMessage):
    fields = [db.get_field(body.field_id)] if body.field_id is not None else db.list_fields()
    fields = [f for f in fields if f]
    if not fields:
        return {"reply": consultant_engine.answer(body.message, [], {}, None)}

    latest_scans_by_field = {f["id"]: (db.list_scans(field_id=f["id"], limit=1) or [None])[0] for f in fields}

    weather_data = None
    primary = fields[0]
    lat = primary.get("latitude") if primary.get("latitude") is not None else 43.4663
    lon = primary.get("longitude") if primary.get("longitude") is not None else -79.9786
    try:
        weather_data = await fetch_weather(lat=lat, lon=lon)
    except Exception:
        weather_data = None

    reply = consultant_engine.answer(body.message, fields, latest_scans_by_field, weather_data)
    return {"reply": reply}
