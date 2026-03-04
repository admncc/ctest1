import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { path: '/admin',             icon: '📊', label: 'Dashboard' },
  { path: '/admin/users',       icon: '👥', label: 'Benutzer' },
  { path: '/admin/jobs',        icon: '📋', label: 'Aufträge' },
  { path: '/admin/categories',  icon: '🗂️', label: 'Kategorien' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px', background: '#1e293b', color: 'white',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ fontWeight: 800, fontSize: '16px' }}>🔧 HandwerkerNetz</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)', marginTop: '2px' }}>Admin Panel</div>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {NAV.map(item => {
            const active = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: 'var(--radius)',
                  textDecoration: 'none', fontSize: '14px', fontWeight: 500,
                  marginBottom: '2px', transition: 'background .15s',
                  color: active ? 'white' : 'rgba(255,255,255,.65)',
                  background: active ? 'rgba(255,255,255,.12)' : 'transparent',
                }}
              >
                <span>{item.icon}</span> {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ padding: '8px 12px', fontSize: '13px', color: 'rgba(255,255,255,.6)', marginBottom: '4px' }}>
            {user?.name}
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            style={{
              width: '100%', padding: '8px 12px', background: 'transparent',
              border: 'none', color: 'rgba(255,255,255,.6)', cursor: 'pointer',
              textAlign: 'left', borderRadius: 'var(--radius)', fontSize: '14px',
            }}
          >
            ← Zur Plattform
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
