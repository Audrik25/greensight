"""Rule-based farm consultant — answers questions from real, live field/weather/scan
data using keyword matching, not an LLM (no API key required, no external calls). Every
number in a reply is pulled from the actual data passed in; only the question-matching
logic itself is fixed rules."""


def _field_summary(field: dict, latest_scan: dict | None) -> str:
    name = field.get("name", "This field")
    if not latest_scan:
        return f"{name} has no scans recorded yet."
    score = latest_scan.get("overall_health_score")
    status = latest_scan.get("health_status")
    return f"{name} is at {score:.0f}/100 ({status})" if score is not None else f"{name} has no health score yet."


def answer(message: str, fields: list[dict], latest_scans_by_field: dict, weather_data: dict | None) -> str:
    text = (message or "").lower()

    def matches(*keywords):
        return any(k in text for k in keywords)

    if not fields:
        return "You don't have any fields yet — add one from the Fields page and I can start answering questions about it."

    # --- Health ---
    if matches("health", "how is", "how's", "score", "status", "doing"):
        lines = [_field_summary(f, latest_scans_by_field.get(f["id"])) for f in fields]
        return "Current field health:\n" + "\n".join(f"• {line}" for line in lines)

    # --- Water / irrigation ---
    if matches("water", "irrigat", "moisture", "dry", "drought"):
        agri = (weather_data or {}).get("agricultural", {})
        moisture = agri.get("soil_moisture_root_zone") or agri.get("soil_moisture_surface")
        if moisture is not None:
            pct = moisture * 100
            if pct < 15:
                return f"Root-zone soil moisture is at {pct:.0f}% — that's low. I'd irrigate within the next 24-48 hours."
            if pct < 22:
                return f"Root-zone soil moisture is at {pct:.0f}% — a bit below optimal. Worth scheduling irrigation soon if there's no rain forecast."
            return f"Root-zone soil moisture is at {pct:.0f}% — that's adequate for now, no irrigation needed."
        return "I don't have live soil moisture data yet — that shows up once a field has weather data loaded."

    # --- Risk / disease / pests ---
    if matches("risk", "disease", "pest", "problem", "issue", "weed"):
        lines = []
        for f in fields:
            scan = latest_scans_by_field.get(f["id"])
            if not scan:
                continue
            payload = scan.get("payload", {})
            risk = payload.get("risk_assessment", {})
            issues = payload.get("grass_analysis", {}).get("detected_issues", [])
            overall = risk.get("overall_risk", "LOW")
            if issues:
                issue_names = ", ".join(i.get("name", i.get("type", "issue")).replace("_", " ") for i in issues)
                lines.append(f"{f['name']}: {overall} risk — detected {issue_names}")
            else:
                lines.append(f"{f['name']}: {overall} risk, no issues detected in the last scan")
        if not lines:
            return "No scans yet to assess risk from — run a scan on a field first."
        return "Risk overview:\n" + "\n".join(f"• {l}" for l in lines)

    # --- Weather ---
    if matches("weather", "rain", "temperature", "wind", "hot", "cold", "forecast"):
        if not weather_data:
            return "I don't have live weather data loaded right now."
        cur = weather_data.get("current", {})
        parts = []
        if cur.get("temperature_c") is not None:
            parts.append(f"{cur['temperature_c']:.0f}°C")
        if cur.get("relative_humidity_pct") is not None:
            parts.append(f"{cur['relative_humidity_pct']:.0f}% humidity")
        if cur.get("wind_speed_kmh") is not None:
            parts.append(f"{cur['wind_speed_kmh']:.0f} km/h wind")
        if cur.get("weather_description"):
            parts.append(cur["weather_description"])
        return "Current conditions: " + ", ".join(parts) if parts else "No current weather reading available."

    # --- Recommendations ---
    if matches("recommend", "should i", "what do i do", "advice", "action"):
        lines = []
        for f in fields:
            scan = latest_scans_by_field.get(f["id"])
            if not scan:
                continue
            rec = scan.get("payload", {}).get("recommendations", {}).get("immediate")
            if rec:
                lines.append(f"{f['name']}: {rec.get('message', rec.get('action', 'No specific action.'))}")
        if not lines:
            return "No recommendations available yet — run a scan first."
        return "Recommendations:\n" + "\n".join(f"• {l}" for l in lines)

    # --- Greeting / fallback ---
    if matches("hi", "hello", "hey"):
        return "Hi! Ask me about field health, watering, weather, risks, or what to do next — I'll answer from your live data."

    return (
        "I can answer questions about: field health, watering/soil moisture, weather, "
        "risks/diseases/weeds, and recommended actions — all pulled from your live scans "
        "and weather data. Try asking something like \"how healthy is my field?\" or "
        "\"should I water today?\""
    )
