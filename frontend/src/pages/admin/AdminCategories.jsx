import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../api/axios';

const EMPTY = { name: '', icon: '🔧', slug: '' };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [msg, setMsg]               = useState('');
  const [error, setError]           = useState('');
  const [form, setForm]             = useState(EMPTY);
  const [editing, setEditing]       = useState(null); // id being edited

  const load = () => {
    setLoading(true);
    api.get('/admin/categories')
      .then(r => setCategories(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const autoSlug = (name) => name.toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm(p => ({ ...p, name, slug: editing ? p.slug : autoSlug(name) }));
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/admin/categories/${editing}`, form);
        setMsg('Kategorie aktualisiert');
        setEditing(null);
      } else {
        await api.post('/admin/categories', form);
        setMsg('Kategorie erstellt');
      }
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler beim Speichern');
    }
  };

  const startEdit = (cat) => {
    setEditing(cat.id);
    setForm({ name: cat.name, icon: cat.icon, slug: cat.slug });
    setError('');
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(EMPTY);
    setError('');
  };

  const deleteCategory = async (id, name, jobCount) => {
    if (jobCount > 0) {
      alert(`Kategorie "${name}" hat noch ${jobCount} Aufträge und kann nicht gelöscht werden.`);
      return;
    }
    if (!confirm(`Kategorie "${name}" wirklich löschen?`)) return;
    await api.delete(`/admin/categories/${id}`);
    setMsg('Kategorie gelöscht');
    load();
  };

  const EMOJI_SUGGESTIONS = ['⚡','🔧','🎨','🏠','🌿','🚛','🔑','🏗️','💻','🧹','🏚️','🛠️','🚿','🪟','🚪','🌡️','🔥','💡','🔨','⛏️','🪚','🧱','🪴','🧰'];

  return (
    <AdminLayout>
      <div style={{ padding: '28px 32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Kategorien</h1>
        <p className="text-muted" style={{ marginBottom: '28px' }}>{categories.length} Kategorien vorhanden</p>

        {msg   && <div className="alert alert-success" onClick={() => setMsg('')}  style={{ cursor: 'pointer' }}>{msg} ✕</div>}

        <div className="grid-2" style={{ gap: '28px', alignItems: 'start' }}>
          {/* Form */}
          <div className="card">
            <div className="card-header">{editing ? '✏️ Kategorie bearbeiten' : '➕ Neue Kategorie'}</div>
            <div className="card-body">
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={save}>
                <div className="form-group">
                  <label className="form-label">Icon (Emoji)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {EMOJI_SUGGESTIONS.map(e => (
                      <button key={e} type="button"
                        onClick={() => setForm(p => ({ ...p, icon: e }))}
                        style={{
                          fontSize: '20px', padding: '4px 8px', border: '2px solid',
                          borderColor: form.icon === e ? 'var(--primary)' : 'var(--border)',
                          borderRadius: 'var(--radius)', background: form.icon === e ? 'var(--primary-light)' : 'transparent',
                          cursor: 'pointer',
                        }}>{e}</button>
                    ))}
                  </div>
                  <input className="form-control" placeholder="Oder eigenes Emoji eingeben"
                    value={form.icon} onChange={set('icon')} required maxLength={4} />
                </div>

                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-control" placeholder="z.B. Elektrik"
                    value={form.name} onChange={handleNameChange} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Slug (URL-Kürzel)</label>
                  <input className="form-control" placeholder="z.B. elektrik"
                    value={form.slug} onChange={set('slug')} required
                    pattern="[a-z0-9\-]+" title="Nur Kleinbuchstaben, Zahlen und Bindestriche" />
                  <div className="form-hint">Nur Kleinbuchstaben, Zahlen und Bindestriche</div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary">
                    {editing ? 'Speichern' : 'Erstellen'}
                  </button>
                  {editing && (
                    <button type="button" className="btn btn-ghost" onClick={cancelEdit}>Abbrechen</button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* List */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header">Alle Kategorien</div>
            {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> : (
              <div>
                {categories.map((cat, i) => (
                  <div key={cat.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 20px',
                    borderBottom: i < categories.length - 1 ? '1px solid var(--border)' : 'none',
                    background: editing === cat.id ? 'var(--primary-light)' : 'transparent',
                  }}>
                    <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{cat.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Slug: <code>{cat.slug}</code> · {cat.job_count} Aufträge
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(cat)} title="Bearbeiten">✏️</button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: cat.job_count > 0 ? 'var(--text-muted)' : 'var(--danger)' }}
                        onClick={() => deleteCategory(cat.id, cat.name, cat.job_count)}
                        title={cat.job_count > 0 ? `Hat ${cat.job_count} Aufträge` : 'Löschen'}
                      >🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
