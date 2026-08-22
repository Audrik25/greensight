import React from "react";
import { CloudRain, Droplets, Wind, Thermometer, Cloud, Leaf, Sun, Layers, CloudOff } from "lucide-react";

function Metric({ icon: Icon, label, value, unit, color = '#e8eaed' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#1c2129', borderRadius: 10, border: '1px solid #252a33' }}>
      <Icon style={{ width: 16, height: 16, color: '#6b7480', flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, color: '#6b7480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color }}>{value}{unit && <span style={{ fontSize: 11, color: '#6b7480', marginLeft: 2 }}>{unit}</span>}</div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

export default function EnhancedWeatherCard({ data }) {
  if (!data) return null;

  const hasCurrent = data.temperature != null || data.humidity != null || data.precipitation != null || data.wind_speed != null;
  const hasForecast = data.rain_probability_percent != null || data.forecast_precipitation_mm != null || data.dew_point_c != null || data.cloud_cover_percent != null;
  const hasAgri = data.leaf_wetness_probability_percent != null || data.growing_degree_days != null || data.soil_temperature_0cm_c != null || data.soil_moisture_0_to_1cm != null;

  if (!hasCurrent && !hasForecast && !hasAgri) return null;

  return (
    <div className="fs-card" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#16261c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CloudRain style={{ width: 18, height: 18, color: '#4ea8d8' }} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8eaed', margin: 0 }}>Weather &amp; Environmental</h3>
          <span style={{ fontSize: 12, color: '#6b7480' }}>Current conditions, forecast &amp; agricultural metrics</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {hasCurrent && (
          <Section title="Current Conditions">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {data.temperature != null && <Metric icon={Thermometer} label="Temperature" value={data.temperature.toFixed(1)} unit="°C" color="#d97742" />}
              {data.humidity != null && <Metric icon={Droplets} label="Humidity" value={data.humidity.toFixed(0)} unit="%" color="#4ea8d8" />}
              {data.precipitation != null && <Metric icon={CloudRain} label="Precipitation" value={data.precipitation.toFixed(1)} unit="mm" />}
              {data.wind_speed != null && <Metric icon={Wind} label="Wind Speed" value={data.wind_speed.toFixed(1)} unit="km/h" />}
            </div>
          </Section>
        )}

        {hasForecast && (
          <Section title="Forecast">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {data.rain_probability_percent != null && <Metric icon={CloudRain} label="Rain Probability" value={data.rain_probability_percent.toFixed(0)} unit="%" color="#4ea8d8" />}
              {data.forecast_precipitation_mm != null && <Metric icon={CloudRain} label="Forecast Precip" value={data.forecast_precipitation_mm.toFixed(1)} unit="mm" />}
              {data.forecast_humidity_percent != null && <Metric icon={Droplets} label="Forecast Humidity" value={data.forecast_humidity_percent.toFixed(0)} unit="%" />}
              {data.dew_point_c != null && <Metric icon={Thermometer} label="Dew Point" value={data.dew_point_c.toFixed(1)} unit="°C" />}
              {data.forecast_wind_speed_kmh != null && <Metric icon={Wind} label="Forecast Wind" value={data.forecast_wind_speed_kmh.toFixed(1)} unit="km/h" />}
              {data.wind_gusts_kmh != null && <Metric icon={Wind} label="Wind Gusts" value={data.wind_gusts_kmh.toFixed(1)} unit="km/h" color="#d97742" />}
              {data.cloud_cover_percent != null && <Metric icon={data.cloud_cover_percent > 50 ? Cloud : CloudOff} label="Cloud Cover" value={data.cloud_cover_percent.toFixed(0)} unit="%" />}
            </div>
          </Section>
        )}

        {hasAgri && (
          <Section title="Agricultural Metrics">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {data.leaf_wetness_probability_percent != null && <Metric icon={Leaf} label="Leaf Wetness Prob" value={data.leaf_wetness_probability_percent.toFixed(0)} unit="%" color="#4ec285" />}
              {data.growing_degree_days != null && <Metric icon={Sun} label="Growing Degree Days" value={data.growing_degree_days.toFixed(1)} />}
              {data.et0_evapotranspiration_mm != null && <Metric icon={Droplets} label="ET0 Evapotransp" value={data.et0_evapotranspiration_mm.toFixed(1)} unit="mm" />}
              {data.soil_temperature_0cm_c != null && <Metric icon={Thermometer} label="Soil Temp 0cm" value={data.soil_temperature_0cm_c.toFixed(1)} unit="°C" />}
              {data.soil_temperature_6cm_c != null && <Metric icon={Thermometer} label="Soil Temp 6cm" value={data.soil_temperature_6cm_c.toFixed(1)} unit="°C" />}
              {data.soil_moisture_0_to_1cm != null && <Metric icon={Layers} label="Soil Moist 0-1cm" value={(data.soil_moisture_0_to_1cm * 100).toFixed(0)} unit="%" color="#4ea8d8" />}
              {data.soil_moisture_3_to_9cm != null && <Metric icon={Layers} label="Soil Moist 3-9cm" value={(data.soil_moisture_3_to_9cm * 100).toFixed(0)} unit="%" color="#4ea8d8" />}
              {data.soil_moisture_9_to_27cm != null && <Metric icon={Layers} label="Soil Moist 9-27cm" value={(data.soil_moisture_9_to_27cm * 100).toFixed(0)} unit="%" color="#4ea8d8" />}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}