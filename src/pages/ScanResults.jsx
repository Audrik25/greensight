import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Leaf, Sprout, Layers, Bug, Droplets, Lightbulb, ScanLine, AlertTriangle, CheckCircle, MapPin, ChevronLeft, Camera, Moon, Sun } from "lucide-react";
import { base44 } from "@/api/base44Client";
import HealthGauge from "@/components/fieldsight/HealthGauge";
import DemoBadge from "@/components/fieldsight/DemoBadge";
import GrassAnalysisCard from "@/components/fieldsight/GrassAnalysisCard";
import SoilAnalysisCard from "@/components/fieldsight/SoilAnalysisCard";
import EnhancedWeatherCard from "@/components/fieldsight/EnhancedWeatherCard";
import RiskAssessmentCard from "@/components/fieldsight/RiskAssessmentCard";
import HeatMapVisualization from "@/components/fieldsight/HeatMapVisualization";
import NightMonitoringCard from "@/components/fieldsight/NightMonitoringCard";
import WeeklyReportCard from "@/components/fieldsight/WeeklyReportCard";
import EnvironmentalImpactCard from "@/components/fieldsight/EnvironmentalImpactCard";
import { SEVERITY_CONFIG, PRIORITY_CONFIG, DETECTION_TYPE_CONFIG, HEALTH_STATUS_CONFIG, RISK_LEVEL_CONFIG, scoreColor, formatDateTime } from "@/lib/fieldUtils";

const TYPE_ICONS = {
  disease: Leaf, weed: Sprout, soil_condition: Layers,
  pest: Bug, water_stress: Droplets, nutrient_deficiency: Sprout,
};

