import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'customer';

  const [form, setForm] = useState({
    email: '', password: '', name: '', role: defaultRole,
    location: '', phone: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✨</div>
            <h1 className="page-title">Kostenlos registrieren</h1>
            <p className="text-muted">Erstelle dein Konto – völlig kostenlos</p>
          </div>

          {/* Role tabs */}
          <div style={{
            display: 'flex', background: 'var(--bg)', borderRadius: 'var(--radius-lg)',
            padding: '4px', marginBottom: '24px',
          }}>
            {[['customer', '🏠 Auftraggeber'], ['craftsman', '🔧 Handwerker']].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setForm(p => ({ ...p, role: val }))}
                style={{
                  flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                  borderRadius: 'calc(var(--radius-lg) - 2px)',
                  fontWeight: 600, fontSize: '14px', transition: 'all .15s',
                  background: form.role === val ? 'white' : 'transparent',
                  color: form.role === val ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: form.role === val ? 'var(--shadow)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="card">
            <div className="card-body">
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-control" placeholder="Max Mustermann"
                    value={form.name} onChange={set('name')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">E-Mail</label>
                  <input type="email" className="form-control" placeholder="deine@email.de"
                    value={form.email} onChange={set('email')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Passwort</label>
                  <input type="password" className="form-control" placeholder="Min. 6 Zeichen"
                    value={form.password} onChange={set('password')} required minLength={6} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Ort / PLZ</label>
                    <input type="text" className="form-control" placeholder="Berlin"
                      value={form.location} onChange={set('location')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefon <span className="text-muted">(optional)</span></label>
                    <input type="tel" className="form-control" placeholder="+49 ..."
                      value={form.phone} onChange={set('phone')} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                  {loading ? 'Konto erstellen...' : 'Konto erstellen'}
                </button>
                <p className="text-center text-sm text-muted mt-3">
                  Mit der Registrierung stimmst du unseren Nutzungsbedingungen zu.
                </p>
              </form>
            </div>
          </div>
          <p className="text-center mt-4 text-muted">
            Bereits registriert? <Link to="/login">Jetzt anmelden</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
