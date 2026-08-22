import React, { useState } from "react";
import { Database, ChevronDown, ChevronRight, Loader2, CheckCircle, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  pending:     { icon: Loader2, color: '#6b7480', label: 'Pending', spin: true },
  running:     { icon: Loader2, color: '#4ec285', label: 'Running', spin: true },
  in_progress: { icon: Loader2, color: '#4ec285', label: 'In progress', spin: true },
  completed:   { icon: CheckCircle, color: '#3da970', label: 'Completed' },
  success:     { icon: CheckCircle, color: '#3da970', label: 'Done' },
  failed:      { icon: XCircle, color: '#d64545', label: 'Failed' },
  error:       { icon: XCircle, color: '#d64545', label: 'Error' },
};

function formatToolName(name) {
  if (!name) return 'Tool';
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[toolCall.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const projection = toolCall.display_projection;
  const hideDetails = projection?.hide_details && projection?.details_redacted;
  const isFailed = toolCall.status === 'failed' || toolCall.status === 'error';

  let parsedArgs = toolCall.arguments_string;
  try { parsedArgs = JSON.parse(toolCall.arguments_string); } catch { /* keep raw */ }

  let parsedResults = toolCall.results;
  try { if (typeof parsedResults === 'string') parsedResults = JSON.parse(parsedResults); } catch { /* keep raw */ }

  const label = hideDetails
    ? (isFailed ? (projection?.error_label || status.label)
       : ['pending', 'running', 'in_progress'].includes(toolCall.status) ? (projection?.active_label || status.label)
       : (projection?.label || status.label))
    : status.label;

  return (
    <div style={{ marginTop: 8, border: '1px solid #252a33', borderRadius: 10, overflow: 'hidden', background: '#1c2129' }}>
      <button
        onClick={() => !hideDetails && setExpanded(!expanded)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'transparent', border: 'none', cursor: hideDetails ? 'default' : 'pointer', fontSize: 12 }}
      >
        {!hideDetails && (expanded
          ? <ChevronDown style={{ width: 14, height: 14, color: '#6b7480' }} />
          : <ChevronRight style={{ width: 14, height: 14, color: '#6b7480' }} />)}
        <Database style={{ width: 14, height: 14, color: '#4ec285' }} />
        <span style={{ fontWeight: 600, color: '#e8eaed' }}>{formatToolName(toolCall.name)}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 'auto', color: status.color, fontWeight: 500 }}>
          <StatusIcon style={{ width: 12, height: 12 }} className={status.spin ? 'fs-spin' : ''} />
          {label}
        </span>
      </button>
      {expanded && !hideDetails && (
        <div style={{ padding: '0 12px 10px 12px', fontSize: 11, color: '#9aa3af' }}>
          {parsedArgs && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Parameters:</div>
              <pre style={{ background: '#1c2129', padding: 8, borderRadius: 6, overflowX: 'auto', margin: 0, fontSize: 11 }}>{JSON.stringify(parsedArgs, null, 2)}</pre>
            </div>
          )}
          {parsedResults != null && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Result:</div>
              <pre style={{ background: '#1c2129', padding: 8, borderRadius: 6, overflowX: 'auto', margin: 0, fontSize: 11, maxHeight: 200, overflowY: 'auto' }}>{JSON.stringify(parsedResults, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}