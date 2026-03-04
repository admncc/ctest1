import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Messages() {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('job');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages]           = useState([]);
  const [otherUser, setOtherUser]         = useState(null);
  const [text, setText]                   = useState('');
  const [loading, setLoading]             = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/messages/conversations').then(r => setConversations(r.data));
  }, [user]);

  useEffect(() => {
    if (!userId) return;
    api.get(`/users/${userId}`).then(r => setOtherUser(r.data));
    fetchMessages();
  }, [userId]);

  const fetchMessages = () => {
    if (!userId) return;
    api.get(`/messages/${userId}`).then(r => setMessages(r.data));
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      await api.post('/messages', { receiver_id: Number(userId), content: text, job_id: jobId ? Number(jobId) : null });
      setText('');
      fetchMessages();
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title mb-4">Nachrichten</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', height: '600px' }} className="messages-grid">

          {/* Conversations list */}
          <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">Gespräche</div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {conversations.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  Noch keine Gespräche
                </div>
              ) : (
                conversations.map(c => (
                  <Link
                    key={c.other_user_id}
                    to={`/messages/${c.other_user_id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px 16px', borderBottom: '1px solid var(--border)',
                      textDecoration: 'none', color: 'inherit',
                      background: c.other_user_id === Number(userId) ? 'var(--primary-light)' : 'transparent',
                    }}
                  >
                    <div className="avatar">{c.other_user_name?.[0]}</div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{c.other_user_name}</div>
                      <div style={{
                        fontSize: '12px', color: 'var(--text-muted)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{c.last_message}</div>
                    </div>
                    {c.unread_count > 0 && (
                      <span style={{
                        background: 'var(--primary)', color: 'white',
                        borderRadius: '999px', padding: '1px 8px', fontSize: '11px', fontWeight: 700,
                      }}>{c.unread_count}</span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!userId ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Wähle ein Gespräch aus
              </div>
            ) : (
              <>
                {otherUser && (
                  <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="avatar">{otherUser.name?.[0]}</div>
                    <Link to={`/profile/${userId}`} style={{ color: 'var(--text)' }}>
                      {otherUser.name}
                    </Link>
                    {jobId && <span className="badge badge-pending text-sm">Auftrag #{jobId}</span>}
                  </div>
                )}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                      Schreibe die erste Nachricht...
                    </div>
                  )}
                  {messages.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: m.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
                      <div>
                        <div className={`message-bubble ${m.sender_id === user.id ? 'sent' : 'received'}`}>
                          {m.content}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px',
                          textAlign: m.sender_id === user.id ? 'right' : 'left' }}>
                          {new Date(m.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px' }}>
                  <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      className="form-control"
                      placeholder="Nachricht schreiben..."
                      value={text}
                      onChange={e => setText(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading || !text.trim()}>
                      Senden
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) { .messages-grid { grid-template-columns: 1fr !important; height: auto !important; } }
      `}</style>
    </div>
  );
}
