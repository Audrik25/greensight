import React from "react";
import { Calendar, TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, CheckCircle, Clock } from "lucide-react";
import { HEALTH_STATUS_CONFIG, TREND_CONFIG, formatDate, scoreColor } from "@/lib/fieldUtils";

const TREND_ICONS = {
  IMPROVING: TrendingUp,
  STABLE: Minus,
  SLIGHT_DECLINE: TrendingDown,
  DECLINING: TrendingDown,
};

export default function WeeklyReportCard({ report }) {
  if (!report) return null;

  const statusCfg = HEALTH_STATUS_CONFIG[report.predicted_health_status] || null;
  const trendCfg = TREND_CONFIG[report.trend] || null;
  const TrendIcon = TREND_ICONS[report.trend] || Minus;
  const futureRisks = report.future_risks || [];
  const advice = report.weekly_advice || [];
  const actions = report.recommended_actions || [];

  return (
    <div className="fs-card" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#1c2129', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar style={{ width: 18, height: 18, color: '#4ec285' }} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8eaed', margin: 0 }}>Weekly Report</h3>
          <span style={{ fontSize: 12, color: '#6b7480' }}>
            {report.period_start ? formatDate(report.period_start) : '—'} — {report.period_end ? formatDate(report.period_end) : '—'}
          </span>
        </div>
      </div>

      {/* Predicted health + trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }} className="!grid-cols-1">
        <div style={{ padding: 16, background: '#1c2129', borderRadius: 12, border: '1px solid #252a33' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7480', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Predicted Health</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: scoreColor(report.predicted_health_score ?? 100), fontFamily: "'Archivo', sans-serif" }}>
              {report.predicted_health_score?.toFixed(0) ?? '—'}
            </span>
            {statusCfg && (
              <span style={{ fontSize: 13, fontWeight: 600, color: statusCfg.color }}>{statusCfg.label}</span>
            )}
          </div>
        </div>
        <div style={{ padding: 16, background: '#1c2129', borderRadius: 12, border: '1px solid #252a33' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7480', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Trend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendIcon style={{ width: 22, height: 22, color: trendCfg?.color || '#9aa3af' }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: trendCfg?.color || '#9aa3af' }}>{trendCfg?.label || '—'}</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      {report.summary && (
        <div style={{ padding: 14, background: '#1c2129', borderRadius: 10, border: '1px solid #252a33', marginBottom: 20 }}>
          <p style={{ fontSize: 14, color: '#e8eaed', lineHeight: 1.6, margin: 0 }}>{report.summary}</p>
        </div>
      )}

      {/* Future risks */}
      {futureRisks.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle style={{ width: 13, height: 13, color: '#d97742' }} /> Future Risks
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {futureRisks.map((risk, i) => {
              const prob = risk.probability != null ? (risk.probability <= 1 ? risk.probability * 100 : risk.probability) : 0;
              const color = prob > 70 ? '#d64545' : prob > 50 ? '#d97742' : '#d4a84a';
              return (
                <div key={i} style={{ padding: 12, background: '#1c2129', borderRadius: 10, border: '1px solid #252a33' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaed', textTransform: 'capitalize' }}>
                      {risk.risk?.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'Archivo', sans-serif" }}>{prob.toFixed(0)}%</span>
                  </div>
                  {risk.reason && <p style={{ fontSize: 12, color: '#6b7480', margin: '0 0 8px' }}>{risk.reason}</p>}
                  <div style={{ height: 4, background: '#252a33', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${prob}%`, background: color, borderRadius: 999, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly advice */}
      {advice.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lightbulb style={{ width: 13, height: 13, color: '#d4a84a' }} /> Weekly Advice
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {advice.map((tip, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0' }}>
                <CheckCircle style={{ width: 15, height: 15, color: '#3da970', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#e8eaed', lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended actions schedule */}
      {actions.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock style={{ width: 13, height: 13, color: '#4ea8d8' }} /> Recommended Action Schedule
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {actions.map((action, i) => (
              <div key={i} style={{ flexShrink: 0, width: 180, padding: 14, background: '#1c2129', borderRadius: 10, border: '1px solid #252a33' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4ec285', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{action.day}</div>
                <div style={{ fontSize: 13, color: '#e8eaed', lineHeight: 1.4 }}>{action.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}