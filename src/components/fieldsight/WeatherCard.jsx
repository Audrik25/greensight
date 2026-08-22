import React from "react";
import { CloudSun, Droplets, Wind, Thermometer } from "lucide-react";
import DemoBadge from "./DemoBadge";

export default function WeatherCard({ data }) {
  if (!data) {
    return (
      <div className="fs-card" style={{ padding: 20, height: '100%' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7480', marginBottom: 4 }}>Weather</div>
        <div style={{ fontSize: 12, color: '#6b7480' }}>No weather data available</div>
      </div>);

  }

  return null;












































}