import React from "react";
import { scoreColor, scoreToStatus, STATUS_CONFIG } from "@/lib/fieldUtils";

export default function HealthGauge({ score = 0, size = 120, strokeWidth = 10, showLabel = true }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);
  const status = scoreToStatus(score);

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#252a33" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: "'Archivo', sans-serif",
          fontSize: size * 0.28, fontWeight: 700, color: '#e8eaed', lineHeight: 1,
        }}>
          {score}
        </span>
        <span style={{
          fontSize: size * 0.085, fontWeight: 500, color: '#6b7480', marginTop: 2,
        }}>
          / 100
        </span>
        {showLabel && (
          <span style={{
            fontSize: size * 0.08, fontWeight: 600, color,
            marginTop: 4, letterSpacing: '0.02em',
          }}>
            {STATUS_CONFIG[status].label}
          </span>
        )}
      </div>
    </div>
  );
}