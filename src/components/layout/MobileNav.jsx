import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Sprout, TrendingUp, Bot, Radar } from "lucide-react";

const NAV_ITEMS = [
  { path: "/",       icon: LayoutDashboard, label: "Dashboard" },
  { path: "/fields", icon: Sprout,           label: "Fields"    },
  { path: "/trends",  icon: TrendingUp,       label: "Trends"    },
  { path: "/forecast", icon: Radar,           label: "Forecast"  },
  { path: "/consultant", icon: Bot,           label: "Consultant" },
];

export default function MobileNav() {
  const location = useLocation();

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: '#0a0d12',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '8px 8px 14px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
      }}
    >
      {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
        const active = isActive(path);
        return (
          <Link key={path} to={path} style={{ textDecoration: 'none', flex: 1 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '8px 4px',
                borderRadius: 12,
                background: active ? 'rgba(63,169,106,0.15)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon style={{
                width: 22, height: 22, strokeWidth: 1.7,
                color: active ? '#4ec285' : '#7a8290',
              }} />
              <span style={{
                fontSize: 10, fontWeight: active ? 600 : 400,
                color: active ? '#4ec285' : '#7a8290',
                letterSpacing: '0.04em',
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