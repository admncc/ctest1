import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import JobCard from '../components/JobCard';
import { useAuth } from '../context/AuthContext';

export default function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [loading, setLoading]     = useState(true);
  const { user } = useAuth();

  const category = searchParams.get('category') || '';
  const location = searchParams.get('location') || '';
  const page     = Number(searchParams.get('page') || 1);

  useEffect(() => {
    api.get('/jobs/categories').then(r => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 12 });
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    api.get(`/jobs?${params}`)
      .then(r => { setJobs(r.data.jobs); setTotal(r.data.total); setPages(r.data.pages); })
      .finally(() => setLoading(false));
  }, [category, location, page]);

  const [locationInput, setLocationInput] = useState(location);

  const applyFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.set('page', '1');
    if (locationInput) next.set('location', locationInput);
    else next.delete('location');
    setSearchParams(next);
  };

  const setCategory = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', '1');
    if (id) next.set('category', id);
    else next.delete('category');
    setSearchParams(next);
  };

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
    window.scrollTo(0, 0);
  };

  return (
    <div className="page">
      <div className="container">
        <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">Aufträge</h1>
            <p className="page-subtitle">{total} Aufträge gefunden</p>
          </div>
          {user?.role === 'customer' && (
            <Link to="/jobs/new" className="btn btn-primary">➕ Auftrag ausschreiben</Link>
          )}
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Ort</label>
            <input
              type="text" className="form-control" placeholder="z.B. Berlin"
              value={locationInput}
              onChange={e => setLocationInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyFilter()}
            />
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Kategorie</label>
            <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Alle Kategorien</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={applyFilter}>Suchen</button>
          {(category || location) && (
            <button className="btn btn-ghost" onClick={() => { setLocationInput(''); setSearchParams({}); }}>
              Zurücksetzen
            </button>
          )}
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button
            className={`badge ${!category ? 'badge-accepted' : 'badge-pending'}`}
            style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '13px' }}
            onClick={() => setCategory('')}
          >
            Alle
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              className={`badge ${category === String(c.id) ? 'badge-accepted' : 'badge-pending'}`}
              style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '13px' }}
              onClick={() => setCategory(String(c.id))}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="spinner" />
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>Keine Aufträge gefunden</h3>
            <p>Versuche andere Suchkriterien oder schreibe selbst einen Auftrag aus.</p>
            {user?.role === 'customer' && (
              <div className="mt-4">
                <Link to="/jobs/new" className="btn btn-primary">Jetzt ausschreiben</Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid-3">
              {jobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
            {pages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(page - 1)} disabled={page <= 1}>←</button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                    {p}
                  </button>
                ))}
                <button className="page-btn" onClick={() => setPage(page + 1)} disabled={page >= pages}>→</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
