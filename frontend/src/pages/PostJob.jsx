import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '',
    location: user?.location || '', budget_min: '', budget_max: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/jobs/categories').then(r => setCategories(r.data));
  }, []);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'customer') { navigate('/jobs'); }
  }, [user]);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        category_id: form.category_id ? Number(form.category_id) : null,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
      };
      const { data } = await api.post('/jobs', payload);
      navigate(`/jobs/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 className="page-title">Auftrag ausschreiben</h1>
            <p className="page-subtitle">Beschreibe dein Projekt und erhalte Angebote von Handwerkern</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Titel *</label>
                  <input type="text" className="form-control"
                    placeholder="z.B. Badezimmer renovieren – Fliesen legen"
                    value={form.title} onChange={set('title')} required maxLength={100} />
                  <div className="form-hint">Kurz und präzise – max. 100 Zeichen</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Beschreibung *</label>
                  <textarea className="form-control" rows={6}
                    placeholder="Beschreibe genau was gemacht werden soll, Umfang, Besonderheiten, Zeitraum..."
                    value={form.description} onChange={set('description')} required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Kategorie</label>
                    <select className="form-control" value={form.category_id} onChange={set('category_id')}>
                      <option value="">Kategorie wählen...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ort / PLZ *</label>
                    <input type="text" className="form-control" placeholder="z.B. Berlin"
                      value={form.location} onChange={set('location')} required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Budget (optional)</label>
                  <div className="form-row">
                    <div style={{ position: 'relative' }}>
                      <input type="number" className="form-control" placeholder="Mindestens (€)"
                        value={form.budget_min} onChange={set('budget_min')} min={0} />
                    </div>
                    <div>
                      <input type="number" className="form-control" placeholder="Maximal (€)"
                        value={form.budget_max} onChange={set('budget_max')} min={0} />
                    </div>
                  </div>
                  <div className="form-hint">Lass das Budget frei wenn du erst Angebote einholen möchtest</div>
                </div>

                {/* Tips */}
                <div style={{
                  background: 'var(--primary-light)', border: '1px solid #bfdbfe',
                  borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: '20px',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--primary)' }}>💡 Tipps für gute Aufträge</div>
                  <ul style={{ fontSize: '13px', paddingLeft: '18px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                    <li>Je detaillierter die Beschreibung, desto besser passen die Angebote</li>
                    <li>Nenne Größen, Materialwünsche und den gewünschten Zeitraum</li>
                    <li>Fotos können per Nachricht nach Kontaktaufnahme geteilt werden</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? 'Wird erstellt...' : '🚀 Jetzt ausschreiben'}
                  </button>
                  <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate(-1)}>
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
