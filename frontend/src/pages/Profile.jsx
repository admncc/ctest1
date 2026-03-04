import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StarDisplay } from '../components/StarRating';
import JobCard from '../components/JobCard';

export default function Profile() {
  const { id } = useParams();
  const { user: me, refreshUser } = useAuth();
  const isOwn = me?.id === Number(id);

  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [msg, setMsg]           = useState('');
  const [activeTab, setActiveTab] = useState('reviews');

  useEffect(() => {
    setLoading(true);
    api.get(`/users/${id}`)
      .then(r => {
        setProfile(r.data);
        setForm({
          name: r.data.name,
          location: r.data.location || '',
          bio: r.data.bio || '',
          phone: r.data.phone || '',
          hourly_rate: r.data.profile?.hourly_rate || '',
          service_radius: r.data.profile?.service_radius || 50,
          specializations: r.data.profile?.specializations || [],
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const saveProfile = async () => {
    setSaveLoading(true);
    try {
      await api.put('/users/me', form);
      await refreshUser();
      const { data } = await api.get(`/users/${id}`);
      setProfile(data);
      setEditing(false);
      setMsg('Profil gespeichert!');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setSaveLoading(false);
    }
  };

  const SKILLS = [
    'Elektrik', 'Sanitär', 'Heizung', 'Malerei', 'Tapezieren', 'Bodenbeläge',
    'Fliesen', 'Garten', 'Umzug', 'Schlosserei', 'Dach', 'Fenster', 'Türen',
    'Trockenbau', 'Isolierung', 'Holzarbeiten', 'Schweißen', 'IT/Elektronik', 'Reinigung',
  ];

  const toggleSkill = (s) => {
    setForm(p => ({
      ...p,
      specializations: p.specializations.includes(s)
        ? p.specializations.filter(x => x !== s)
        : [...p.specializations, s],
    }));
  };

  if (loading) return <div className="spinner" style={{ marginTop: '80px' }} />;
  if (!profile) return <div className="container page"><div className="alert alert-error">Profil nicht gefunden</div></div>;

  return (
    <div className="page">
      <div className="container">
        {msg && <div className={`alert ${msg.includes('Fehler') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '28px' }} className="profile-grid">

          {/* Sidebar */}
          <div>
            <div className="card mb-4">
              <div className="card-body text-center">
                <div className="avatar avatar-xl" style={{ margin: '0 auto 16px' }}>{profile.name[0]}</div>
                {editing ? (
                  <input className="form-control mb-2" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                ) : (
                  <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>{profile.name}</h2>
                )}
                <span className={`badge badge-${profile.role}`} style={{ marginBottom: '12px' }}>
                  {profile.role === 'customer' ? '🏠 Auftraggeber' : '🔧 Handwerker'}
                </span>
                <StarDisplay rating={profile.rating} count={profile.reviewCount} size="lg" />

                <div style={{ marginTop: '16px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  {editing ? (
                    <input className="form-control" placeholder="📍 Ort" value={form.location}
                      onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                  ) : profile.location && (
                    <div className="text-muted">📍 {profile.location}</div>
                  )}
                  {editing ? (
                    <input className="form-control" placeholder="📞 Telefon" value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                  ) : profile.phone && (
                    <div className="text-muted">📞 {profile.phone}</div>
                  )}
                  <div className="text-muted">📅 Mitglied seit {new Date(profile.created_at).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })}</div>
                </div>

                {isOwn && (
                  <div className="mt-4">
                    {editing ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary btn-sm" disabled={saveLoading} onClick={saveProfile}>
                          {saveLoading ? '...' : 'Speichern'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Abbrechen</button>
                      </div>
                    ) : (
                      <button className="btn btn-outline btn-sm btn-block" onClick={() => setEditing(true)}>
                        ✏️ Profil bearbeiten
                      </button>
                    )}
                  </div>
                )}

                {!isOwn && me && (
                  <Link to={`/messages/${profile.id}`} className="btn btn-primary btn-sm btn-block mt-3">
                    💬 Nachricht senden
                  </Link>
                )}
              </div>
            </div>

            {/* Craftsman profile */}
            {profile.role === 'craftsman' && (
              <div className="card">
                <div className="card-header">Handwerkerprofil</div>
                <div className="card-body">
                  {editing ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">Stundenlohn (€)</label>
                        <input type="number" className="form-control" value={form.hourly_rate}
                          onChange={e => setForm(p => ({ ...p, hourly_rate: e.target.value }))} min={0} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Umkreis (km)</label>
                        <input type="number" className="form-control" value={form.service_radius}
                          onChange={e => setForm(p => ({ ...p, service_radius: e.target.value }))} min={1} max={500} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Spezialisierungen</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {SKILLS.map(s => (
                            <button key={s} type="button"
                              className={`badge ${form.specializations.includes(s) ? 'badge-accepted' : 'badge-pending'}`}
                              style={{ cursor: 'pointer', padding: '5px 10px' }}
                              onClick={() => toggleSkill(s)}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {profile.profile?.hourly_rate && (
                        <div className="mb-3">
                          <div className="text-muted text-sm">Stundenlohn</div>
                          <div className="font-semibold">{profile.profile.hourly_rate} €/h</div>
                        </div>
                      )}
                      {profile.profile?.service_radius && (
                        <div className="mb-3">
                          <div className="text-muted text-sm">Umkreis</div>
                          <div className="font-semibold">{profile.profile.service_radius} km</div>
                        </div>
                      )}
                      {profile.profile?.specializations?.length > 0 && (
                        <div>
                          <div className="text-muted text-sm mb-2">Spezialisierungen</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {profile.profile.specializations.map(s => (
                              <span key={s} className="badge badge-accepted">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {!profile.profile?.hourly_rate && !profile.profile?.specializations?.length && (
                        <p className="text-muted text-sm">Noch kein Profil ausgefüllt.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main */}
          <div>
            {/* Bio */}
            <div className="card mb-4">
              <div className="card-header">Über mich</div>
              <div className="card-body">
                {editing ? (
                  <textarea className="form-control" rows={4} placeholder="Schreibe etwas über dich..."
                    value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
                ) : profile.bio ? (
                  <p style={{ lineHeight: 1.7 }}>{profile.bio}</p>
                ) : (
                  <p className="text-muted">Keine Beschreibung vorhanden.</p>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button className={`tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
                ⭐ Bewertungen ({profile.reviews?.length || 0})
              </button>
              {profile.role === 'customer' && (
                <button className={`tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
                  📋 Aufträge
                </button>
              )}
            </div>

            {activeTab === 'reviews' && (
              profile.reviews?.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">⭐</div>
                  <h3>Noch keine Bewertungen</h3>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profile.reviews?.map(r => (
                    <div key={r.id} className="card">
                      <div className="card-body">
                        <div className="flex-between mb-2">
                          <div className="font-semibold">{r.reviewer_name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <StarDisplay rating={r.rating} />
                            <span className="text-muted text-sm">{new Date(r.created_at).toLocaleDateString('de-DE')}</span>
                          </div>
                        </div>
                        {r.comment && <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>{r.comment}</p>}
                        {r.job_title && <div className="text-muted text-sm mt-2">Auftrag: {r.job_title}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'jobs' && <JobsTab userId={id} />}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) { .profile-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

function JobsTab({ userId }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/${userId}/jobs`)
      .then(r => setJobs(r.data))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="spinner" />;
  if (!jobs.length) return <div className="empty-state"><div className="empty-state-icon">📋</div><h3>Keine Aufträge</h3></div>;

  return (
    <div className="grid-2">
      {jobs.map(j => <JobCard key={j.id} job={j} />)}
    </div>
  );
}
