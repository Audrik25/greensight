import React, { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import TabletNav from "./TabletNav";
import MobileNav from "./MobileNav";
import LogoIcon from "./LogoIcon";
import { ChevronLeft, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";

const PAGE_LABELS = {
  '/': 'Dashboard',
  '/fields': 'Fields',
  '/trends': 'Trends',
  '/forecast': 'Forecast',
  '/consultant': 'Consultant',
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isHome = location.pathname === '/';
  const isInnerPage = !isHome;
  const matchKey = Object.keys(PAGE_LABELS).find(k => k !== '/' && location.pathname.startsWith(k));
  const pageLabel = PAGE_LABELS[matchKey] || (location.pathname.startsWith('/fields/') ? 'Field' : location.pathname.startsWith('/scans/') ? 'Scan Results' : 'Dashboard');

  const glowRef = useRef(null);
  const posRef = useRef({ x: 50, y: 50 });
  const currentRef = useRef({ x: 50, y: 50 });
  const rafRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      posRef.current = {
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      };
    };
    const animate = () => {
      const target = posRef.current;
      const curr = currentRef.current;
      curr.x += (target.x - curr.x) * 0.04;
      curr.y += (target.y - curr.y) * 0.04;
      const bg = `radial-gradient(circle 600px at ${curr.x}% ${curr.y}%, rgba(63,169,106,0.08) 0%, transparent 70%)`;
      if (glowRef.current) glowRef.current.style.background = bg;
      rafRef.current = requestAnimationFrame(animate);
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* ── Desktop layout (≥1024px) ── */}
      <div
        className="hidden lg:flex h-screen"
        style={{ background: '#0e1116', padding: '20px', gap: '20px', position: 'relative', overflow: 'hidden' }}
      >
        <div ref={glowRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <main className="flex-1 min-w-0" style={{ overflowY: 'auto', overflowX: 'visible', position: 'relative', zIndex: 1 }}>
          <Outlet />
        </main>
      </div>

      {/* ── Tablet layout (768px – 1023px) ── */}
      <div
        className="hidden md:block lg:hidden"
        style={{ background: '#0e1116', position: 'relative', minHeight: '100dvh' }}
      >
        {isInnerPage && (
          <div style={{ position: 'relative', zIndex: 2, padding: '18px 20px 0 20px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: '#161a21', border: '1px solid #252a33',
                borderRadius: 10, padding: '7px 14px 7px 10px',
                cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#9aa3af',
              }}
            >
              <ChevronLeft style={{ width: 15, height: 15, strokeWidth: 1.8, color: '#6b7480' }} />
              {pageLabel}
            </button>
          </div>
        )}
        <main style={{ position: 'relative', zIndex: 1, padding: isInnerPage ? '12px 20px 100px 20px' : '20px 20px 100px 20px' }}>
          <Outlet />
        </main>
        <TabletNav />
      </div>

      {/* ── Mobile layout (<768px) ── */}
      <div
        className="flex md:hidden flex-col"
        style={{ background: '#0e1116', minHeight: '100dvh', position: 'relative', overflow: 'hidden' }}
      >
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: '#0a0d12', borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#4ec285' }}>
              <LogoIcon size={24} />
            </span>
            <span style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: 13, fontWeight: 700, letterSpacing: '0.14em',
              color: '#e8eaed', textTransform: 'uppercase', lineHeight: 1.2,
            }}>
              GreenSight
            </span>
          </div>
          {user ? (
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setMobileMenuOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '6px 10px', borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.06)',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: '#4ec285', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#0a0d12' }}>
                    {(user.full_name || user.email)?.[0]?.toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#e8eaed', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.full_name || user.email}
                </span>
              </div>
              {mobileMenuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setMobileMenuOpen(false)} />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
                    background: '#0a0d12', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, overflow: 'hidden', minWidth: 140,
                  }}>
                    <button
                      onClick={() => { base44.auth.logout(); setMobileMenuOpen(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 16px', border: 'none', background: 'transparent',
                        cursor: 'pointer', fontSize: 13, color: '#ff6b6b', fontWeight: 500,
                      }}
                    >
                      <LogOut style={{ width: 14, height: 14 }} />
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              style={{
                background: 'rgba(63,169,106,0.15)', border: '1px solid rgba(63,169,106,0.2)',
                borderRadius: 10, cursor: 'pointer', padding: '6px 14px',
                fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#4ec285',
              }}
            >
              Log In
            </button>
          )}
        </header>

        <main style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1, padding: '16px 12px 90px 12px' }}>
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </>
  );
}