import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import api from '../../api/axios';

export default function AdminUsers() {
  const [users, setUsers]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [pages, setPages]   = useState(1);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole]     = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]       = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (search) params.set('search', search);
    if (role)   params.set('role', role);
    api.get(`/admin/users?${params}`)
      .then(r => { setUsers(r.data.users); setTotal(r.data.total); setPages(r.data.pages); })
      .finally(() => setLoading(false));
  }, [page, search, role]);

  useEffect(() => { load(); }, [load]);

  const toggleBan = async (id) => {
    const { data } = await api.put(`/admin/users/${id}/ban`);
    setMsg(data.message);
    load();
  };

  const toggleAdmin = async (id) => {
    const { data } = await api.put(`/admin/users/${id}/admin`);
    setMsg(data.message);
    load();
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Benutzer "${name}" wirklich löschen?`)) return;
    await api.delete(`/admin/users/${id}`);
    setMsg('Benutzer gelöscht');
    load();
  };

  return (
    <AdminLayout>
      <div style={{ padding: '28px 32px' }}>
        <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Benutzer</h1>
            <p className="text-muted">{total} Benutzer gesamt</p>
          </div>
        </div>

        {msg && <div className="alert alert-success" onClick={() => setMsg('')} style={{ cursor: 'pointer' }}>{msg} ✕</div>}

        {/* Filters */}
        <div className="filter-bar mb-4">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Suche</label>
            <input className="form-control" placeholder="Name oder E-Mail..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="form-group">
            <label className="form-label">Rolle</label>
            <select className="form-control" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
              <option value="">Alle</option>
              <option value="customer">Auftraggeber</option>
              <option value="craftsman">Handwerker</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                    {['ID', 'Name', 'E-Mail', 'Rolle', 'Ort', 'Aufträge/Angebote', 'Bewertung', 'Registriert', 'Aktionen'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{
                      borderBottom: '1px solid var(--border)',
                      background: u.banned ? '#fff5f5' : undefined,
                    }}>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>#{u.id}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '13px' }}>{u.name[0]}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                              {u.is_admin && <span className="badge badge-accepted" style={{ fontSize: '10px', padding: '1px 6px' }}>Admin</span>}
                              {u.banned   && <span className="badge badge-rejected" style={{ fontSize: '10px', padding: '1px 6px' }}>Gesperrt</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{u.email}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className={`badge badge-${u.role}`} style={{ fontSize: '12px' }}>
                          {u.role === 'customer' ? '🏠 Auftraggeber' : '🔧 Handwerker'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{u.location || '–'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {u.role === 'customer' ? u.job_count : u.bid_count}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {u.avg_rating ? `⭐ ${Number(u.avg_rating).toFixed(1)} (${u.review_count})` : '–'}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(u.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                          <Link to={`/profile/${u.id}`} className="btn btn-ghost btn-sm" title="Profil ansehen">👁️</Link>
                          <button className="btn btn-ghost btn-sm" title={u.is_admin ? 'Admin entziehen' : 'Zum Admin machen'} onClick={() => toggleAdmin(u.id)}>
                            {u.is_admin ? '⭐' : '☆'}
                          </button>
                          <button
                            className={`btn btn-sm ${u.banned ? 'btn-outline' : 'btn-ghost'}`}
                            style={{ color: u.banned ? 'var(--success)' : 'var(--warning)' }}
                            title={u.banned ? 'Entsperren' : 'Sperren'}
                            onClick={() => toggleBan(u.id)}
                            disabled={u.is_admin}
                          >
                            {u.banned ? '✅' : '🚫'}
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} title="Löschen"
                            onClick={() => deleteUser(u.id, u.name)} disabled={u.is_admin}>
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="empty-state"><div className="empty-state-icon">👥</div><h3>Keine Benutzer gefunden</h3></div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
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
