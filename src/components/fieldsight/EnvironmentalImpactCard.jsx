import React from "react";
import { Leaf, Droplets, Recycle, Gauge, Sparkles } from "lucide-react";

const WATER_STATUS_CONFIG = {
  REDUCE_IRRIGATION: { label: 'Reduce Irrigation', color: '#d97742', bg: '#2a1d15' },
  MAINTAIN:          { label: 'Maintain',          color: '#3da970', bg: '#16261c' },
  INCREASE:           { label: 'Increase Irrigation', color: '#4ea8d8', bg: '#16261c' },
};

function StatCard({ icon: Icon, label, value, unit, color }) {
  return (
    <div style={{ padding: 16, background: '#1c2129', borderRadius: 12, border: '1px solid #252a33', textAlign: 'center' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
        <Icon style={{ width: 20, height: 20, color }} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#e8eaed', fontFamily: "'Archivo', sans-serif" }}>
        {value}<span style={{ fontSize: 14, color: '#6b7480' }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11, color: '#6b7480', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  );
}

export default function EnvironmentalImpactCard({ scan }) {
  if (!scan) return null;
  const hasData = scan.affected_area_percent != null || scan.treatment_area_reduction_percent != null ||
    scan.chemical_use_reduction_percent != null || scan.environmental_score != null || scan.water_use_status;
  if (!hasData) return null;

  const waterCfg = WATER_STATUS_CONFIG[scan.water_use_status] || null;

  return (
    <div className="fs-card" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#16261c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Recycle style={{ width: 18, height: 18, color: '#4ec285' }} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8eaed', margin: 0 }}>Environmental Impact</h3>
          <span style={{ fontSize: 12, color: '#6b7480' }}>Targeted treatment efficiency &amp; resource savings</span>
        </div>
        {scan.environmental_score != null && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#16261c', borderRadius: 999, border: '1px solid #3da97044' }}>
            <Sparkles style={{ width: 14, height: 14, color: '#4ec285' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#4ec285', fontFamily: "'Archivo', sans-serif" }}>{scan.environmental_score.toFixed(0)}</span>
            <span style={{ fontSize: 11, color: '#6b7480' }}>eco score</span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        {scan.affected_area_percent != null && (
          <StatCard icon={Leaf} label="Affected Area" value={scan.affected_area_percent.toFixed(1)} unit="%" color="#d97742" />
        )}
        {scan.treatment_area_reduction_percent != null && (
          <StatCard icon={Recycle} label="Treatment Reduction" value={scan.treatment_area_reduction_percent.toFixed(1)} unit="%" color="#4ec285" />
        )}
        {scan.chemical_use_reduction_percent != null && (
          <StatCard icon={Recycle} label="Chemical Reduction" value={scan.chemical_use_reduction_percent.toFixed(1)} unit="%" color="#4ec285" />
        )}
        {waterCfg && (
          <div style={{ padding: 16, background: '#1c2129', borderRadius: 12, border: '1px solid #252a33', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${waterCfg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <Droplets style={{ width: 20, height: 20, color: waterCfg.color }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: waterCfg.color, fontFamily: "'Archivo', sans-serif" }}>{waterCfg.label}</div>
            <div style={{ fontSize: 11, color: '#6b7480', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Water Use</div>
          </div>
        )}
      </div>

      {scan.environmental_explanation && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 14, background: '#16261c', borderRadius: 10, border: '1px solid #3da97033' }}>
          <Gauge style={{ width: 16, height: 16, color: '#4ec285', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: '#e8eaed', lineHeight: 1.6, margin: 0 }}>{scan.environmental_explanation}</p>
        </div>
      )}
    </div>
  );
}