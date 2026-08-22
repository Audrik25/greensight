import httpx
from typing import Dict, Any, List


DEFAULT_LAT = 43.4663
DEFAULT_LON = -79.9786

OPEN_METEO_URL = (
    "https://api.open-meteo.com/v1/forecast?"
    "latitude={lat}&longitude={lon}"
    "&daily=leaf_wetness_probability_mean,growing_degree_days_base_0_limit_50,weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max"
    "&hourly=dew_point_2m,relative_humidity_2m,vapour_pressure_deficit,precipitation,"
    "precipitation_probability,wind_gusts_10m,wind_speed_10m,weather_code,"
    "soil_moisture_0_to_1cm,soil_moisture_3_to_9cm,soil_temperature_0cm,"
    "soil_temperature_6cm,et0_fao_evapotranspiration,apparent_temperature,"
    "wind_direction_10m,cloud_cover,soil_moisture_9_to_27cm"
    "&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover,surface_pressure"
    "&timezone=auto&past_days=1&forecast_days=7"
)

MOCK_RESPONSE = {
    "latitude": 43.4663,
    "longitude": -79.9786,
    "generationtime_ms": 1.2,
    "utc_offset_seconds": -14400,
    "timezone": "America/Toronto",
    "timezone_abbreviation": "EDT",
    "elevation": 212.0,
    "current_units": {
        "time": "iso8601",
        "interval": "seconds",
        "temperature_2m": "°C",
        "relative_humidity_2m": "%",
        "precipitation": "mm",
        "weather_code": "wmo code",
        "wind_speed_10m": "km/h",
        "wind_direction_10m": "°",
        "cloud_cover": "%",
        "surface_pressure": "hPa"
    },
    "current": {
        "time": "2026-08-21T14:00",
        "interval": 900,
        "temperature_2m": 24.5,
        "relative_humidity_2m": 68,
        "precipitation": 0.0,
        "weather_code": 1,
        "wind_speed_10m": 8.2,
        "wind_direction_10m": 235,
        "cloud_cover": 25,
        "surface_pressure": 1013.2
    },
    "hourly_units": {
        "time": "iso8601",
        "dew_point_2m": "°C",
        "relative_humidity_2m": "%",
        "vapour_pressure_deficit": "kPa",
        "precipitation": "mm",
        "precipitation_probability": "%",
        "wind_gusts_10m": "km/h",
        "wind_speed_10m": "km/h",
        "weather_code": "wmo code",
        "soil_moisture_0_to_1cm": "m³/m³",
        "soil_moisture_3_to_9cm": "m³/m³",
        "soil_temperature_0cm": "°C",
        "soil_temperature_6cm": "°C",
        "et0_fao_evapotranspiration": "mm",
        "apparent_temperature": "°C",
        "wind_direction_10m": "°",
        "cloud_cover": "%",
        "soil_moisture_9_to_27cm": "m³/m³"
    },
    "hourly": {
        "time": [
            "2026-08-21T00:00", "2026-08-21T01:00", "2026-08-21T02:00",
            "2026-08-21T03:00", "2026-08-21T04:00", "2026-08-21T05:00",
            "2026-08-21T06:00", "2026-08-21T07:00", "2026-08-21T08:00",
            "2026-08-21T09:00", "2026-08-21T10:00", "2026-08-21T11:00",
            "2026-08-21T12:00", "2026-08-21T13:00", "2026-08-21T14:00",
            "2026-08-21T15:00", "2026-08-21T16:00", "2026-08-21T17:00",
            "2026-08-21T18:00", "2026-08-21T19:00", "2026-08-21T20:00",
            "2026-08-21T21:00", "2026-08-21T22:00", "2026-08-21T23:00",
            "2026-08-22T00:00", "2026-08-22T01:00", "2026-08-22T02:00",
            "2026-08-22T03:00", "2026-08-22T04:00", "2026-08-22T05:00",
            "2026-08-22T06:00", "2026-08-22T07:00", "2026-08-22T08:00",
            "2026-08-22T09:00", "2026-08-22T10:00", "2026-08-22T11:00",
            "2026-08-22T12:00", "2026-08-22T13:00", "2026-08-22T14:00",
            "2026-08-22T15:00", "2026-08-22T16:00", "2026-08-22T17:00",
            "2026-08-22T18:00", "2026-08-22T19:00", "2026-08-22T20:00",
            "2026-08-22T21:00", "2026-08-22T22:00", "2026-08-22T23:00"
        ],
        "dew_point_2m": [18.2, 17.8, 17.5, 17.3, 17.1, 17.0, 17.2, 17.8, 18.5, 19.1, 19.5, 19.8, 19.9, 19.7, 19.3, 18.9, 18.6, 18.4, 18.3, 18.2, 18.1, 18.0, 17.9, 17.8] + [17.5]*24,
        "relative_humidity_2m": [85, 87, 88, 89, 90, 91, 90, 88, 82, 76, 71, 68, 65, 64, 63, 64, 66, 68, 72, 76, 80, 82, 84, 85] + [80]*24,
        "vapour_pressure_deficit": [0.85, 0.78, 0.72, 0.68, 0.65, 0.62, 0.63, 0.71, 0.88, 1.02, 1.15, 1.24, 1.31, 1.35, 1.38, 1.35, 1.28, 1.21, 1.08, 0.95, 0.88, 0.85, 0.82, 0.80] + [0.8]*24,
        "precipitation": [0.0] * 48,
        "precipitation_probability": [5, 5, 5, 5, 5, 10, 10, 10, 10, 15, 15, 20, 20, 25, 25, 30, 30, 35, 40, 35, 30, 25, 20, 15] + [15]*24,
        "wind_gusts_10m": [12.5, 11.8, 11.2, 10.8, 10.5, 10.2, 10.5, 11.8, 14.2, 16.5, 18.2, 19.5, 20.1, 19.8, 19.2, 18.5, 17.8, 16.8, 15.5, 14.2, 13.5, 12.8, 12.2, 11.8] + [12]*24,
        "wind_speed_10m": [6.2, 5.8, 5.5, 5.2, 5.0, 4.8, 5.0, 5.8, 7.2, 8.5, 9.2, 9.8, 10.1, 9.8, 9.5, 9.2, 8.8, 8.2, 7.5, 6.8, 6.2, 5.8, 5.5, 5.2] + [6]*24,
        "weather_code": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1] + [1]*24,
        "soil_moisture_0_to_1cm": [0.22, 0.22, 0.22, 0.22, 0.22, 0.22, 0.22, 0.22, 0.21, 0.20, 0.19, 0.18, 0.18, 0.17, 0.17, 0.17, 0.17, 0.17, 0.17, 0.18, 0.18, 0.19, 0.20, 0.21] + [0.2]*24,
        "soil_moisture_3_to_9cm": [0.28, 0.28, 0.28, 0.28, 0.28, 0.28, 0.28, 0.28, 0.28, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.27, 0.28, 0.28] + [0.27]*24,
        "soil_temperature_0cm": [19.2, 18.8, 18.5, 18.2, 18.0, 17.8, 17.8, 18.2, 19.5, 21.2, 22.8, 24.1, 25.2, 25.8, 26.1, 26.0, 25.5, 24.8, 23.8, 22.8, 21.8, 20.8, 20.0, 19.5] + [20]*24,
        "soil_temperature_6cm": [18.8, 18.7, 18.6, 18.5, 18.4, 18.3, 18.3, 18.4, 18.8, 19.5, 20.2, 21.0, 21.8, 22.4, 22.8, 23.0, 23.0, 22.8, 22.4, 21.8, 21.2, 20.6, 20.1, 19.7] + [20]*24,
        "et0_fao_evapotranspiration": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.2, 0.4, 0.6, 0.8, 1.0, 1.1, 1.2, 1.1, 1.0, 0.8, 0.6, 0.4, 0.2, 0.1, 0.0, 0.0] + [0.0]*24,
        "apparent_temperature": [18.5, 18.2, 18.0, 17.8, 17.6, 17.5, 17.6, 18.2, 19.5, 21.2, 22.8, 24.1, 25.2, 25.8, 26.1, 26.0, 25.5, 24.8, 23.8, 22.8, 21.8, 20.8, 20.0, 19.5] + [20]*24,
        "wind_direction_10m": [220, 218, 215, 212, 210, 208, 210, 215, 225, 235, 242, 248, 252, 255, 255, 252, 248, 242, 235, 228, 222, 218, 215, 212] + [220]*24,
        "cloud_cover": [25, 20, 15, 10, 5, 5, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 75, 70] + [50]*24,
        "soil_moisture_9_to_27cm": [0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.32, 0.31, 0.31, 0.31, 0.31, 0.31, 0.31, 0.31, 0.31, 0.31, 0.31, 0.31, 0.32, 0.32] + [0.32]*24
    },
    "daily_units": {
        "time": "iso8601",
        "weather_code": "wmo code",
        "temperature_2m_max": "°C",
        "temperature_2m_min": "°C",
        "precipitation_sum": "mm",
        "precipitation_probability_max": "%",
        "wind_speed_10m_max": "km/h",
        "uv_index_max": "index",
        "leaf_wetness_probability_mean": "%",
        "growing_degree_days_base_0_limit_50": "°C"
    },
    "daily": {
        "time": ["2026-08-21", "2026-08-22", "2026-08-23", "2026-08-24", "2026-08-25", "2026-08-26", "2026-08-27"],
        "weather_code": [1, 2, 3, 2, 1, 1, 2],
        "temperature_2m_max": [26.5, 25.2, 24.8, 26.1, 27.3, 28.0, 27.5],
        "temperature_2m_min": [17.8, 17.2, 16.5, 17.0, 17.5, 18.2, 18.0],
        "precipitation_sum": [0.0, 0.5, 2.1, 0.0, 0.0, 0.0, 0.3],
        "precipitation_probability_max": [15, 35, 65, 20, 10, 10, 25],
        "wind_speed_10m_max": [20, 22, 25, 18, 16, 15, 17],
        "uv_index_max": [7, 6, 5, 7, 8, 8, 7],
        "leaf_wetness_probability_mean": [35.0, 42.0, 58.0, 30.0, 25.0, 20.0, 35.0],
        "growing_degree_days_base_0_limit_50": [12.5, 14.2, 11.8, 13.5, 15.2, 16.0, 15.5]
    }
}


