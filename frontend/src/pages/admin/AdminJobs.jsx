import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import api from '../../api/axios';

const STATUS_LABELS = { open: 'Offen', in_progress: 'In Bearbeitung', completed: 'Abgeschlossen', cancelled: 'Storniert' };

export default function AdminJobs() {
  const [jobs, setJobs]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [pages, setPages]   = useState(1);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]       = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    api.get(`/admin/jobs?${params}`)
      .then(r => { setJobs(r.data.jobs); setTotal(r.data.total); setPages(r.data.pages); })
      .finally(() => setLoading(false));
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id, newStatus) => {
    await api.put(`/admin/jobs/${id}/status`, { status: newStatus });
    setMsg(`Status auf "${STATUS_LABELS[newStatus]}" gesetzt`);
    load();
  };

  const deleteJob = async (id, title) => {
    if (!confirm(`Auftrag "${title}" wirklich löschen?`)) return;
    await api.delete(`/admin/jobs/${id}`);
    setMsg('Auftrag gelöscht');
    load();
  };

  return (
    <AdminLayout>
      <div style={{ padding: '28px 32px' }}>
        <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Aufträge</h1>
            <p className="text-muted">{total} Aufträge gesamt</p>
          </div>
        </div>

        {msg && <div className="alert alert-success" onClick={() => setMsg('')} style={{ cursor: 'pointer' }}>{msg} ✕</div>}

        {/* Filters */}
        <div className="filter-bar mb-4">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Suche</label>
            <input className="form-control" placeholder="Titel oder Ort..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Alle</option>
              <option value="open">Offen</option>
              <option value="in_progress">In Bearbeitung</option>
              <option value="completed">Abgeschlossen</option>
              <option value="cancelled">Storniert</option>
            </select>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                    {['ID', 'Titel', 'Kategorie', 'Ort', 'Budget', 'Auftraggeber', 'Angebote', 'Status', 'Datum', 'Aktionen'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(j => (
                    <tr key={j.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>#{j.id}</td>
                      <td style={{ padding: '12px 14px', maxWidth: '200px' }}>
                        <Link to={`/jobs/${j.id}`} style={{ fontWeight: 600, color: 'var(--primary)' }}>{j.title}</Link>
                      </td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>{j.category_icon} {j.category_name || '–'}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{j.location}</td>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {j.budget_min || j.budget_max
                          ? `${j.budget_min ?? '?'}–${j.budget_max ?? '?'} €`
                          : '–'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '13px' }}>{j.customer_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{j.customer_email}</div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>{j.bid_count}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className={`badge badge-${j.status}`}>{STATUS_LABELS[j.status]}</span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(j.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <select
                            className="form-control"
                            style={{ padding: '4px 8px', fontSize: '12px', height: 'auto' }}
                            value={j.status}
                            onChange={e => changeStatus(j.id, e.target.value)}
                          >
                            <option value="open">Offen</option>
                            <option value="in_progress">In Bearbeitung</option>
                            <option value="completed">Abgeschlossen</option>
                            <option value="cancelled">Storniert</option>
                          </select>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                            onClick={() => deleteJob(j.id, j.title)} title="Löschen">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {jobs.length === 0 && (
                <div className="empty-state"><div className="empty-state-icon">📋</div><h3>Keine Aufträge gefunden</h3></div>
              )}
            </div>
          )}
        </div>

        {pages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
