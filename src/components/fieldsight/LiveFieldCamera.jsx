import React, { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Cpu, Upload, Clock, Wifi, WifiOff, ChevronRight, Image as ImageIcon, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DemoBadge from "./DemoBadge";
import FieldHistoryTimeline from "./FieldHistoryTimeline";
import { timeAgo, formatDateTime } from "@/lib/fieldUtils";

export default function LiveFieldCamera({ fields = [] }) {
  const queryClient = useQueryClient();
  const [monitoredFieldId, setMonitoredFieldId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const { data: cameraConfigs = [] } = useQuery({
    queryKey: ["fs-camera-config"],
    queryFn: () => base44.entities.CameraConfig.list("-created_date", 50),
  });

  // Default to first connected field, or first available field
  useEffect(() => {
    if (!monitoredFieldId) {
      if (cameraConfigs.length > 0) {
        setMonitoredFieldId(cameraConfigs[0].field_id);
      } else if (fields.length > 0) {
        setMonitoredFieldId(fields[0].id);
      }
    }
  }, [cameraConfigs, fields, monitoredFieldId]);

  const cameraConfig = cameraConfigs.find(c => c.field_id === monitoredFieldId);
  const monitoredField = fields.find(f => f.id === monitoredFieldId);

  // Trigger an AI grass-analysis pass on a newly captured image. Runs in the
  // background after the photo is saved — the Grass Analysis card on the Field
  // Detail page refreshes automatically once the new scan lands.
  async function runAnalysis(imageUrl, source) {
    if (!cameraConfig) return;
    setAnalyzing(true);
    try {
      await base44.functions.invoke("analyzeFieldImage", {
        field_id: cameraConfig.field_id,
        field_name: cameraConfig.field_name,
        crop: monitoredField?.crop || 'Crop',
        image_url: imageUrl,
        source,
      });
      queryClient.invalidateQueries({ queryKey: ["fs-scans-field"] });
      queryClient.invalidateQueries({ queryKey: ["fs-detections-field"] });
      queryClient.invalidateQueries({ queryKey: ["fs-recs-field"] });
      queryClient.invalidateQueries({ queryKey: ["fs-field"] });
    } catch (err) {
      console.error("Auto-analysis failed", err);
    } finally {
      setAnalyzing(false);
    }
  }

  const { data: fieldImages = [] } = useQuery({
    queryKey: ["fs-field-images", monitoredFieldId],
    queryFn: () => base44.entities.FieldImage.filter({ field_id: monitoredFieldId }, "-created_date", 20),
    enabled: !!monitoredFieldId,
  });

  // Real-time subscription for new images
  useEffect(() => {
    const unsubscribe = base44.entities.FieldImage.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ["fs-field-images"] });
    });
    return unsubscribe;
  }, [queryClient]);

  async function handleConnect() {
    if (!monitoredFieldId) return;
    setConnecting(true);
    setError(null);
    try {
      const field = fields.find(f => f.id === monitoredFieldId);
      await base44.entities.CameraConfig.create({
        field_id: monitoredFieldId,
        field_name: field?.name || 'Field',
        status: 'connected',
        capture_interval_minutes: 60,
        is_demo: false,
      });
      queryClient.invalidateQueries({ queryKey: ["fs-camera-config"] });
    } catch (err) {
      setError(err.message || 'Failed to connect camera');
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!cameraConfig) return;
    try {
      await base44.entities.CameraConfig.delete(cameraConfig.id);
      queryClient.invalidateQueries({ queryKey: ["fs-camera-config"] });
    } catch (err) {
      setError(err.message || 'Failed to disconnect camera');
    }
  }

  async function handleCapture(file) {
    if (!file || !cameraConfig) return;
    setCapturing(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.FieldImage.create({
        field_id: cameraConfig.field_id,
        field_name: cameraConfig.field_name,
        image_url: file_url,
        capture_type: 'auto',
        source: 'manual',
        is_demo: false,
      });
      await base44.entities.CameraConfig.update(cameraConfig.id, {
        last_capture_at: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ["fs-field-images"] });
      queryClient.invalidateQueries({ queryKey: ["fs-camera-config"] });
      // Kick off an AI grass-analysis pass on the new photo
      runAnalysis(file_url, 'manual');
    } catch (err) {
      setError(err.message || 'Failed to capture image');
    } finally {
      setCapturing(false);
    }
  }

  // Tell the Raspberry Pi to take a new photo now, then save it as a field image.
  async function handleSyncFromPi() {
    if (!cameraConfig) return;
    setSyncing(true);
    setError(null);
    try {
      // 1. Trigger a live capture on the Pi (may throw if endpoint isn't deployed yet)
      let capture = null;
      try {
        const capRes = await base44.functions.invoke("fastapiProxy", { action: "capture" });
        capture = capRes.data?.capture;
      } catch {
        // Capture endpoint not available — fall through to latest-status below
      }

      // 2. Fall back to the latest stored photo if capture didn't return an image
      if (!capture?.image_url) {
        const statusRes = await base44.functions.invoke("fastapiProxy", { action: "latest-status" });
        capture = statusRes.data?.capture;
      }

      const imageUrl = capture?.image_url;
      if (!imageUrl) {
        setError('No capture available from the Raspberry Pi');
        return;
      }
      // Skip if this image is already the latest stored capture
      if (fieldImages[0]?.image_url === imageUrl) {
        return;
      }
      await base44.entities.FieldImage.create({
        field_id: cameraConfig.field_id,
        field_name: cameraConfig.field_name,
        image_url: imageUrl,
        capture_type: 'auto',
        source: 'raspberry_pi',
        captured_at: capture?.timestamp || new Date().toISOString(),
        is_demo: false,
      });
      await base44.entities.CameraConfig.update(cameraConfig.id, {
        last_capture_at: capture?.timestamp || new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ["fs-field-images"] });
      queryClient.invalidateQueries({ queryKey: ["fs-camera-config"] });
      // Kick off an AI grass-analysis pass on the new Pi photo
      runAnalysis(imageUrl, 'raspberry_pi');
    } catch (err) {
      setError(err.message || 'Failed to sync from Raspberry Pi');
    } finally {
      setSyncing(false);
    }
  }

  // Auto-sync the latest Pi capture when a camera is connected
  useEffect(() => {
    if (cameraConfig) {
      handleSyncFromPi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraConfig?.id]);

  const latestImage = fieldImages[0];

  return (
    <div className="fs-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: cameraConfig ? '#16261c' : '#1c2129', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera style={{ width: 18, height: 18, color: cameraConfig ? '#3da970' : '#6b7480' }} />
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#e8eaed' }}>Live Field Camera</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              {cameraConfig ? (
                <>
                  <Wifi style={{ width: 11, height: 11, color: '#3da970' }} />
                  <span style={{ fontSize: 11, color: '#3da970', fontWeight: 500 }}>Connected · Auto-captures every hour</span>
                </>
              ) : (
                <>
                  <WifiOff style={{ width: 11, height: 11, color: '#6b7480' }} />
                  <span style={{ fontSize: 11, color: '#6b7480' }}>No camera connected</span>
                </>
              )}
            </div>
          </div>
        </div>
        {cameraConfig?.is_demo && <DemoBadge />}
      </div>

      {error && (
        <div style={{ background: '#2a1717', border: '1px solid #5a2a2a', borderRadius: 10, padding: 10, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle style={{ width: 15, height: 15, color: '#d64545', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#d64545' }}>{error}</span>
        </div>
      )}

      {/* Field selector */}
      {fields.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Monitoring Field</label>
          <select
            value={monitoredFieldId || ''}
            onChange={e => setMonitoredFieldId(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #252a33', background: '#161a21', fontSize: 14, color: '#e8eaed', cursor: 'pointer', outline: 'none' }}
          >
            {fields.map(f => (
              <option key={f.id} value={f.id}>{f.name} · {f.crop}{cameraConfigs.find(c => c.field_id === f.id) ? ' (connected)' : ''}</option>
            ))}
          </select>
        </div>
      )}

      {/* Not connected state */}
      {!cameraConfig && (
        <div>
          <p style={{ fontSize: 13, color: '#9aa3af', marginBottom: 16 }}>
            No camera connected to this field. Connect a Raspberry Pi camera for automatic hourly image capture. Images are timestamped and organized by field for historical comparison.
          </p>
          <button onClick={handleConnect} disabled={!monitoredFieldId || connecting} className="fs-btn-primary" style={{ opacity: !monitoredFieldId || connecting ? 0.5 : 1, cursor: !monitoredFieldId || connecting ? 'default' : 'pointer' }}>
            <Cpu style={{ width: 16, height: 16 }} />
            {connecting ? 'Connecting...' : 'Connect Camera to This Field'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, padding: '10px 12px', background: '#16261c', borderRadius: 10 }}>
            <Cpu style={{ width: 14, height: 14, color: '#3da970' }} />
            <span style={{ fontSize: 12, color: '#2d8a5a' }}>Once connected, the latest Raspberry Pi capture syncs automatically. Use "Sync from Pi" to refresh.</span>
          </div>
        </div>
      )}

      {/* Connected state */}
      {cameraConfig && (
        <div>
          {/* Latest image + controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 18 }} className="!grid-cols-1">
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#1c2129', minHeight: 200 }}>
              {latestImage ? (
                <>
                  <img src={latestImage.image_url} alt="Latest capture" style={{ width: '100%', height: 220, objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(10,31,20,0.75)', color: '#e8eaed', fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3da970', animation: 'fs-pulse 1.5s ease-in-out infinite' }} />
                    LIVE
                  </div>
                  <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <span style={{ background: 'rgba(10,31,20,0.75)', color: '#e8eaed', fontSize: 11, padding: '4px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock style={{ width: 11, height: 11 }} /> {timeAgo(latestImage.captured_at || latestImage.created_date)}
                    </span>
                    <span style={{ background: 'rgba(10,31,20,0.75)', color: '#e8eaed', fontSize: 10, padding: '3px 8px', borderRadius: 6 }}>
                      {formatDateTime(latestImage.captured_at || latestImage.created_date)}
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, color: '#6b7480' }}>
                  <ImageIcon style={{ width: 32, height: 32, marginBottom: 8 }} />
                  <span style={{ fontSize: 13 }}>No images captured yet</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: 14, background: '#1c2129', borderRadius: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#9aa3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Monitoring</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaed' }}>{cameraConfig.field_name}</div>
                <div style={{ fontSize: 11, color: '#6b7480', marginTop: 4 }}>
                  {fieldImages.length} image{fieldImages.length !== 1 ? 's' : ''} captured
                </div>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleCapture(e.target.files[0])} />
              <button onClick={() => fileInputRef.current?.click()} disabled={capturing} className="fs-btn-ghost" style={{ justifyContent: 'center' }}>
                {capturing ? <><RefreshCw style={{ width: 14, height: 14, animation: 'fs-spin 0.8s linear infinite' }} /> Capturing...</> : <><Camera style={{ width: 16, height: 16 }} /> Manual Capture</>}
              </button>
              <button onClick={handleSyncFromPi} disabled={syncing} className="fs-btn-primary" style={{ justifyContent: 'center', opacity: syncing ? 0.6 : 1 }}>
                {syncing ? <><RefreshCw style={{ width: 14, height: 14, animation: 'fs-spin 0.8s linear infinite' }} /> Capturing...</> : <><Cpu style={{ width: 16, height: 16 }} /> Take Photo from Pi</>}
              </button>
              <button onClick={handleDisconnect} className="fs-btn-ghost" style={{ justifyContent: 'center', color: '#d64545', borderColor: '#5a2a2a' }}>
                <WifiOff style={{ width: 16, height: 16 }} /> Disconnect
              </button>
            </div>
          </div>

          {/* Image history timeline */}
          <FieldHistoryTimeline images={fieldImages} total={fieldImages.length} />

          {/* Real-time integration note */}
          {analyzing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 12px', background: '#1a1f28', border: '1px solid #2d8a5a55', borderRadius: 10 }}>
              <RefreshCw style={{ width: 14, height: 14, color: '#4ec285', flexShrink: 0, animation: 'fs-spin 0.8s linear infinite' }} />
              <span style={{ fontSize: 12, color: '#4ec285' }}>Analyzing new photo — updating grass health indicators, detections, and field score…</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 12px', background: '#16261c', borderRadius: 10 }}>
              <CheckCircle style={{ width: 14, height: 14, color: '#3da970', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#2d8a5a' }}>New photos automatically trigger a fresh grass analysis — indicators, alerts, and field score update in real time.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}