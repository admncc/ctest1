import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../api/axios';

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="card">
      <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: color + '20', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '22px', flexShrink: 0,
        }}>{icon}</div>
        <div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: color || 'var(--text)' }}>{value}</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{label}</div>
          {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function MiniBar({ data, color, label }) {
  if (!data?.length) return <div className="text-muted text-sm">Keine Daten</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div>
      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '60px' }}>
        {data.map(d => (
          <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{
              width: '100%', background: color,
              height: `${Math.max((d.count / max) * 52, 4)}px`,
              borderRadius: '3px 3px 0 0', minHeight: '4px',
            }} title={`${d.day}: ${d.count}`} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
        <span>{data[0]?.day?.slice(5)}</span>
        <span>{data[data.length - 1]?.day?.slice(5)}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data))
      .catch(() => setError('Statistiken konnten nicht geladen werden'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div style={{ padding: '28px 32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Dashboard</h1>
        <p className="text-muted" style={{ marginBottom: '28px' }}>Plattform-Übersicht auf einen Blick</p>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? <div className="spinner" /> : stats && (
          <>
            {/* User stats */}
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '12px' }}>
              Benutzer
            </div>
            <div className="grid-4 mb-6">
              <StatCard icon="👥" label="Gesamt" value={stats.users.total} sub={`+${stats.users.newLast7d} diese Woche`} color="var(--primary)" />
              <StatCard icon="🏠" label="Auftraggeber" value={stats.users.customers} color="#7c3aed" />
              <StatCard icon="🔧" label="Handwerker" value={stats.users.craftsmen} color="#0891b2" />
              <StatCard icon="🚫" label="Gesperrt" value={stats.users.banned} color="var(--danger)" />
            </div>

            {/* Job stats */}
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '12px' }}>
              Aufträge
            </div>
            <div className="grid-4 mb-6">
              <StatCard icon="📋" label="Gesamt" value={stats.jobs.total} sub={`+${stats.jobs.newLast7d} diese Woche`} color="var(--primary)" />
              <StatCard icon="🟢" label="Offen" value={stats.jobs.open} color="var(--success)" />
              <StatCard icon="🟡" label="In Bearbeitung" value={stats.jobs.active} color="var(--accent)" />
              <StatCard icon="✅" label="Abgeschlossen" value={stats.jobs.completed} color="#0891b2" />
            </div>

            {/* Other stats */}
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '12px' }}>
              Aktivität
            </div>
            <div className="grid-4 mb-6">
              <StatCard icon="💬" label="Angebote" value={stats.bids} color="var(--primary)" />
              <StatCard icon="⭐" label="Bewertungen" value={stats.reviews} sub={stats.avgRating ? `Ø ${Number(stats.avgRating).toFixed(1)}` : undefined} color="var(--accent)" />
              <StatCard icon="✉️" label="Nachrichten" value={stats.messages} color="#7c3aed" />
              <StatCard icon="🗂️" label="Kategorien" value={stats.categories} color="#0891b2" />
            </div>

            {/* Charts */}
            <div className="grid-2">
              <div className="card">
                <div className="card-header">Registrierungen (14 Tage)</div>
                <div className="card-body">
                  <MiniBar data={stats.charts.regByDay} color="var(--primary)" label="Neue Benutzer pro Tag" />
                </div>
              </div>
              <div className="card">
                <div className="card-header">Neue Aufträge (14 Tage)</div>
                <div className="card-body">
                  <MiniBar data={stats.charts.jobsByDay} color="var(--success)" label="Neue Aufträge pro Tag" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
