"""Rule-based (no LLM) forecasting — projects a field's health forward using its real
scan history and the live 7-day Open-Meteo forecast already fetched for it. No AI
narrative; every number here is computed from real data plus fixed, documented
thresholds (the same pattern build_analysis_payload already uses for risk levels)."""
from datetime import datetime, timedelta


def _trend_from_scores(scores: list[float]) -> str:
    """scores are oldest-first. Compares the average of the first half to the second
    half of the available history — simple and stable with only a handful of points."""
    if len(scores) < 2:
        return "stable"
    mid = len(scores) // 2 or 1
    first_half_avg = sum(scores[:mid]) / mid
    second_half_avg = sum(scores[mid:]) / max(1, len(scores) - mid)
    delta = second_half_avg - first_half_avg
    if delta > 5:
        return "improving"
    if delta < -8:
        return "declining"
    if delta < -3:
        return "slight_decline"
    return "stable"


def build_forecast(field: dict, scans: list[dict], weather_data: dict) -> dict:
    """scans: newest-first (as returned by db.list_scans)."""
    scans_oldest_first = list(reversed(scans))
    scores = [s["overall_health_score"] for s in scans_oldest_first if s.get("overall_health_score") is not None]
    current_score = scores[-1] if scores else 100
    trend = _trend_from_scores(scores)

    daily = weather_data.get("forecast", {}).get("daily", [])
    today = datetime.now().date()

    daily_forecasts = []
    projected = current_score
    for i, day in enumerate(daily[:7]):
        rain_prob = day.get("precipitation_probability_pct", 15)
        wind_max = day.get("wind_max_kmh", 20)
        uv = day.get("uv_index", 6)

        # Small, bounded daily adjustment from real forecasted conditions — not random,
        # not AI-generated, just a documented heuristic:
        #   heavy rain probability -> slightly worse (disease/leaf wetness pressure)
        #   very low rain + high UV -> slightly worse (drought/heat stress)
        #   otherwise -> tiny natural recovery if currently below 100
        if rain_prob > 60:
            adjustment = -1.5
        elif rain_prob < 15 and uv > 7:
            adjustment = -1.0
        else:
            adjustment = 0.4 if projected < 95 else 0.0
        projected = max(10.0, min(100.0, projected + adjustment))

        daily_forecasts.append({
            "day": i + 1,
            "date": day.get("date", (today + timedelta(days=i)).isoformat()),
            "health_score": round(projected, 1),
            "precipitation_probability_pct": rain_prob,
            "wind_max_kmh": wind_max,
            "uv_index": uv,
            "disease_risk": min(100, round(rain_prob * 0.8)),
            "weed_risk": 45 if projected < 70 else 15,
        })

    risks = []
    if any(d.get("precipitation_probability_pct", 0) > 60 for d in daily[:7]):
        risks.append({
            "type": "excess_moisture",
            "severity": "medium",
            "timeframe": "Within 7 days",
            "description": "High rain probability forecasted — elevated leaf wetness and fungal disease pressure.",
        })
    if any(d.get("wind_max_kmh", 0) > 25 for d in daily[:7]):
        risks.append({
            "type": "spray_drift",
            "severity": "low",
            "timeframe": "Within 7 days",
            "description": "Forecasted wind exceeds safe spray thresholds on at least one day — plan treatments around calmer windows.",
        })
    if all(d.get("precipitation_probability_pct", 0) < 20 for d in daily[:7]) and daily:
        risks.append({
            "type": "low_moisture",
            "severity": "medium",
            "timeframe": "Within 7 days",
            "description": "No meaningful rain forecasted this week — monitor soil moisture and irrigate proactively.",
        })
    if current_score < 60:
        risks.append({
            "type": "declining_health",
            "severity": "high" if current_score < 40 else "medium",
            "timeframe": "Current",
            "description": f"Last scan measured {current_score:.0f}/100 health — below the healthy range.",
        })

    actions = []
    if any(r["type"] == "excess_moisture" for r in risks):
        actions.append({"action": "Hold fungicide/pesticide spraying on high rain-probability days", "priority": "medium"})
    if any(r["type"] == "low_moisture" for r in risks):
        actions.append({"action": "Schedule irrigation — no significant rain expected this week", "priority": "medium"})
    if any(r["type"] == "declining_health" for r in risks):
        actions.append({"action": "Inspect the field in person and consider an off-schedule scan", "priority": "high"})
    if not actions:
        actions.append({"action": "No action needed — continue routine monitoring", "priority": "low"})

    return {
        "field_id": field.get("id"),
        "field_name": field.get("name"),
        "generated_at": datetime.now().isoformat(),
        "current_health_score": round(current_score, 1),
        "trend": trend,
        "scan_count": len(scores),
        "daily_forecasts": daily_forecasts,
        "risks": risks,
        "recommended_actions": actions,
        "summary": (
            f"{field.get('name', 'This field')} is trending {trend.replace('_', ' ')} "
            f"based on {len(scores)} recorded scan{'s' if len(scores) != 1 else ''}, "
            f"currently at {current_score:.0f}/100. {len(risks)} risk{'s' if len(risks) != 1 else ''} "
            f"identified from the 7-day forecast."
        ),
    }
