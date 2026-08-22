import React, { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

// Entities that store a denormalized field_name copy keyed by field_id
const RELATED_ENTITIES = [
  "Scan",
  "Detection",
  "Recommendation",
  "EnvironmentalData",
  "FieldImage",
  "CameraConfig",
  "WeeklyReport",
  "NightDetection",
  "HeatMapRegion",
];

export default function EditableFieldName({ field }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(field.name);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => { setValue(field.name); }, [field.name]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === field.name) { setEditing(false); return; }
    setSaving(true);
    try {
      await base44.entities.Field.update(field.id, { name: trimmed });
      // Propagate the new name to every related entity that cached the old name
      await Promise.all(
        RELATED_ENTITIES.map((entity) =>
          base44.entities[entity]
            .updateMany({ field_id: field.id }, { $set: { field_name: trimmed } })
            .catch(() => {})
        )
      );
      queryClient.invalidateQueries({ queryKey: ["fs-field", field.id] });
      queryClient.invalidateQueries({ queryKey: ["fs-fields"] });
      queryClient.invalidateQueries({ queryKey: ["fs-fields-sidebar"] });
      queryClient.invalidateQueries({ queryKey: ["fs-scans-field", field.id] });
      queryClient.invalidateQueries({ queryKey: ["fs-detections-field", field.id] });
      queryClient.invalidateQueries({ queryKey: ["fs-recs-field", field.id] });
      queryClient.invalidateQueries({ queryKey: ["fs-env-field", field.id] });
      queryClient.invalidateQueries({ queryKey: ["fs-weekly-field", field.id] });
      queryClient.invalidateQueries({ queryKey: ["fs-night-field", field.id] });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setValue(field.name);
    setEditing(false);
  }

  function onKeyDown(e) {
    if (e.key === "Enter") { e.preventDefault(); save(); }
    else if (e.key === "Escape") { e.preventDefault(); cancel(); }
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={saving}
          style={{
            fontSize: 28, fontWeight: 700, color: '#e8eaed',
            background: '#1c2129', border: '1px solid #3da970',
            borderRadius: 8, padding: '4px 10px', outline: 'none',
            fontFamily: "'Archivo', sans-serif", minWidth: 220,
          }}
        />
        <button
          onClick={save}
          disabled={saving}
          title="Save"
          style={{
            width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: '#2d8a5a', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Check style={{ width: 16, height: 16, color: '#fff' }} />
        </button>
        <button
          onClick={cancel}
          disabled={saving}
          title="Cancel"
          style={{
            width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
            background: '#1c2129', border: '1px solid #252a33',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X style={{ width: 16, height: 16, color: '#9aa3af' }} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e8eaed', margin: 0 }}>{field.name}</h1>
      <button
        onClick={() => setEditing(true)}
        title="Edit field name"
        style={{
          width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0.5, transition: 'opacity 0.15s ease, background 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.background = '#1c2129'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.5; e.currentTarget.style.background = 'transparent'; }}
      >
        <Pencil style={{ width: 15, height: 15, color: '#9aa3af' }} />
      </button>
    </div>
  );
}