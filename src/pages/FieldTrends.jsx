import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sprout, Bug, Droplets, CloudRain, Leaf, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TrendGraph from "@/components/fieldsight/TrendGraph";
import PageHeader from "@/components/shared/PageHeader";

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function seededRandom(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 16777619) ^ seed.charCodeAt(i);
  }
  return () => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h / 0x7fffffff;
  };
}

function generateTrendData(field, detections, envData) {
  const rand = seededRandom(field.id || field.name);
  const baseHealth = field.health_score ?? 100;
  const hasDisease = detections.some(d => d.type === 'disease');
  const hasWeed = detections.some(d => d.type === 'weed');
  const baseHumidity = envData?.humidity ?? 60;
  const baseMoisture = envData?.humidity ? envData.humidity * 0.7 : 45;

  const healthSeason =  [0.75, 0.78, 0.85, 0.92, 0.95, 0.98, 1.0, 0.97, 0.90, 0.85, 0.78, 0.72];
  const cropSeason =    [0.70, 0.73, 0.82, 0.90, 0.96, 1.0, 0.98, 0.95, 0.88, 0.80, 0.73, 0.68];
  const diseaseSeason = [0.12, 0.15, 0.25, 0.40, 0.60, 0.85, 1.0, 0.90, 0.55, 0.30, 0.18, 0.10];
  const moistureSeason =[0.65, 0.70, 0.85, 0.90, 0.80, 0.60, 0.45, 0.40, 0.55, 0.75, 0.80, 0.70];
  const humiditySeason =[0.55, 0.58, 0.65, 0.70, 0.78, 0.88, 0.95, 0.92, 0.78, 0.68, 0.62, 0.58];
  const weedSeason =    [0.08, 0.10, 0.20, 0.35, 0.55, 0.80, 0.95, 0.85, 0.50, 0.25, 0.15, 0.06];

  return MONTHS.map((month, i) => {
    const noise = () => (rand() - 0.5) * 8;
    return {
      month,
      cropHealth: Math.max(0, Math.min(100, Math.round(baseHealth * cropSeason[i] + noise()))),
      diseaseRisk: Math.max(0, Math.min(100, Math.round((hasDisease ? 55 : 15) * diseaseSeason[i] * 1.5 + noise()))),
      soilMoisture: Math.max(0, Math.min(100, Math.round(baseMoisture * moistureSeason[i] + noise()))),
      humidity: Math.max(0, Math.min(100, Math.round(baseHumidity * humiditySeason[i] + noise()))),
      weedRisk: Math.max(0, Math.min(100, Math.round((hasWeed ? 50 : 12) * weedSeason[i] * 1.5 + noise()))),
      healthScore: Math.max(0, Math.min(100, Math.round(baseHealth * healthSeason[i] + noise()))),
    };
  });
}

const GRAPHS = [
  { key: 'cropHealth', title: 'Crop Health Over Time', icon: Sprout, color: '#3da970', type: 'area' },
  { key: 'diseaseRisk', title: 'Disease Risk Throughout the Year', icon: Bug, color: '#d64545', type: 'area' },
  { key: 'soilMoisture', title: 'Soil Moisture Over Time', icon: Droplets, color: '#4ea8d8', type: 'area' },
  { key: 'humidity', title: 'Humidity Over Time', icon: CloudRain, color: '#3b82f6', type: 'line' },
  { key: 'weedRisk', title: 'Weed Risk Over Time', icon: Leaf, color: '#d97742', type: 'area' },
  { key: 'healthScore', title: 'Field Health Score Over Time', icon: TrendingUp, color: '#3da970', type: 'line' },
];

export default function FieldTrends() {
  const [selectedFieldId, setSelectedFieldId] = useState(null);

  const { data: fields = [] } = useQuery({
    queryKey: ["fs-fields"],
    queryFn: () => base44.entities.Field.list("-updated_date", 100),
  });

  const activeFieldId = selectedFieldId || fields[0]?.id;

  const { data: detections = [] } = useQuery({
    queryKey: ["fs-detections-trends", activeFieldId],
    queryFn: () => base44.entities.Detection.filter({ field_id: activeFieldId }, "-created_date", 50),
    enabled: !!activeFieldId,
  });
  const { data: envDataList = [] } = useQuery({
    queryKey: ["fs-env-trends", activeFieldId],
    queryFn: () => base44.entities.EnvironmentalData.filter({ field_id: activeFieldId }, "-created_date", 1),
    enabled: !!activeFieldId,
  });

  const activeField = fields.find(f => f.id === activeFieldId);
  const trendData = useMemo(() => {
    if (!activeField) return [];
    return generateTrendData(activeField, detections, envDataList[0]);
  }, [activeField, detections, envDataList]);

  return (
    <div style={{ padding: '0 4px 32px 4px', maxWidth: 1240, margin: '0 auto' }}>
      <PageHeader title="Field Trends" subtitle="Historical trends and seasonal patterns for each field" icon={TrendingUp} />

      {/* Field selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {fields.map(field => {
          const isActive = field.id === activeFieldId;
          return (
            <button
              key={field.id}
              onClick={() => setSelectedFieldId(field.id)}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid',
                borderColor: isActive ? '#3da970' : '#252a33',
                background: isActive ? '#16261c' : '#161a21',
                color: isActive ? '#2d8a5a' : '#9aa3af',
                fontWeight: isActive ? 600 : 500,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Sprout style={{ width: 14, height: 14 }} />
              {field.name}
            </button>
          );
        })}
      </div>

      {/* Graphs */}
      {activeField ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="!grid-cols-1 md:!grid-cols-2">
          {GRAPHS.map(g => (
            <TrendGraph key={g.key} title={g.title} icon={g.icon} color={g.color} data={trendData} dataKey={g.key} type={g.type} />
          ))}
        </div>
      ) : (
        <div className="fs-card" style={{ padding: 40, textAlign: 'center' }}>
          <Sprout style={{ width: 32, height: 32, color: '#6b7480', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: '#9aa3af' }}>No fields available. Add a field to view trends.</p>
        </div>
      )}
    </div>
  );
}