import React from "react";
import LogoIcon from "./LogoIcon";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, LayoutDashboard, Sprout, CloudSun, TrendingUp, Bot, Radar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const NAV_ITEMS = [
  { path: "/",       icon: LayoutDashboard, label: "Dashboard" },
  { path: "/fields", icon: Sprout,           label: "Fields"     },
  { path: "/trends",  icon: TrendingUp,       label: "Trends"     },
  { path: "/forecast", icon: Radar,           label: "Forecast"   },
  { path: "/consultant", icon: Bot,            label: "Consultant" },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  const { data: fields = [] } = useQuery({
    queryKey: ["fs-fields-sidebar"],
    queryFn: () => base44.entities.Field.list("-updated_date", 100),
    refetchInterval: 30000,
  });

  const avgHealth = fields.length
    ? Math.round(fields.reduce((s, f) => s + (f.health_score ?? 100), 0) / fields.length)
    : null;
  const issueCount = fields.filter(f => f.status && f.status !== 'healthy').length;

  return (
    <aside
      className="fs-sidebar flex-shrink-0 flex flex-col"
      style={{
        width: collapsed ? 64 : 240,
        position: 'sticky',
        top: 0,
        height: 'calc(100vh - 40px)',
        transition: 'width 200ms ease',
        overflow: 'hidden',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 14px 16px 14px',
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center mb-8"
        style={{ justifyContent: collapsed ? 'center' : 'flex-start', paddingLeft: collapsed ? 0 : 6 }}
      >
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#4ec285' }}>
            <LogoIcon size={collapsed ? 26 : 28} />
          </span>
          {!collapsed && (
            <span style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: '#e8eaed',
              lineHeight: 1.2,
            }}>
              GREENSIGHT
            </span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {!collapsed && (
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#5a7a6a',
            padding: '0 10px',
            marginBottom: 6,
          }}>
            Farm
          </span>
        )}
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
          return (
            <Link
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="flex items-center transition-all duration-150"
                style={{
                  padding: collapsed ? '10px 10px' : '10px 12px',
                  borderRadius: 10,
                  gap: 10,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: isActive ? 'rgba(63,169,106,0.15)' : 'transparent',
                  color: isActive ? '#4ec285' : '#7a8290',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 14,
                  border: isActive ? '1px solid rgba(63,169,106,0.2)' : '1px solid transparent',
                }}
              >
                <Icon style={{ width: 18, height: 18, strokeWidth: 1.7, flexShrink: 0 }} />
                {!collapsed && <span>{label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Farm health summary */}
      {!collapsed && avgHealth !== null && (
        <div style={{
          margin: '12px 0',
          padding: '14px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <CloudSun style={{ width: 14, height: 14, color: '#7a8290' }} />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a8290' }}>
              Farm Health
            </span>
          </div>
          <div style={{ fontFamily: "'Archivo', sans-serif", fontSize: 28, fontWeight: 700, color: '#e8eaed', lineHeight: 1 }}>
            {avgHealth}<span style={{ fontSize: 14, color: '#7a8290', fontWeight: 500 }}> /100</span>
          </div>
          {issueCount > 0 && (
            <div style={{ fontSize: 11, color: '#d4a84a', marginTop: 6, fontWeight: 500 }}>
              {issueCount} field{issueCount > 1 ? 's' : ''} need attention
            </div>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-center transition-all duration-150"
        style={{
          padding: '8px',
          borderRadius: 10,
          color: '#7a8290',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
        }}
      >
        <ChevronRight
          style={{
            width: 16, height: 16, strokeWidth: 1.7,
            transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 200ms ease',
          }}
        />
      </button>
    </aside>
  );
}