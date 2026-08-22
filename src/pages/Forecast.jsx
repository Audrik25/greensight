import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Radar, RefreshCw, Sprout, ChevronDown, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/shared/PageHeader";
import ForecastOverview from "@/components/forecast/ForecastOverview";
import ForecastCharts from "@/components/forecast/ForecastCharts";
import ForecastRisks from "@/components/forecast/ForecastRisks";
import ForecastPatterns from "@/components/forecast/ForecastPatterns";
import ForecastActions from "@/components/forecast/ForecastActions";

export default function Forecast() {
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);

  const { data: fields = [] } = useQuery({
    queryKey: ["fs-fields"],
    queryFn: () => base44.entities.Field.list("-updated_date", 100),
  });

  const selectedField = fields.find(f => f.id === selectedFieldId);
  const fieldLabel = selectedField ? selectedField.name : 'All Fields';

  const generateForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('generateForecast', {
        field_id: selectedFieldId || null,
      });
      const data = res.data || res;
      if (data.error) throw new Error(data.error);
      setForecast(data.forecast);
      setGeneratedAt(new Date());
    } catch (err) {
      setError(err.message || 'Failed to generate forecast.');
    } finally {
      setLoading(false);
    }
  }, [selectedFieldId]);

  // Generate on mount and whenever field selection changes
  useEffect(() => {
    if (fields.length > 0) {
      generateForecast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFieldId, fields.length]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = () => setDropdownOpen(false);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [dropdownOpen]);

  return (
    <div style={{ padding: '0 4px 40px 4px', maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        title="Farm Forecast"
        subtitle="Early-warning predictions for the next 14 days"
        icon={Radar}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Field selector */}
            <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setDropdownOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                  background: '#161a21', border: '1px solid #252a33', color: '#e8eaed',
                  fontSize: 13, fontWeight: 500,
                }}
              >
                <Sprout style={{ width: 15, height: 15, color: '#4ec285' }} />
                {fieldLabel}
                <ChevronDown style={{ width: 15, height: 15, color: '#7a8290' }} />
              </button>
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50,
                  minWidth: 200, maxHeight: 320, overflowY: 'auto',
                  background: '#161a21', border: '1px solid #353b45', borderRadius: 12,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)', padding: 6,
                }}>
                  <button
                    onClick={() => { setSelectedFieldId(null); setDropdownOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      background: !selectedFieldId ? '#16261c' : 'transparent',
                      color: !selectedFieldId ? '#4ec285' : '#e8eaed',
                      border: 'none', fontSize: 13, fontWeight: 500, textAlign: 'left',
                    }}
                  >
                    <Radar style={{ width: 15, height: 15 }} /> All Fields
                  </button>
                  <div style={{ height: 1, background: '#252a33', margin: '4px 0' }} />
                  {fields.map(f => (
                    <button
                      key={f.id}
                      onClick={() => { setSelectedFieldId(f.id); setDropdownOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                        background: selectedFieldId === f.id ? '#16261c' : 'transparent',
                        color: selectedFieldId === f.id ? '#4ec285' : '#e8eaed',
                        border: 'none', fontSize: 13, fontWeight: 500, textAlign: 'left',
                      }}
                    >
                      <Sprout style={{ width: 15, height: 15, color: '#4ec285' }} />
                      {f.name}
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#7a8290' }}>{f.crop}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Refresh */}
            <button
              onClick={generateForecast}
              disabled={loading}
              className="fs-btn-ghost"
              style={{ opacity: loading ? 0.5 : 1 }}
            >
              <RefreshCw style={{ width: 15, height: 15, className: loading ? 'fs-spin' : '' }} />
              {loading ? 'Forecasting...' : 'Refresh'}
            </button>
          </div>
        }
      />

      {/* Last updated */}
      {generatedAt && !loading && forecast && (
        <div style={{ fontSize: 11, color: '#6b7480', marginBottom: 16 }}>
          Last updated {generatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · Forecasts auto-update when new scans or environmental data arrive
        </div>
      )}

      {/* Loading state */}
      {loading && !forecast && (
        <div className="fs-card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 20px', position: 'relative' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              border: '3px solid #252a33', borderTopColor: '#4ec285',
              animation: 'fs-spin 0.8s linear infinite',
            }} />
            <Radar style={{ width: 26, height: 26, color: '#4ec285', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e8eaed', marginBottom: 6 }}>Analyzing Patterns</h2>
          <p style={{ fontSize: 13, color: '#7a8290' }}>
            Combining historical data, recent scans, soil conditions, and weather to forecast the next 14 days...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="fs-card" style={{ padding: 32, textAlign: 'center', background: '#2a1717', border: '1px solid #5a2a2a' }}>
          <AlertCircle style={{ width: 32, height: 32, color: '#d64545', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: 17, fontWeight: 600, color: '#d64545', marginBottom: 6 }}>Forecast Unavailable</h2>
          <p style={{ fontSize: 13, color: '#d64545', marginBottom: 16 }}>{error}</p>
          <button onClick={generateForecast} className="fs-btn-primary">Try Again</button>
        </div>
      )}

      {/* Forecast content */}
      {forecast && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ForecastOverview forecast={forecast} fieldCount={fields.length} />
          <ForecastCharts daily={forecast.daily_forecasts || []} />
          <ForecastRisks risks={forecast.risks || []} />
          <ForecastPatterns patterns={forecast.historical_patterns || []} weatherImpact={forecast.weather_impact} />
          <ForecastActions actions={forecast.recommended_actions || []} />
        </div>
      )}
    </div>
  );
}