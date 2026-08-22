import React from "react";

export default function SectionHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {Icon && (
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#1c2129', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: 15, height: 15, color: '#4ec285' }} />
          </div>
        )}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e8eaed', margin: 0, lineHeight: 1.2 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 12, color: '#6b7480', margin: '2px 0 0' }}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}