def _build_mock_weather() -> Dict[str, Any]:
    return {
        "current": {
            "temperature_c": 24.5,
            "relative_humidity_pct": 68,
            "precipitation_mm": 0.0,
            "wind_speed_kmh": 8.2,
            "wind_direction_deg": 235,
            "cloud_cover_pct": 25,
            "pressure_hpa": 1013.2,
            "weather_code": 1,
            "weather_description": "Mainly clear"
        },
        "forecast": {
            "daily": [
                {"date": "2026-08-21", "temp_max_c": 26.5, "temp_min_c": 17.8, "precipitation_mm": 0.0, "precipitation_probability_pct": 15, "wind_max_kmh": 20, "uv_index": 7, "weather_code": 1, "description": "Mainly clear"},
                {"date": "2026-08-22", "temp_max_c": 25.2, "temp_min_c": 17.2, "precipitation_mm": 0.5, "precipitation_probability_pct": 35, "wind_max_kmh": 22, "uv_index": 6, "weather_code": 2, "description": "Partly cloudy"},
                {"date": "2026-08-23", "temp_max_c": 24.8, "temp_min_c": 16.5, "precipitation_mm": 2.1, "precipitation_probability_pct": 65, "wind_max_kmh": 25, "uv_index": 5, "weather_code": 3, "description": "Overcast"},
                {"date": "2026-08-24", "temp_max_c": 26.1, "temp_min_c": 17.0, "precipitation_mm": 0.0, "precipitation_probability_pct": 20, "wind_max_kmh": 18, "uv_index": 7, "weather_code": 2, "description": "Partly cloudy"},
                {"date": "2026-08-25", "temp_max_c": 27.3, "temp_min_c": 17.5, "precipitation_mm": 0.0, "precipitation_probability_pct": 10, "wind_max_kmh": 16, "uv_index": 8, "weather_code": 1, "description": "Clear"},
                {"date": "2026-08-26", "temp_max_c": 28.0, "temp_min_c": 18.2, "precipitation_mm": 0.0, "precipitation_probability_pct": 10, "wind_max_kmh": 15, "uv_index": 8, "weather_code": 1, "description": "Clear"},
                {"date": "2026-08-27", "temp_max_c": 27.5, "temp_min_c": 18.0, "precipitation_mm": 0.3, "precipitation_probability_pct": 25, "wind_max_kmh": 17, "uv_index": 7, "weather_code": 2, "description": "Partly cloudy"},
            ],
            "hourly_summary": {
                "next_24h": {
                    "avg_temp_c": 22.1,
                    "avg_humidity_pct": 72,
                    "total_precipitation_mm": 0.0,
                    "max_wind_kmh": 20,
                    "avg_vpd_kpa": 0.95
                }
            }
        },
        "agricultural": {
            "soil_moisture_surface": 0.21,
            "soil_moisture_root_zone": 0.275,
            "soil_moisture_deep": 0.32,
            "soil_temperature_surface_c": 24.1,
            "soil_temperature_root_c": 22.4,
            "vpd_kpa": 1.38,
            "leaf_wetness_probability_pct": 35.0,
            "growing_degree_days": 12.5,
            "et0_mm": 1.2,
            "spray_window_suitable": True,
            "frost_risk": False,
            "heat_stress_risk": "low"
        }
    }


