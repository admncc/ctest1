import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import JobCard from '../components/JobCard';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [latestJobs, setLatestJobs]  = useState([]);
  const [search, setSearch]          = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/jobs/categories').then(r => setCategories(r.data));
    api.get('/jobs?limit=6').then(r => setLatestJobs(r.data.jobs));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/jobs?location=${encodeURIComponent(search)}`);
  };

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>Finde den richtigen Profi für dein Projekt</h1>
          <p>Kostenlos Aufträge ausschreiben und Angebote von geprüften Handwerkern erhalten.</p>
          <form className="hero-search" onSubmit={handleSearch}>
            <input
              placeholder="Ort oder PLZ eingeben..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-accent">Suchen</button>
          </form>
          {!user && (
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register?role=customer" className="btn btn-accent btn-lg">
                Auftrag ausschreiben
              </Link>
              <Link to="/register?role=craftsman" className="btn btn-outline btn-lg" style={{ color: 'white', borderColor: 'rgba(255,255,255,.6)' }}>
                Als Handwerker registrieren
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="container" style={{ padding: '48px 20px' }}>
        <div className="grid-4">
          {[
            { num: '100%', label: 'Kostenlos' },
            { num: '12+', label: 'Kategorien' },
            { num: '⭐ 4.8', label: 'Ø Bewertung' },
            { num: '24h', label: 'Erste Angebote' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-number">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section style={{ background: 'white', padding: '48px 0', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <h2 className="section-title text-center" style={{ marginBottom: '32px' }}>Alle Kategorien</h2>
          <div className="grid-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/jobs?category=${cat.id}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '24px 16px', borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--border)', cursor: 'pointer',
                  textDecoration: 'none', color: 'var(--text)', transition: 'all .15s',
                  background: 'var(--white)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--white)'; }}
              >
                <span style={{ fontSize: '36px', marginBottom: '10px' }}>{cat.icon}</span>
                <span style={{ fontWeight: 600, fontSize: '13px', textAlign: 'center' }}>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest jobs */}
      <section className="container" style={{ padding: '48px 20px' }}>
        <div className="flex-between mb-6">
          <h2 className="section-title" style={{ marginBottom: 0 }}>Neueste Aufträge</h2>
          <Link to="/jobs" className="btn btn-outline btn-sm">Alle anzeigen</Link>
        </div>
        {latestJobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>Noch keine Aufträge</h3>
            <p>Sei der Erste und schreibe einen Auftrag aus!</p>
            <div className="mt-4">
              <Link to="/jobs/new" className="btn btn-primary">Jetzt ausschreiben</Link>
            </div>
          </div>
        ) : (
          <div className="grid-3">
            {latestJobs.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </section>

      {/* CTA */}
      <section style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white', padding: '64px 20px', textAlign: 'center',
      }}>
        <div className="container">
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>
            Du bist Handwerker?
          </h2>
          <p style={{ fontSize: '18px', opacity: .8, marginBottom: '32px', maxWidth: '480px', margin: '0 auto 32px' }}>
            Registriere dich kostenlos und erhalte Anfragen in deiner Nähe.
          </p>
          <Link to="/register?role=craftsman" className="btn btn-accent btn-lg">
            Jetzt kostenlos starten
          </Link>
        </div>
      </section>
    </>
  );
}
