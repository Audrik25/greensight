import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Sprout, TrendingUp, Bot, Radar } from "lucide-react";
import LogoIcon from "./LogoIcon";

const ALL_NAV = [
  { path: "/",       icon: LayoutDashboard, label: "Dashboard" },
  { path: "/fields", icon: Sprout,           label: "Fields"    },
  { path: "/trends",  icon: TrendingUp,       label: "Trends"    },
  { path: "/forecast", icon: Radar,           label: "Forecast"  },
  { path: "/consultant", icon: Bot,           label: "Consultant" },
];

export default function TabletNav() {
  const location = useLocation();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: '#0a0d12',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18,
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        boxShadow: '0 4px 20px rgba(10,31,20,0.25)',
      }}
    >
      <div style={{
        padding: '4px 10px 4px 4px',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        marginRight: 4,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ color: '#4ec285' }}>
          <LogoIcon size={22} />
        </span>
        <span style={{
          fontFamily: "'Archivo', sans-serif",
          fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
          color: '#e8eaed', textTransform: 'uppercase', lineHeight: 1,
        }}>
          GreenSight
        </span>
      </div>

      {ALL_NAV.map(({ path, icon: Icon, label }) => {
        const isActive = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
        return (
          <Link key={path} to={path} style={{ textDecoration: 'none' }}>
            <div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '8px 14px', borderRadius: 12,
                background: isActive ? 'rgba(63,169,106,0.15)' : 'transparent',
                transition: 'all 0.15s ease', minWidth: 56,
              }}
            >
              <Icon style={{
                width: 20, height: 20, strokeWidth: 1.7,
                color: isActive ? '#4ec285' : '#7a8290',
              }} />
              <span style={{
                fontSize: 9, fontWeight: isActive ? 600 : 400,
                color: isActive ? '#4ec285' : '#7a8290',
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {label}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}