function formatAction(type) {
  return (type || '').split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

export default function ScanResults() {
  const { id } = useParams();

  const { data: scan, isLoading } = useQuery({
    queryKey: ["fs-scan", id],
    queryFn: () => base44.entities.Scan.get(id),
    enabled: !!id,
  });
  const { data: detections = [] } = useQuery({
    queryKey: ["fs-detections-scan", id],
    queryFn: () => base44.entities.Detection.filter({ scan_id: id }, "-created_date", 50),
    enabled: !!id,
  });
  const { data: recommendations = [] } = useQuery({
    queryKey: ["fs-recs-scan", id],
    queryFn: () => base44.entities.Recommendation.filter({ scan_id: id }, "-created_date", 50),
    enabled: !!id,
  });
  const { data: heatMapRegions = [] } = useQuery({
    queryKey: ["fs-heatmap-scan", id],
    queryFn: () => base44.entities.HeatMapRegion.filter({ scan_id: id }, "-created_date", 50),
    enabled: !!id,
  });
  const { data: nightDetections = [] } = useQuery({
    queryKey: ["fs-night-scan", id],
    queryFn: () => base44.entities.NightDetection.filter({ scan_id: id }, "-created_date", 50),
    enabled: !!id,
  });
  const { data: weeklyReports = [] } = useQuery({
    queryKey: ["fs-weekly-scan", id],
    queryFn: () => base44.entities.WeeklyReport.filter({ scan_id: id }, "-created_date", 1),
    enabled: !!id,
  });
  const { data: envData = [] } = useQuery({
    queryKey: ["fs-env-scan", scan?.field_id],
    queryFn: () => base44.entities.EnvironmentalData.filter({ field_id: scan.field_id }, "-created_date", 1),
    enabled: !!scan?.field_id,
  });

  const recMap = useMemo(() => {
    const m = {};
    recommendations.forEach(r => { if (r.detection_id) m[r.detection_id] = r; });
    return m;
  }, [recommendations]);

  const urgency = useMemo(() => {
    if (recommendations.length === 0) return { label: 'No Issues Detected', color: '#3da970', bg: '#16261c', icon: 'check' };
    if (recommendations.some(r => r.priority === 'urgent')) return { label: 'Urgent Action Required', color: '#d64545', bg: '#2a1717', icon: 'alert' };
    if (recommendations.some(r => r.priority === 'high')) return { label: 'Action Recommended Soon', color: '#d97742', bg: '#2a1d15', icon: 'alert' };
    if (recommendations.some(r => r.priority === 'medium')) return { label: 'Monitor and Plan Treatment', color: '#d4a84a', bg: '#2a2417', icon: 'alert' };
    return { label: 'No Immediate Action Needed', color: '#3da970', bg: '#16261c', icon: 'check' };
  }, [recommendations]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div className="fs-spin" style={{ width: 32, height: 32, border: '3px solid #252a33', borderTopColor: '#3da970', borderRadius: '50%', margin: '0 auto' }} />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="fs-card" style={{ padding: 40, textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
        <p style={{ fontSize: 14, color: '#9aa3af', marginBottom: 16 }}>Scan not found.</p>
        <Link to="/" className="fs-btn-ghost" style={{ textDecoration: 'none' }}>Back to Dashboard</Link>
      </div>
    );
  }

  if (scan.status === 'analyzing') {
    return (
      <div style={{ padding: '0 4px 32px 4px', maxWidth: 600, margin: '0 auto' }}>
        <div className="fs-card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid #252a33', borderTopColor: '#3da970', animation: 'fs-spin 0.8s linear infinite' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e8eaed', marginBottom: 8 }}>Analysis in Progress</h2>
          <p style={{ fontSize: 14, color: '#9aa3af' }}>AI is analyzing the field imagery...</p>
        </div>
      </div>
    );
  }

  const healthScore = scan.health_score ?? 100;
  const UrgencyIcon = urgency.icon === 'check' ? CheckCircle : AlertTriangle;
  const statusCfg = HEALTH_STATUS_CONFIG[scan.health_status] || null;
  const overallRiskCfg = RISK_LEVEL_CONFIG[scan.overall_risk] || null;
  const weeklyReport = weeklyReports[0] || null;

  return (
    <div style={{ padding: '0 4px 32px 4px', maxWidth: 940, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Link to={scan.field_id ? `/fields/${scan.field_id}` : '/'} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 500, color: '#9aa3af', textDecoration: 'none' }}>
          <ChevronLeft style={{ width: 16, height: 16 }} /> Back to Field
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e8eaed', margin: 0 }}>Scan Results</h1>
            {scan.is_demo && <DemoBadge />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#9aa3af' }}>
              <MapPin style={{ width: 14, height: 14, color: '#4ec285' }} />{scan.field_name || 'Field'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#9aa3af' }}>
              <Sprout style={{ width: 14, height: 14, color: '#4ec285' }} />{scan.crop}
            </span>
            <span style={{ fontSize: 13, color: '#6b7480' }}>{formatDateTime(scan.capture_timestamp || scan.created_date)}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7480', background: '#1c2129', padding: '3px 8px', borderRadius: 6 }}>
              <Camera style={{ width: 11, height: 11 }} />{scan.source === 'raspberry_pi' ? 'Raspberry Pi' : 'Manual Upload'}
            </span>
            {scan.capture_mode && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: scan.capture_mode === 'night' ? '#9d7ad6' : '#d4a84a', background: scan.capture_mode === 'night' ? '#1c1729' : '#2a2417', padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize' }}>
                {scan.capture_mode === 'night' ? <Moon style={{ width: 11, height: 11 }} /> : <Sun style={{ width: 11, height: 11 }} />}
                {scan.capture_mode}
              </span>
            )}
          </div>
        </div>
        <Link to="/scan" className="fs-btn-primary" style={{ textDecoration: 'none' }}>
          <ScanLine style={{ width: 16, height: 16 }} /> Scan Another Field
        </Link>
      </div>

      {/* Urgency banner */}
      <div style={{
        background: urgency.bg, border: `1px solid ${urgency.color}33`,
        borderRadius: 12, padding: '14px 18px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${urgency.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <UrgencyIcon style={{ width: 20, height: 20, color: urgency.color }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: urgency.color }}>{urgency.label}</div>
          <div style={{ fontSize: 12, color: '#9aa3af' }}>
            {detections.length} issue{detections.length !== 1 ? 's' : ''} detected
            {scan.affected_area_percent != null ? ` across ${scan.affected_area_percent.toFixed(1)}% of the field` : ''}
            {overallRiskCfg && ` · ${overallRiskCfg.label} overall risk`}
          </div>
        </div>
      </div>

      {/* Health + Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, marginBottom: 24 }} className="!grid-cols-1">
        <div className="fs-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <HealthGauge score={healthScore} size={130} strokeWidth={11} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Health</div>
            {statusCfg && (
              <div style={{ fontSize: 13, fontWeight: 600, color: statusCfg.color, marginTop: 4 }}>{statusCfg.label}</div>
            )}
          </div>
        </div>
        <div className="fs-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>AI Summary</div>
          <p style={{ fontSize: 15, color: '#e8eaed', lineHeight: 1.6, margin: 0 }}>{scan.summary || 'Analysis complete. No summary available.'}</p>
        </div>
      </div>

      {/* Grass Analysis */}
      <GrassAnalysisCard scan={scan} detections={detections} />

      {/* Imagery */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }} className="!grid-cols-1">
        {scan.crop_image && (
          <div className="fs-card" style={{ padding: 16, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Leaf style={{ width: 14, height: 14, color: '#4ec285' }} /> Crop Image
            </div>
            <img src={scan.crop_image} alt="Crop" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8 }} />
          </div>
        )}
        {scan.soil_image && (
          <div className="fs-card" style={{ padding: 16, overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers style={{ width: 14, height: 14, color: '#d4a84a' }} /> Soil Image
            </div>
            <img src={scan.soil_image} alt="Soil" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8 }} />
          </div>
        )}
      </div>

      {/* Heat Map */}
      <HeatMapVisualization regions={heatMapRegions} scanId={scan.id} healthScore={healthScore} />

      {/* Soil Analysis */}
      <SoilAnalysisCard scan={scan} />

      {/* Weather & Environmental */}
      <EnhancedWeatherCard data={envData[0]} />

      {/* Risk Assessment */}
      <RiskAssessmentCard scan={scan} />

      {/* Environmental Impact */}
      <EnvironmentalImpactCard scan={scan} />

      {/* Night Monitoring */}
      <NightMonitoringCard detections={nightDetections} />

      {/* Detected Problems */}
      <div>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#e8eaed', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle style={{ width: 20, height: 20, color: '#d97742' }} />
          Detected Problems ({detections.length})
        </h3>

        {detections.length === 0 ? (
          <div className="fs-card" style={{ padding: 40, textAlign: 'center', marginBottom: 24 }}>
            <CheckCircle style={{ width: 40, height: 40, color: '#3da970', margin: '0 auto 14px' }} />
            <h4 style={{ fontSize: 17, fontWeight: 600, color: '#e8eaed', marginBottom: 6 }}>No Issues Detected</h4>
            <p style={{ fontSize: 14, color: '#9aa3af', margin: 0 }}>This field appears healthy. Continue regular monitoring.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {detections.map(det => {
              const Icon = TYPE_ICONS[det.type] || AlertTriangle;
              const sevCfg = SEVERITY_CONFIG[det.severity] || SEVERITY_CONFIG.low;
              const rec = recMap[det.id];
              const priCfg = rec ? PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.medium : null;
              const typeColor = DETECTION_TYPE_CONFIG[det.type]?.color || '#9aa3af';

              return (
                <div key={det.id} className="fs-card" style={{ padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 11, background: `${typeColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: 22, height: 22, color: typeColor }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#e8eaed' }}>{det.label}</div>
                        <div style={{ fontSize: 12, color: '#6b7480', marginTop: 2 }}>
                          {DETECTION_TYPE_CONFIG[det.type]?.label || det.type} · {det.zone || 'Unknown zone'}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: sevCfg.color, background: sevCfg.bg, padding: '5px 12px', borderRadius: 999, textTransform: 'capitalize', flexShrink: 0 }}>
                      {det.severity} severity
                    </span>
                  </div>

                  {det.description && (
                    <p style={{ fontSize: 14, color: '#9aa3af', lineHeight: 1.6, margin: '0 0 16px' }}>{det.description}</p>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }} className="!grid-cols-1">
                    <MetricBar label="Confidence" value={det.confidence} color="#3da970" suffix="%" />
                    <MetricBar label="Affected Area" value={det.affected_area} color={sevCfg.color} suffix="%" />
                  </div>

                  {rec && (
                    <div style={{ background: '#16261c', border: '1px solid #3da97033', borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Lightbulb style={{ width: 15, height: 15, color: '#4ec285' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#4ec285', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recommendation</span>
                      </div>
                      <p style={{ fontSize: 14, color: '#e8eaed', lineHeight: 1.6, margin: '0 0 12px' }}>{rec.recommendation}</p>
                      {rec.reason && (
                        <p style={{ fontSize: 12, color: '#6b7480', lineHeight: 1.5, margin: '0 0 12px' }}>Reason: {rec.reason}</p>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {priCfg && (
                          <span style={{ fontSize: 11, fontWeight: 600, color: priCfg.color, background: priCfg.bg, padding: '4px 10px', borderRadius: 999 }}>
                            {priCfg.label}
                          </span>
                        )}
                        {rec.action_label && (
                          <span style={{ fontSize: 11, fontWeight: 500, color: '#9aa3af', background: '#1c2129', padding: '4px 10px', borderRadius: 999 }}>
                            {formatAction(rec.action_label)}
                          </span>
                        )}
                        {rec.action_type && !rec.action_label && (
                          <span style={{ fontSize: 11, fontWeight: 500, color: '#9aa3af', background: '#1c2129', padding: '4px 10px', borderRadius: 999 }}>
                            {formatAction(rec.action_type)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekly Report */}
      <WeeklyReportCard report={weeklyReport} />

      {/* Core message */}
      <div style={{
        marginTop: 32, padding: 28, borderRadius: 16,
        background: 'linear-gradient(135deg, #0a0d12 0%, #2d8a5a 100%)',
        textAlign: 'center',
      }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#e8eaed', marginBottom: 8 }}>
          Detect problems early. Treat only where necessary.
        </h3>
        <p style={{ fontSize: 14, color: '#7a8290', margin: 0, maxWidth: 500, margin: '0 auto' }}>
          FieldSight AI identifies exactly which areas need attention, so you can target treatments and save resources.
        </p>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color, suffix }) {
  const v = value ?? 0;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#e8eaed', fontFamily: "'Archivo', sans-serif" }}>{v.toFixed(0)}{suffix}</span>
      </div>
      <div style={{ height: 6, background: '#252a33', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(v, 100)}%`, background: color, borderRadius: 999, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}