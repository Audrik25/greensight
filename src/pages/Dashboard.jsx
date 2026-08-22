import React, { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Maximize, Plus, Activity, AlertOctagon, CloudSun, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import HealthGauge from "@/components/fieldsight/HealthGauge";
import EnvironmentalConditions from "@/components/fieldsight/EnvironmentalConditions";
import PriorityAlerts from "@/components/fieldsight/PriorityAlerts";
import TodaysAction from "@/components/fieldsight/TodaysAction";
import RiskCard from "@/components/fieldsight/RiskCard";
import DemoBadge from "@/components/fieldsight/DemoBadge";
import PageHeader from "@/components/shared/PageHeader";
import SectionHeader from "@/components/fieldsight/SectionHeader";
import NeedsAttention from "@/components/fieldsight/NeedsAttention";

export default function Dashboard() {
  const { data: fields = [] } = useQuery({
    queryKey: ["fs-fields"],
    queryFn: () => base44.entities.Field.list("-updated_date", 100)
  });
  const { data: scans = [] } = useQuery({
    queryKey: ["fs-scans"],
    queryFn: () => base44.entities.Scan.list("-created_date", 20)
  });
  const { data: detections = [] } = useQuery({
    queryKey: ["fs-detections"],
    queryFn: () => base44.entities.Detection.list("-created_date", 50)
  });
  const { data: recommendations = [] } = useQuery({
    queryKey: ["fs-recommendations"],
    queryFn: () => base44.entities.Recommendation.list("-created_date", 50)
  });
  const { data: envData = [] } = useQuery({
    queryKey: ["fs-env"],
    queryFn: () => base44.entities.EnvironmentalData.list("-created_date", 10)
  });
  const { data: snapshots = [] } = useQuery({
    queryKey: ["fs-snapshots"],
    queryFn: () => base44.entities.HealthSnapshot.list("-created_date", 5)
  });
  const { data: liveWeather } = useQuery({
    queryKey: ["fs-live-weather"],
    queryFn: async () => {
      const res = await base44.functions.invoke("fastapiProxy", { action: "latest-status" });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false
  });

  const farmHealth = useMemo(() => {
    if (!fields.length) return 100;
    return Math.round(fields.reduce((s, f) => s + (f.health_score ?? 100), 0) / fields.length);
  }, [fields]);

  const queryClient = useQueryClient();
  const [healthChange, setHealthChange] = useState(null);
  const snapshotCreated = useRef(false);

  useEffect(() => {
    if (!fields.length) return;
    const latest = snapshots[0];
    if (latest && latest.farm_health_score > 0) {
      const change = (farmHealth - latest.farm_health_score) / latest.farm_health_score * 100;
      setHealthChange(change);
    }
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const latestDate = latest ? new Date(latest.created_date).getTime() : 0;
    if (!snapshotCreated.current && latestDate < oneHourAgo) {
      snapshotCreated.current = true;
      base44.entities.HealthSnapshot.create({
        farm_health_score: farmHealth,
        field_count: fields.length,
        alert_count: detections.length
      }).then(() => queryClient.invalidateQueries({ queryKey: ["fs-snapshots"] }));
    }
  }, [fields, snapshots, farmHealth, detections, queryClient]);

  const completedScans = useMemo(() => scans.filter((s) => s.status === 'completed'), [scans]);
  const issuesCount = detections.length;
  const hasDemoData = fields.some((f) => f.is_demo) || envData.some((e) => e.is_demo);
  const latestEnv = envData[0];

  // Prefer live weather from the FastAPI backend; fall back to stored environmental data
  const liveEnv = liveWeather?.weather?.current ?
  {
    temperature: liveWeather.weather.current.temperature_c,
    humidity: liveWeather.weather.current.humidity_percent,
    wind_speed: liveWeather.weather.current.wind_speed_kmh,
    wind_direction: liveWeather.weather.current.wind_direction,
    precipitation: liveWeather.weather.current.precipitation_mm ?? 0,
    conditions: liveWeather.weather.current.conditions || 'Live',
    is_demo: false
  } :
  null;
  const envForDisplay = liveEnv || latestEnv;

  const riskData = useMemo(() => {
    const getLevel = (types) => {
      const filtered = detections.filter((d) => types.includes(d.type));
      if (!filtered.length) return { level: 'none', count: 0 };
      if (filtered.some((d) => d.severity === 'critical')) return { level: 'critical', count: filtered.length };
      if (filtered.some((d) => d.severity === 'high')) return { level: 'high', count: filtered.length };
      if (filtered.some((d) => d.severity === 'medium')) return { level: 'medium', count: filtered.length };
      return { level: 'low', count: filtered.length };
    };
    return {
      disease: getLevel(['disease']),
      weed: getLevel(['weed']),
      soil: getLevel(['soil_condition', 'water_stress', 'nutrient_deficiency']),
      weather: { level: latestEnv ? 'low' : 'none', count: 0 }
    };
  }, [detections, latestEnv]);

  return (
    <div style={{ padding: '0 4px 32px 4px', maxWidth: 1240, margin: '0 auto' }}>
      <PageHeader
        title="Dashboard"
        subtitle="Precision farming overview · Detect problems early, treat only where necessary"
        icon={Activity}
        actions={<Link to="/fields" className="fs-btn-primary" style={{ textDecoration: 'none' }}><Plus style={{ width: 16, height: 16 }} /> Add Field</Link>}
      />

      {/* ── Farm Health Overview ── */}
      <div className="fs-card" style={{ padding: 28, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
        <HealthGauge score={farmHealth} size={130} strokeWidth={11} showLabel={false} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Farm Health</span>
            {hasDemoData && <DemoBadge />}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: 36, fontWeight: 700, color: '#e8eaed', lineHeight: 1 }}>
              {farmHealth}<span style={{ fontSize: 18, color: '#6b7480', fontWeight: 500 }}> /100</span>
            </span>
            {healthChange !== null &&
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 13, fontWeight: 600,
              color: healthChange >= 0 ? '#3da970' : '#d64545',
              background: healthChange >= 0 ? '#16261c' : '#2a1717',
              padding: '4px 10px', borderRadius: 999
            }}>
                {healthChange >= 0 ? <TrendingUp style={{ width: 14, height: 14 }} /> : <TrendingDown style={{ width: 14, height: 14 }} />}
                {healthChange >= 0 ? '+' : ''}{healthChange.toFixed(1)}% since last check
              </span>
            }
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#16261c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Maximize style={{ width: 17, height: 17, color: '#3da970' }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#6b7480', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Fields</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e8eaed' }}>{fields.length}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: issuesCount > 0 ? '#2a1d15' : '#16261c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle style={{ width: 17, height: 17, color: issuesCount > 0 ? '#d97742' : '#3da970' }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#6b7480', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active Alerts</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: issuesCount > 0 ? '#d97742' : '#e8eaed' }}>{issuesCount}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#1c2129', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle style={{ width: 17, height: 17, color: '#7a8290' }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#6b7480', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Scans Done</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#e8eaed' }}>{completedScans.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Needs Attention ── */}
      <div style={{ marginBottom: 24 }}>
        <NeedsAttention fields={fields} />
      </div>

      {/* ── Alerts & Actions ── */}
      <SectionHeader icon={AlertOctagon} title="Alerts & Actions" subtitle="Priority issues and what to do today" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }} className="!grid-cols-1 md:!grid-cols-2">
        <PriorityAlerts detections={detections} fields={fields} />
        <TodaysAction recommendations={recommendations} fields={fields} />
      </div>

      {/* ── Environmental Conditions ── */}
      <SectionHeader icon={CloudSun} title="Environmental Conditions" subtitle="Current weather across your farm" />
      <div style={{ marginBottom: 24 }}>
        <EnvironmentalConditions data={envForDisplay} />
      </div>

      {/* ── Risk Overview ── */}
      <SectionHeader icon={ShieldAlert} title="Risk Overview" subtitle="Active risks by category" />
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="!grid-cols-2 md:!grid-cols-2 lg:!grid-cols-4">
          <RiskCard type="disease" level={riskData.disease.level} count={riskData.disease.count} />
          <RiskCard type="weed" level={riskData.weed.level} count={riskData.weed.count} />
          <RiskCard type="soil" level={riskData.soil.level} count={riskData.soil.count} />
          <RiskCard type="weather" level={riskData.weather.level} count={riskData.weather.count} description={latestEnv ? `${latestEnv.temperature?.toFixed(0)}°C, ${latestEnv.conditions || 'Clear'}` : 'No data'} />
        </div>
      </div>



    </div>);

}