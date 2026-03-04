import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import { StarDisplay } from '../components/StarRating';

const STATUS_LABELS = { open: 'Offen', in_progress: 'In Bearbeitung', completed: 'Abgeschlossen', cancelled: 'Storniert' };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs]     = useState([]);
  const [tab, setTab]       = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/jobs/mine/list')
      .then(r => setJobs(r.data))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const filtered = tab === 'all' ? jobs : jobs.filter(j => (j.status || j.bid_status) === tab);

  const stats = {
    total: jobs.length,
    open: jobs.filter(j => j.status === 'open').length,
    active: jobs.filter(j => j.status === 'in_progress').length,
    done: jobs.filter(j => j.status === 'completed').length,
  };

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <div className="avatar avatar-xl">{user.name[0]}</div>
          <div style={{ flex: 1 }}>
            <h1 className="page-title" style={{ marginBottom: '4px' }}>Hallo, {user.name.split(' ')[0]}! 👋</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span className={`badge badge-${user.role}`}>
                {user.role === 'customer' ? '🏠 Auftraggeber' : '🔧 Handwerker'}
              </span>
              {user.location && <span className="text-muted text-sm">📍 {user.location}</span>}
              {user.rating && <StarDisplay rating={user.rating} count={user.reviewCount} />}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to={`/profile/${user.id}`} className="btn btn-outline btn-sm">Profil ansehen</Link>
            {user.role === 'customer' && (
              <Link to="/jobs/new" className="btn btn-primary btn-sm">➕ Neuer Auftrag</Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4 mb-6">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">{user.role === 'customer' ? 'Aufträge' : 'Angebote'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#166534' }}>{stats.open}</div>
            <div className="stat-label">Offen</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: 'var(--accent-dark)' }}>{stats.active}</div>
            <div className="stat-label">In Bearbeitung</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: 'var(--primary)' }}>{stats.done}</div>
            <div className="stat-label">Abgeschlossen</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            ['all', 'Alle'],
            ['open', 'Offen'],
            ['in_progress', 'Aktiv'],
            ['completed', 'Abgeschlossen'],
          ].map(([val, label]) => (
            <button key={val} className={`tab ${tab === val ? 'active' : ''}`} onClick={() => setTab(val)}>
              {label}
              {val !== 'all' && (
                <span style={{
                  marginLeft: '6px', background: tab === val ? 'var(--primary)' : 'var(--border)',
                  color: tab === val ? 'white' : 'var(--text-muted)',
                  borderRadius: '999px', padding: '1px 7px', fontSize: '11px',
                }}>
                  {val === 'all' ? jobs.length : jobs.filter(j => j.status === val).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{user.role === 'customer' ? '📋' : '🔨'}</div>
            <h3>{user.role === 'customer' ? 'Noch keine Aufträge' : 'Noch keine Angebote'}</h3>
            <p>{user.role === 'customer'
              ? 'Schreibe deinen ersten Auftrag aus und erhalte Angebote.'
              : 'Durchsuche offene Aufträge und gib dein erstes Angebot ab.'}
            </p>
            <div className="mt-4">
              {user.role === 'customer'
                ? <Link to="/jobs/new" className="btn btn-primary">Jetzt ausschreiben</Link>
                : <Link to="/jobs" className="btn btn-primary">Aufträge durchsuchen</Link>
              }
            </div>
          </div>
        ) : user.role === 'customer' ? (
          <div className="grid-3">
            {filtered.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        ) : (
          /* Craftsman view - show bid status */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(job => (
              <Link to={`/jobs/${job.id}`} key={job.id} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ transition: 'box-shadow .15s' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}>
                  <div className="card-body">
                    <div className="flex-between">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px', color: 'var(--text)' }}>
                          {job.title}
                        </div>
                        <div className="text-muted text-sm">
                          📍 {job.location} · {job.category_icon} {job.category_name} · von {job.customer_name}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>{job.my_bid} €</div>
                        <span className={`badge badge-${job.bid_status}`} style={{ marginTop: '4px' }}>
                          {job.bid_status === 'pending' ? 'Ausstehend' : job.bid_status === 'accepted' ? '✅ Angenommen' : '❌ Abgelehnt'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
