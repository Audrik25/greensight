import React from "react";

export default function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {Icon && (
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #16261c, #1c2129)',
            border: '1px solid #2d8a5a44',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon style={{ width: 22, height: 22, color: '#4ec285' }} />
          </div>
        )}
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e8eaed', margin: 0, lineHeight: 1.15 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 13, color: '#9aa3af', margin: '4px 0 0' }}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}