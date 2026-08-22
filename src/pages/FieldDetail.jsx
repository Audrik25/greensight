import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ScanLine, MapPin, Calendar, Sprout, Maximize, ChevronRight, Camera, Activity, ClipboardList, History, Cloud } from "lucide-react";
import { base44 } from "@/api/base44Client";
import HealthGauge from "@/components/fieldsight/HealthGauge";
import WeatherCard from "@/components/fieldsight/WeatherCard";
import StatusBadge from "@/components/fieldsight/StatusBadge";
import DemoBadge from "@/components/fieldsight/DemoBadge";
import FieldStatsActions from "@/components/fieldsight/FieldStatsActions";
import GrassAnalysisCard from "@/components/fieldsight/GrassAnalysisCard";
import EditableFieldName from "@/components/fieldsight/EditableFieldName";
import WeeklyReportCard from "@/components/fieldsight/WeeklyReportCard";
import NightMonitoringCard from "@/components/fieldsight/NightMonitoringCard";
import LiveFieldCamera from "@/components/fieldsight/LiveFieldCamera";
import SectionHeader from "@/components/fieldsight/SectionHeader";
import { SEVERITY_CONFIG, scoreColor, timeAgo, formatDate, DETECTION_TYPE_CONFIG } from "@/lib/fieldUtils";

