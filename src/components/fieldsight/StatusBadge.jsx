import React from "react";
import { STATUS_CONFIG } from "@/lib/fieldUtils";

export default function StatusBadge({ status, size = "md" }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.healthy;
  const pad = size === "sm" ? '3px 8px' : '5px 12px';
  const fontSize = size === "sm" ? 10 : 11;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: config.bg,
        color: config.color,
        padding: pad,
        borderRadius: 999,
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.02em',
        border: `1px solid ${config.color}22`,
      }}
    >
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: config.dot, flexShrink: 0,
      }} />
      {config.label}
    </span>
  );
}