def _at(arr: list, index: int, default):
    """Bounds-safe list index — falls back to `default` instead of raising."""
    return arr[index] if arr and index < len(arr) else default


async def fetch_weather(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON) -> Dict[str, Any]:
    url = OPEN_METEO_URL.format(lat=lat, lon=lon)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        data = MOCK_RESPONSE

    current = data.get("current", {})
    hourly = data.get("hourly", {})
    daily = data.get("daily", {})

    # OPEN_METEO_URL requests past_days=1, which prepends exactly one extra day/24 hours
    # to every "hourly"/"daily" array. Without correcting for that, every "current"-ish
    # reading pulled from those arrays (soil moisture/temp, leaf wetness, "next 24h", the
    # 7-day forecast, frost/heat risk) would actually describe yesterday, not now. These
    # offsets point at "today" in each array instead.
    daily_times = daily.get("time", [])
    daily_offset = 1 if len(daily_times) > 7 else 0
    hourly_times = hourly.get("time", [])
    hourly_offset = 24 if len(hourly_times) > 24 else 0

    soil_top = _at(hourly.get("soil_moisture_0_to_1cm", []), hourly_offset, 0.21)
    soil_3_9 = _at(hourly.get("soil_moisture_3_to_9cm", []), hourly_offset, 0.27)
    soil_9_27 = _at(hourly.get("soil_moisture_9_to_27cm", []), hourly_offset, 0.32)
    soil_root = (soil_3_9 + soil_9_27) / 2.0

    wind_speed = current.get("wind_speed_10m", 8.2)
    precip_prob_next_6h = hourly.get("precipitation_probability", [15])[hourly_offset + 1:hourly_offset + 7]
    max_precip_prob = max(precip_prob_next_6h) if precip_prob_next_6h else 15
    spray_safe = wind_speed < 15 and max_precip_prob < 30

    forecast_daily = []
    for offset, date in enumerate(daily_times[daily_offset:daily_offset + 7]):
        i = daily_offset + offset
        forecast_daily.append({
            "date": date,
            "temp_max_c": _at(daily.get("temperature_2m_max", []), i, 26.5),
            "temp_min_c": _at(daily.get("temperature_2m_min", []), i, 17.8),
            "precipitation_mm": _at(daily.get("precipitation_sum", []), i, 0.0),
            "precipitation_probability_pct": _at(daily.get("precipitation_probability_max", []), i, 15),
            "wind_max_kmh": _at(daily.get("wind_speed_10m_max", []), i, 20),
            "uv_index": _at(daily.get("uv_index_max", []), i, 7),
            "weather_code": _at(daily.get("weather_code", []), i, 1),
            "description": _weather_code_to_desc(_at(daily.get("weather_code", []), i, 1))
        })

    next_24h_humidity = hourly.get("relative_humidity_2m", [72])[hourly_offset:hourly_offset + 24]
    next_24h_precip = hourly.get("precipitation", [0.0])[hourly_offset:hourly_offset + 24]
    next_24h_wind = hourly.get("wind_speed_10m", [8.2])[hourly_offset:hourly_offset + 24]
    next_24h_vpd = hourly.get("vapour_pressure_deficit", [0.95])[hourly_offset:hourly_offset + 24]
    next_24h_temp = hourly.get("apparent_temperature", [22.1])[hourly_offset:hourly_offset + 24]

    return {
        "current": {
            "temperature_c": current.get("temperature_2m", 24.5),
            "relative_humidity_pct": current.get("relative_humidity_2m", 68),
            "precipitation_mm": current.get("precipitation", 0.0),
            "wind_speed_kmh": current.get("wind_speed_10m", 8.2),
            "wind_direction_deg": current.get("wind_direction_10m", 235),
            "cloud_cover_pct": current.get("cloud_cover", 25),
            "pressure_hpa": current.get("surface_pressure", 1013.2),
            "weather_code": current.get("weather_code", 1),
            "weather_description": _weather_code_to_desc(current.get("weather_code", 1))
        },
        "forecast": {
            "daily": forecast_daily,
            "hourly_summary": {
                "next_24h": {
                    "avg_temp_c": round(sum(next_24h_temp) / len(next_24h_temp), 1) if next_24h_temp else 22.1,
                    "avg_humidity_pct": round(sum(next_24h_humidity) / len(next_24h_humidity), 1) if next_24h_humidity else 72,
                    "total_precipitation_mm": round(sum(next_24h_precip), 1),
                    "max_wind_kmh": max(next_24h_wind) if next_24h_wind else 8.2,
                    "avg_vpd_kpa": round(sum(next_24h_vpd) / len(next_24h_vpd), 2) if next_24h_vpd else 0.95
                }
            }
        },
        "agricultural": {
            "soil_moisture_surface": round(soil_top, 3),
            "soil_moisture_root_zone": round(soil_root, 3),
            "soil_moisture_deep": round(soil_9_27, 3),
            "soil_temperature_surface_c": _at(hourly.get("soil_temperature_0cm", []), hourly_offset, 24.1),
            "soil_temperature_root_c": _at(hourly.get("soil_temperature_6cm", []), hourly_offset, 22.4),
            "vpd_kpa": _at(hourly.get("vapour_pressure_deficit", []), hourly_offset, 1.38),
            "dew_point_c": _at(hourly.get("dew_point_2m", []), hourly_offset, 18.0),
            "wind_gusts_kmh": _at(hourly.get("wind_gusts_10m", []), hourly_offset, 12.5),
            "leaf_wetness_probability_pct": _at(daily.get("leaf_wetness_probability_mean", []), daily_offset, 35.0),
            "growing_degree_days": _at(daily.get("growing_degree_days_base_0_limit_50", []), daily_offset, 12.5),
            "et0_mm": _at(hourly.get("et0_fao_evapotranspiration", []), hourly_offset, 0.0),
            "spray_window_suitable": spray_safe,
            "frost_risk": any(t < 2.0 for t in daily.get("temperature_2m_min", [17.8])[daily_offset:daily_offset + 3]),
            "heat_stress_risk": "high" if any(t > 35 for t in daily.get("temperature_2m_max", [26.5])[daily_offset:daily_offset + 3]) else ("moderate" if any(t > 30 for t in daily.get("temperature_2m_max", [26.5])[daily_offset:daily_offset + 3]) else "low")
        }
    }


def _weather_code_to_desc(code: int) -> str:
    codes = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
        55: "Dense drizzle", 56: "Light freezing drizzle", 57: "Dense freezing drizzle",
        61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
        66: "Light freezing rain", 67: "Heavy freezing rain",
        71: "Slight snow fall", 73: "Moderate snow fall", 75: "Heavy snow fall",
        77: "Snow grains", 80: "Slight rain showers", 81: "Moderate rain showers",
        82: "Violent rain showers", 85: "Slight snow showers", 86: "Heavy snow showers",
        95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail"
    }
    return codes.get(code, "Unknown")