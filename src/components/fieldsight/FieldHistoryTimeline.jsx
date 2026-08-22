import React, { useMemo, useState } from "react";
import { Clock, X, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { timeAgo, formatDateTime } from "@/lib/fieldUtils";

const SOURCE_LABEL = {
  raspberry_pi: "Raspberry Pi",
  manual: "Manual",
  demo: "Demo",
};

export default function FieldHistoryTimeline({ images = [], total = 0 }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Sort oldest → newest so progression reads left to right
  const timeline = useMemo(() => {
    return [...images].sort(
      (a, b) =>
        new Date(a.captured_at || a.created_date) -
        new Date(b.captured_at || b.created_date)
    );
  }, [images]);

  // Group by date label
  const grouped = useMemo(() => {
    const map = new Map();
    timeline.forEach((img) => {
      const d = new Date(img.captured_at || img.created_date);
      const key = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(img);
    });
    return Array.from(map.entries());
  }, [timeline]);

  if (timeline.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 24, color: "#6b7480" }}>
        <Camera style={{ width: 28, height: 28, margin: "0 auto 8px" }} />
        <p style={{ fontSize: 13, margin: 0 }}>No captures yet — connect a camera to start building the timeline.</p>
      </div>
    );
  }

  const openLightbox = (globalIdx) => setLightboxIndex(globalIdx);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () => setLightboxIndex((i) => (i > 0 ? i - 1 : i));
  const nextImage = () => setLightboxIndex((i) => (i < timeline.length - 1 ? i + 1 : i));

  let runningIndex = -1;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#9aa3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Field Timeline
        </span>
        <span style={{ fontSize: 11, color: "#6b7480" }}>{total || timeline.length} captures · oldest → newest</span>
      </div>

      {/* Horizontal scrollable timeline */}
      <div style={{ display: "flex", gap: 18, overflowX: "auto", paddingBottom: 6 }}>
        {grouped.map(([dateLabel, imgs]) => (
          <div key={dateLabel} style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#3da970", marginBottom: 8, whiteSpace: "nowrap" }}>{dateLabel}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {imgs.map((img) => {
                runningIndex += 1;
                const idx = runningIndex;
                return (
                  <button
                    key={img.id}
                    onClick={() => openLightbox(idx)}
                    style={{ flexShrink: 0, width: 116, background: "transparent", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
                  >
                    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #252a33", transition: "border-color 0.15s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3da970")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#252a33")}
                    >
                      <img src={img.image_url} alt="Field capture" style={{ width: "100%", height: 82, objectFit: "cover", display: "block" }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#9aa3af", marginTop: 5, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock style={{ width: 9, height: 9 }} />
                      {new Date(img.captured_at || img.created_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </div>
                    <div style={{ fontSize: 9, color: "#6b7480", marginTop: 1 }}>{SOURCE_LABEL[img.source] || img.source}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && timeline[lightboxIndex] && (
        <div
          onClick={closeLightbox}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <button onClick={closeLightbox} style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", cursor: "pointer", color: "#e8eaed" }}>
            <X style={{ width: 28, height: 28 }} />
          </button>

          {lightboxIndex > 0 && (
            <button onClick={(e) => { e.stopPropagation(); prevImage(); }} style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", color: "#e8eaed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft style={{ width: 24, height: 24 }} />
            </button>
          )}
          {lightboxIndex < timeline.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); nextImage(); }} style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", color: "#e8eaed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight style={{ width: 24, height: 24 }} />
            </button>
          )}

          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760, width: "100%", textAlign: "center" }}>
            <img src={timeline[lightboxIndex].image_url} alt="Field capture" style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: 12, objectFit: "contain" }} />
            <div style={{ marginTop: 14, color: "#e8eaed" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDateTime(timeline[lightboxIndex].captured_at || timeline[lightboxIndex].created_date)}</div>
              <div style={{ fontSize: 12, color: "#9aa3af", marginTop: 4 }}>
                {timeAgo(timeline[lightboxIndex].captured_at || timeline[lightboxIndex].created_date)} · {SOURCE_LABEL[timeline[lightboxIndex].source] || timeline[lightboxIndex].source}
              </div>
              <div style={{ fontSize: 11, color: "#6b7480", marginTop: 6 }}>Capture {lightboxIndex + 1} of {timeline.length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}