// Shared FieldSight AI utilities — status configs, zone generation, helpers

export const STATUS_CONFIG = {
  healthy:       { label: 'Healthy',        short: 'Healthy',  color: '#3da970', bg: '#16261c', dot: '#3da970' },
  monitor:       { label: 'Monitor',        short: 'Monitor',  color: '#d4a84a', bg: '#2a2417', dot: '#d4a84a' },
  action_needed: { label: 'Action Needed',  short: 'Action',   color: '#d97742', bg: '#2a1d15', dot: '#d97742' },
  critical:      { label: 'Critical',       short: 'Critical', color: '#d64545', bg: '#2a1717', dot: '#d64545' },
};

export const SEVERITY_CONFIG = {
  low:      { label: 'Low',      color: '#3da970', bg: '#16261c' },
  medium:   { label: 'Medium',   color: '#d4a84a', bg: '#2a2417' },
  high:     { label: 'High',     color: '#d97742', bg: '#2a1d15' },
  critical: { label: 'Critical', color: '#d64545', bg: '#2a1717' },
};

export const PRIORITY_CONFIG = {
  low:    { label: 'Low Priority',    short: 'Low',    color: '#3da970', bg: '#16261c' },
  medium: { label: 'Medium Priority', short: 'Medium', color: '#d4a84a', bg: '#2a2417' },
  high:   { label: 'High Priority',   short: 'High',   color: '#d97742', bg: '#2a1d15' },
  urgent: { label: 'Urgent',          short: 'Urgent', color: '#d64545', bg: '#2a1717' },
};

export const DETECTION_TYPE_CONFIG = {
  disease:              { label: 'Disease',              color: '#d64545' },
  weed:                 { label: 'Weed',                  color: '#d97742' },
  soil_condition:       { label: 'Soil Condition',        color: '#d4a84a' },
  pest:                 { label: 'Pest',                  color: '#9d7ad6' },
  water_stress:         { label: 'Water Stress',          color: '#4ea8d8' },
  nutrient_deficiency:  { label: 'Nutrient Deficiency',   color: '#d4a84a' },
};

export const RISK_LEVEL_CONFIG = {
  LOW:      { label: 'Low',       color: '#3da970', bg: '#16261c' },
  MODERATE: { label: 'Moderate',  color: '#d4a84a', bg: '#2a2417' },
  HIGH:     { label: 'High',      color: '#d97742', bg: '#2a1d15' },
  CRITICAL: { label: 'Critical',  color: '#d64545', bg: '#2a1717' },
};

export const HEALTH_STATUS_CONFIG = {
  EXCELLENT: { label: 'Excellent', color: '#3da970' },
  GOOD:      { label: 'Good',      color: '#4ec285' },
  MODERATE:  { label: 'Moderate',  color: '#d4a84a' },
  POOR:      { label: 'Poor',      color: '#d97742' },
  CRITICAL:  { label: 'Critical',  color: '#d64545' },
};

export const TREND_CONFIG = {
  IMPROVING:      { label: 'Improving',      color: '#3da970', arrow: '↗' },
  STABLE:         { label: 'Stable',         color: '#9aa3af', arrow: '→' },
  SLIGHT_DECLINE: { label: 'Slight Decline', color: '#d4a84a', arrow: '↘' },
  DECLINING:      { label: 'Declining',      color: '#d64545', arrow: '↓' },
};

export function scoreToStatus(score) {
  if (score >= 85) return 'healthy';
  if (score >= 60) return 'monitor';
  if (score >= 35) return 'action_needed';
  return 'critical';
}

export function scoreColor(score) {
  return STATUS_CONFIG[scoreToStatus(score)].color;
}

// Seeded pseudo-random for deterministic zone generation
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

// Generate a clustered zone grid for field visualization
export function generateZones(seed, healthScore, cols = 14, rows = 9) {
  const rand = seededRandom(String(seed));
  const zones = [];
  const issueRatio = Math.max(0, (100 - healthScore) / 100);
  const clusterCount = Math.ceil(issueRatio * 6);

  const clusters = [];
  for (let i = 0; i < clusterCount; i++) {
    clusters.push({
      cx: rand() * cols,
      cy: rand() * rows,
      radius: 1.5 + rand() * 2.5,
      severity: rand() < 0.25 ? 'critical' : rand() < 0.55 ? 'action_needed' : 'monitor',
    });
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let status = 'healthy';
      let maxInfluence = 0;
      for (const cluster of clusters) {
        const dist = Math.sqrt((c - cluster.cx) ** 2 + (r - cluster.cy) ** 2);
        const influence = Math.max(0, 1 - dist / cluster.radius);
        if (influence > maxInfluence) {
          maxInfluence = influence;
          if (influence > 0.65) status = cluster.severity;
          else if (influence > 0.35) status = 'monitor';
          else status = 'healthy';
        }
      }
      zones.push({ row: r, col: c, status });
    }
  }
  return { zones, cols, rows };
}

export const ZONE_COLORS = {
  healthy:       '#3da970',
  monitor:       '#d4a84a',
  action_needed: '#d97742',
  critical:      '#d64545',
};

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}