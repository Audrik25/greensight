import React from "react";
import { ShieldAlert, AlertTriangle, CheckCircle } from "lucide-react";
import { RISK_LEVEL_CONFIG } from "@/lib/fieldUtils";

export default function RiskAssessmentCard({ scan }) {
  if (!scan) return null;
  const risks = scan.risks || [];
  const riskFactors = scan.risk_factors || [];
  const overallRisk = scan.overall_risk;

  if (!overallRisk && risks.length === 0 && riskFactors.length === 0) return null;

  const overallCfg = RISK_LEVEL_CONFIG[overallRisk] || null;

  const formatRiskType = (type) => {
    if (!type) return 'Unknown';
    return type.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="fs-card" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: overallCfg ? overallCfg.bg : '#1c2129', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldAlert style={{ width: 18, height: 18, color: overallCfg ? overallCfg.color : '#9aa3af' }} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e8eaed', margin: 0 }}>Risk Assessment</h3>
          <span style={{ fontSize: 12, color: '#6b7480' }}>Identified risks &amp; contributing factors</span>
        </div>
        {overallCfg && (
          <div style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 999, background: overallCfg.bg, border: `1px solid ${overallCfg.color}44` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: overallCfg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{overallCfg.label} Risk</span>
          </div>
        )}
      </div>

      {/* Individual risks */}
      {risks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: riskFactors.length > 0 ? 20 : 0 }}>
          {risks.map((risk, i) => {
            const cfg = RISK_LEVEL_CONFIG[risk.level] || RISK_LEVEL_CONFIG.LOW;
            const conf = risk.confidence != null ? (risk.confidence <= 1 ? risk.confidence * 100 : risk.confidence) : 0;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: '#1c2129', borderRadius: 10, border: '1px solid #252a33' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle style={{ width: 18, height: 18, color: cfg.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaed' }}>{formatRiskType(risk.type)}</div>
                  <div style={{ marginTop: 6, height: 5, background: '#252a33', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${conf}%`, background: cfg.color, borderRadius: 999, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase' }}>{cfg.label}</span>
                  <div style={{ fontSize: 11, color: '#6b7480', marginTop: 4 }}>{conf.toFixed(0)}% confidence</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Risk factors */}
      {riskFactors.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Contributing Factors</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {riskFactors.map((factor, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#d4a84a', background: '#2a2417', padding: '6px 12px', borderRadius: 999, border: '1px solid #d4a84a22' }}>
                <AlertTriangle style={{ width: 12, height: 12 }} />{factor}
              </span>
            ))}
          </div>
        </div>
      )}

      {risks.length === 0 && riskFactors.length === 0 && overallRisk === 'LOW' && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <CheckCircle style={{ width: 32, height: 32, color: '#3da970', margin: '0 auto 10px' }} />
          <p style={{ fontSize: 14, color: '#9aa3af', margin: 0 }}>No significant risks identified.</p>
        </div>
      )}
    </div>
  );
}