export default function FieldDetail() {
  const { id } = useParams();

  const { data: field, isLoading } = useQuery({
    queryKey: ["fs-field", id],
    queryFn: () => base44.entities.Field.get(id),
    enabled: !!id
  });
  const { data: scans = [] } = useQuery({
    queryKey: ["fs-scans-field", id],
    queryFn: () => base44.entities.Scan.filter({ field_id: id }, "-created_date", 20),
    enabled: !!id
  });
  const { data: detections = [] } = useQuery({
    queryKey: ["fs-detections-field", id],
    queryFn: () => base44.entities.Detection.filter({ field_id: id }, "-created_date", 50),
    enabled: !!id
  });
  const { data: envData = [] } = useQuery({
    queryKey: ["fs-env-field", id],
    queryFn: () => base44.entities.EnvironmentalData.filter({ field_id: id }, "-created_date", 1),
    enabled: !!id
  });
  const { data: recommendations = [] } = useQuery({
    queryKey: ["fs-recs-field", id],
    queryFn: () => base44.entities.Recommendation.filter({ field_id: id }, "-created_date", 20),
    enabled: !!id
  });
  const { data: weeklyReports = [] } = useQuery({
    queryKey: ["fs-weekly-field", id],
    queryFn: () => base44.entities.WeeklyReport.filter({ field_id: id }, "-created_date", 1),
    enabled: !!id
  });
  const { data: nightDetections = [] } = useQuery({
    queryKey: ["fs-night-field", id],
    queryFn: () => base44.entities.NightDetection.filter({ field_id: id }, "-created_date", 20),
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div className="fs-spin" style={{ width: 32, height: 32, border: '3px solid #252a33', borderTopColor: '#3da970', borderRadius: '50%', margin: '0 auto' }} />
      </div>);

  }

  if (!field) {
    return (
      <div className="fs-card" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#9aa3af', marginBottom: 16 }}>Field not found.</p>
        <Link to="/fields" className="fs-btn-ghost" style={{ textDecoration: 'none' }}>Back to Fields</Link>
      </div>);

  }

  const status = field.status || 'healthy';
  const healthScore = field.health_score ?? 100;

  return (
    <div style={{ padding: '0 4px 32px 4px', maxWidth: 1240, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <EditableFieldName field={field} />
            <StatusBadge status={status} />
            {field.is_demo && <DemoBadge />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#9aa3af' }}>
              <Sprout style={{ width: 14, height: 14, color: '#4ec285' }} />{field.crop}{field.grass_type ? ` · ${field.grass_type}` : ''}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#9aa3af' }}>
              <Maximize style={{ width: 14, height: 14, color: '#6b7480' }} />{field.area_acres ?? field.size} {field.size_unit || 'acres'}
            </span>
            {field.elevation_m != null &&
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#9aa3af' }}>
              <MapPin style={{ width: 14, height: 14, color: '#6b7480' }} />{field.elevation_m.toFixed(0)}m elev
            </span>
            }
            {field.latitude && field.longitude &&
            <a href={`https://www.google.com/maps?q=${field.latitude},${field.longitude}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#3da970', textDecoration: 'none' }}>
                <MapPin style={{ width: 14, height: 14 }} />{field.latitude?.toFixed(4)}, {field.longitude?.toFixed(4)}
              </a>
            }
            {field.planting_date &&
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#9aa3af' }}>
                <Calendar style={{ width: 14, height: 14, color: '#6b7480' }} />Planted {formatDate(field.planting_date)}
              </span>
            }
          </div>
        </div>

      </div>

      {/* ── Section: Overview ── */}
      <SectionHeader icon={Activity} title="Overview" subtitle="Health score at a glance" />
      <div style={{ marginBottom: 28 }}>
        <div className="fs-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <HealthGauge score={healthScore} size={140} strokeWidth={12} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Field Health</div>
            <div style={{ fontSize: 13, color: '#6b7480', marginTop: 4 }}>{detections.length} active detection{detections.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {/* ── Section: Analysis ── */}
      <SectionHeader icon={ClipboardList} title="Analysis & Recommendations" subtitle="Detected issues and targeted actions for this field" />
      <div style={{ marginBottom: 28 }}>
        <FieldStatsActions field={field} detections={detections} scans={scans} recommendations={recommendations} />
      </div>
      <div style={{ marginBottom: 28 }}>
        <GrassAnalysisCard scan={scans[0]} detections={detections} />
      </div>

      {/* ── Section: Live Monitoring ── */}
      <SectionHeader icon={Camera} title="Live Monitoring" subtitle="Camera feed, weather, and night activity" />
      <div style={{ marginBottom: 28 }}>
        <LiveFieldCamera fields={[field]} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }} className="!grid-cols-1">
        <WeatherCard data={envData[0]} />
        <NightMonitoringCard detections={nightDetections} />
      </div>

      {/* ── Section: History & Reports ── */}
      <SectionHeader icon={History} title="History & Reports" subtitle="Past scans and weekly forecasts" />
      <div style={{ marginBottom: 24 }}>
        {weeklyReports[0] && <div style={{ marginBottom: 20 }}><WeeklyReportCard report={weeklyReports[0]} /></div>}
        <div className="fs-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e8eaed', marginBottom: 14 }}>Previous Scans ({scans.length})</h3>
          {scans.length === 0 ?
          <div style={{ textAlign: 'center', padding: 30 }}>
              <ScanLine style={{ width: 28, height: 28, color: '#6b7480', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: '#6b7480', margin: 0 }}>No scans yet. Capture a photo to start analyzing this field.</p>
            </div> :

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scans.map((scan) =>
            <Link key={scan.id} to={`/scans/${scan.id}`} style={{ textDecoration: 'none' }}>
                   <div className="fs-card fs-card-hover" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                     <div style={{
                   width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                   background: `${scoreColor(scan.health_score ?? 100)}15`,
                   display: 'flex', alignItems: 'center', justifyContent: 'center'
                 }}>
                       <span style={{ fontFamily: "'Archivo', sans-serif", fontSize: 17, fontWeight: 700, color: scoreColor(scan.health_score ?? 100) }}>
                         {scan.health_score ?? '—'}
                       </span>
                     </div>
                     <div style={{ flex: 1, minWidth: 0 }}>
                       <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eaed' }}>{scan.crop} scan</div>
                       <div style={{ fontSize: 11, color: '#6b7480' }}>{timeAgo(scan.created_date)} · {scan.status}</div>
                     </div>
                     <ChevronRight style={{ width: 16, height: 16, color: '#6b7480' }} />
                   </div>
                 </Link>
             )}
            </div>
          }
        </div>
      </div>






      
    </div>);

}