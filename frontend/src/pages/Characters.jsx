import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3 } from 'lucide-react'
import api from '../utils/api'

const emptyChar = {
  name: '', description: '', appearance: '', style: '', voice_id: '',
  metadata: { age: '', ethnicity: '', personality: '', setting: '' },
}

export default function Characters() {
  const [characters, setCharacters] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyChar)
  const [editId, setEditId] = useState(null)
  const workspaceId = localStorage.getItem('workspace_id')

  const load = () => {
    if (!workspaceId) return
    api.get('/characters/', { params: { workspace_id: workspaceId } })
      .then(r => setCharacters(r.data))
      .catch(() => {})
  }

  useEffect(load, [workspaceId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { ...form, workspace_id: parseInt(workspaceId) }
    if (editId) {
      await api.put(`/characters/${editId}`, payload)
    } else {
      await api.post('/characters/', payload)
    }
    setShowForm(false)
    setForm(emptyChar)
    setEditId(null)
    load()
  }

  const startEdit = (char) => {
    setForm({
      name: char.name || '',
      description: char.description || '',
      appearance: char.appearance || '',
      style: char.style || '',
      voice_id: char.voice_id || '',
      metadata: char.metadata || { age: '', ethnicity: '', personality: '', setting: '' },
    })
    setEditId(char.id)
    setShowForm(true)
  }

  const deleteChar = async (id) => {
    await api.delete(`/characters/${id}`)
    load()
  }

  if (!workspaceId) return <p style={{ color: 'var(--text-secondary)' }}>Select a workspace first.</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24 }}>Characters</h2>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyChar) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> New Character
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 20 }}>
          <div className="grid-2" style={{ marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Voice ID</label>
              <input value={form.voice_id} onChange={e => setForm({ ...form, voice_id: e.target.value })}
                placeholder="ElevenLabs voice ID" />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="General description of this character" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Appearance</label>
            <textarea rows={3} value={form.appearance} onChange={e => setForm({ ...form, appearance: e.target.value })}
              placeholder="Detailed appearance: hair color/style, eye color, skin tone, face shape, body type, distinguishing features..." />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Fashion/Aesthetic Style</label>
            <textarea rows={2} value={form.style} onChange={e => setForm({ ...form, style: e.target.value })}
              placeholder="Streetwear, minimalist, business casual, athleisure..." />
          </div>
          <div className="grid-2" style={{ marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Age</label>
              <input value={form.metadata.age} onChange={e => setForm({ ...form, metadata: { ...form.metadata, age: e.target.value } })}
                placeholder="e.g., mid-20s" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ethnicity</label>
              <input value={form.metadata.ethnicity} onChange={e => setForm({ ...form, metadata: { ...form.metadata, ethnicity: e.target.value } })} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Personality</label>
              <input value={form.metadata.personality} onChange={e => setForm({ ...form, metadata: { ...form.metadata, personality: e.target.value } })}
                placeholder="Energetic, chill, professional..." />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Typical Setting</label>
              <input value={form.metadata.setting} onChange={e => setForm({ ...form, metadata: { ...form.metadata, setting: e.target.value } })}
                placeholder="Urban, gym, office, outdoor..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn-primary">{editId ? 'Update' : 'Create'} Character</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {characters.map(char => (
          <div key={char.id} className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>{char.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{char.description}</p>
              {char.appearance && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {char.appearance.substring(0, 100)}...
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <button className="btn-secondary" onClick={() => startEdit(char)} style={{ padding: '6px 10px' }}>
                <Edit3 size={14} />
              </button>
              <button className="btn-danger" onClick={() => deleteChar(char.id)} style={{ padding: '6px 10px' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {characters.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
            No characters yet. Create one to get started.
          </p>
        )}
      </div>
    </div>
  )
}
