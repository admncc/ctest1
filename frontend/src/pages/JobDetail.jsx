import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { StarDisplay, StarPicker } from '../components/StarRating';

const STATUS_LABELS = { open: 'Offen', in_progress: 'In Bearbeitung', completed: 'Abgeschlossen', cancelled: 'Storniert' };

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [msg, setMsg]         = useState('');

  // Bid form
  const [bidForm, setBidForm]     = useState({ amount: '', message: '' });
  const [bidError, setBidError]   = useState('');
  const [bidLoading, setBidLoading] = useState(false);

  // Review form
  const [reviewForm, setReviewForm]   = useState({ rating: 0, comment: '' });
  const [reviewError, setReviewError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchJob = () => {
    api.get(`/jobs/${id}`)
      .then(r => setJob(r.data))
      .catch(() => setError('Auftrag nicht gefunden'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJob(); }, [id]);

  const submitBid = async (e) => {
    e.preventDefault();
    setBidError('');
    setBidLoading(true);
    try {
      await api.post('/bids', { job_id: Number(id), amount: Number(bidForm.amount), message: bidForm.message });
      setBidForm({ amount: '', message: '' });
      setMsg('Angebot erfolgreich abgegeben!');
      fetchJob();
    } catch (err) {
      setBidError(err.response?.data?.error || 'Fehler beim Abgeben');
    } finally {
      setBidLoading(false);
    }
  };

  const acceptBid = async (bidId) => {
    await api.post(`/bids/${bidId}/accept`);
    setMsg('Angebot angenommen!');
    fetchJob();
  };

  const rejectBid = async (bidId) => {
    await api.post(`/bids/${bidId}/reject`);
    fetchJob();
  };

  const completeJob = async () => {
    await api.post(`/jobs/${id}/complete`);
    setMsg('Auftrag als abgeschlossen markiert.');
    fetchJob();
  };

  const cancelJob = async () => {
    if (!confirm('Auftrag wirklich stornieren?')) return;
    await api.delete(`/jobs/${id}`);
    navigate('/dashboard');
  };

  const submitReview = async (revieweeId) => {
    setReviewError('');
    if (!reviewForm.rating) { setReviewError('Bitte vergib eine Bewertung.'); return; }
    setReviewLoading(true);
    try {
      await api.post('/reviews', { job_id: Number(id), reviewee_id: revieweeId, ...reviewForm });
      setMsg('Bewertung gespeichert!');
      fetchJob();
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Fehler beim Speichern');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <div className="spinner" style={{ marginTop: '80px' }} />;
  if (error) return <div className="container page"><div className="alert alert-error">{error}</div></div>;

  const isOwner = user?.id === job.customer_id;
  const myBid   = job.bids?.find(b => b.craftsman_id === user?.id);
  const acceptedBid = job.bids?.find(b => b.status === 'accepted');

  const budget = job.budget_min || job.budget_max
    ? `${job.budget_min ? job.budget_min + ' €' : ''}${job.budget_min && job.budget_max ? ' – ' : ''}${job.budget_max ? job.budget_max + ' €' : ''}`
    : 'Preis offen';

  return (
    <div className="page">
      <div className="container">
        {msg && <div className="alert alert-success">{msg}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px' }} className="job-detail-grid">
          {/* Main */}
          <div>
            <div className="card mb-4">
              <div className="card-body">
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${job.status}`}>{STATUS_LABELS[job.status]}</span>
                  {job.category_name && (
                    <span className="badge badge-pending">{job.category_icon} {job.category_name}</span>
                  )}
                </div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '16px' }}>{job.title}</h1>
                <p style={{ lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{job.description}</p>

                <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
                  <div><span className="text-muted text-sm">📍 Ort</span><div className="font-semibold">{job.location}</div></div>
                  <div><span className="text-muted text-sm">💰 Budget</span><div className="font-semibold">{budget}</div></div>
                  <div><span className="text-muted text-sm">📅 Erstellt</span><div className="font-semibold">{new Date(job.created_at).toLocaleDateString('de-DE')}</div></div>
                  <div><span className="text-muted text-sm">💬 Angebote</span><div className="font-semibold">{job.bids?.length || 0}</div></div>
                </div>

                {isOwner && job.status === 'open' && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <Link to={`/jobs/${id}/edit`} className="btn btn-outline btn-sm">✏️ Bearbeiten</Link>
                    <button className="btn btn-danger btn-sm" onClick={cancelJob}>Stornieren</button>
                  </div>
                )}
                {isOwner && job.status === 'in_progress' && (
                  <button className="btn btn-primary btn-sm mt-3" onClick={completeJob}>✅ Als abgeschlossen markieren</button>
                )}
              </div>
            </div>

            {/* Bids */}
            <div className="card">
              <div className="card-header">Angebote ({job.bids?.length || 0})</div>
              <div className="card-body" style={{ padding: 0 }}>
                {job.bids?.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px' }}>
                    <div className="empty-state-icon">💬</div>
                    <h3>Noch keine Angebote</h3>
                    <p>Sei der Erste und gib ein Angebot ab!</p>
                  </div>
                ) : (
                  job.bids.map((bid) => (
                    <div key={bid.id} style={{
                      padding: '16px 20px', borderBottom: '1px solid var(--border)',
                      background: bid.status === 'accepted' ? 'var(--primary-light)' : undefined,
                    }}>
                      <div className="flex-between mb-2">
                        <Link to={`/profile/${bid.craftsman_id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                          <div className="avatar">{bid.craftsman_name?.[0]}</div>
                          <div>
                            <div className="font-semibold" style={{ color: 'var(--text)' }}>{bid.craftsman_name}</div>
                            <StarDisplay rating={bid.craftsman_rating} count={bid.craftsman_reviews} />
                          </div>
                        </Link>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>{bid.amount} €</div>
                          <span className={`badge badge-${bid.status}`} style={{ marginTop: '4px' }}>
                            {bid.status === 'pending' ? 'Ausstehend' : bid.status === 'accepted' ? 'Angenommen' : 'Abgelehnt'}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.6 }}>{bid.message}</p>
                      {isOwner && job.status === 'open' && bid.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => acceptBid(bid.id)}>✅ Annehmen</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => rejectBid(bid.id)}>Ablehnen</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Review section */}
            {job.status === 'completed' && user && (
              <div className="card mt-4">
                <div className="card-header">Bewertung abgeben</div>
                <div className="card-body">
                  {reviewError && <div className="alert alert-error">{reviewError}</div>}
                  <div style={{ marginBottom: '12px' }}>
                    <StarPicker value={reviewForm.rating} onChange={r => setReviewForm(p => ({ ...p, rating: r }))} />
                  </div>
                  <textarea className="form-control" placeholder="Deine Bewertung..." rows={3}
                    value={reviewForm.comment} onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))} />
                  {isOwner && acceptedBid && (
                    <button className="btn btn-primary mt-3" disabled={reviewLoading}
                      onClick={() => submitReview(acceptedBid.craftsman_id)}>
                      Handwerker bewerten
                    </button>
                  )}
                  {!isOwner && acceptedBid?.craftsman_id === user.id && (
                    <button className="btn btn-primary mt-3" disabled={reviewLoading}
                      onClick={() => submitReview(job.customer_id)}>
                      Auftraggeber bewerten
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Customer info */}
            <div className="card mb-4">
              <div className="card-header">Auftraggeber</div>
              <div className="card-body">
                <Link to={`/profile/${job.customer_id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                  <div className="avatar avatar-lg">{job.customer_name?.[0]}</div>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text)', fontSize: '16px' }}>{job.customer_name}</div>
                    <div className="text-muted text-sm">📍 {job.customer_location || 'Nicht angegeben'}</div>
                  </div>
                </Link>
                {user && !isOwner && (
                  <Link to={`/messages/${job.customer_id}?job=${id}`} className="btn btn-outline btn-block mt-3 btn-sm">
                    💬 Nachricht senden
                  </Link>
                )}
              </div>
            </div>

            {/* Bid form for craftsmen */}
            {user?.role === 'craftsman' && job.status === 'open' && !myBid && (
              <div className="card">
                <div className="card-header">Angebot abgeben</div>
                <div className="card-body">
                  {bidError && <div className="alert alert-error">{bidError}</div>}
                  <form onSubmit={submitBid}>
                    <div className="form-group">
                      <label className="form-label">Preis (€)</label>
                      <input type="number" className="form-control" placeholder="z.B. 250"
                        value={bidForm.amount} onChange={e => setBidForm(p => ({ ...p, amount: e.target.value }))}
                        min={1} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nachricht</label>
                      <textarea className="form-control" placeholder="Beschreibe deine Leistung und Erfahrung..."
                        value={bidForm.message} onChange={e => setBidForm(p => ({ ...p, message: e.target.value }))}
                        required rows={4} />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={bidLoading}>
                      {bidLoading ? 'Senden...' : 'Angebot abgeben'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {myBid && (
              <div className="card" style={{ background: 'var(--primary-light)', border: '1.5px solid var(--primary)' }}>
                <div className="card-body">
                  <div className="font-semibold mb-2">Dein Angebot</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>{myBid.amount} €</div>
                  <p className="text-sm text-muted mt-2">{myBid.message}</p>
                  <span className={`badge badge-${myBid.status} mt-2`}>
                    {myBid.status === 'pending' ? 'Ausstehend' : myBid.status === 'accepted' ? '✅ Angenommen' : '❌ Abgelehnt'}
                  </span>
                </div>
              </div>
            )}

            {!user && (
              <div className="card">
                <div className="card-body text-center">
                  <p className="text-muted mb-3">Melde dich an um ein Angebot abzugeben</p>
                  <Link to="/login" className="btn btn-primary btn-block">Anmelden</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .job-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
