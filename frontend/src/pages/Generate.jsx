import { useState, useEffect } from 'react'
import { Wand2 } from 'lucide-react'
import api from '../utils/api'

export default function Generate() {
  const [characters, setCharacters] = useState([])
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const workspaceId = localStorage.getItem('workspace_id')

  const [form, setForm] = useState({
    content_type: 'video',
    character_id: '',
    prompt: '',
    style: 'casual_phone',
    duration: 15,
    aspect_ratio: '9:16',
    add_captions: true,
    caption_style: 'word_by_word',
    music_track: '',
    video_artifacts: true,
  })

  useEffect(() => {
    if (!workspaceId) return
    api.get('/characters/', { params: { workspace_id: workspaceId } })
      .then(r => setCharacters(r.data)).catch(() => {})
  }, [workspaceId])

  const handleGenerate = async (e) => {
    e.preventDefault()
    setGenerating(true)
    setResult(null)
    try {
      const payload = {
        ...form,
        workspace_id: parseInt(workspaceId),
        character_id: form.character_id ? parseInt(form.character_id) : null,
      }
      const { data } = await api.post('/generate/', payload)
      setResult(data)
    } catch (e) {
      setResult({ error: e.response?.data?.detail || e.message })
    }
    setGenerating(false)
  }

  if (!workspaceId) return <p style={{ color: 'var(--text-secondary)' }}>Select a workspace first.</p>

  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 20 }}>Generate Content</h2>

      <form onSubmit={handleGenerate}>
        <div className="grid-2" style={{ gap: 20 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>Content Settings</h3>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Content Type</label>
              <select value={form.content_type} onChange={e => setForm({ ...form, content_type: e.target.value })}>
                <option value="video">Video (TikTok/Reels)</option>
                <option value="slideshow">Slideshow (Pinterest/Carousel)</option>
                <option value="image">Single Image</option>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Character (optional)</label>
              <select value={form.character_id} onChange={e => setForm({ ...form, character_id: e.target.value })}>
                <option value="">No character</option>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Prompt</label>
              <textarea rows={5} value={form.prompt} onChange={e => setForm({ ...form, prompt: e.target.value })}
                placeholder="Describe what you want to generate..." required />
            </div>

            <div className="grid-2" style={{ marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Style</label>
                <select value={form.style} onChange={e => setForm({ ...form, style: e.target.value })}>
                  <option value="casual_phone">Casual Phone (UGC)</option>
                  <option value="professional">Professional</option>
                  <option value="cinematic">Cinematic</option>
                  <option value="aesthetic">Aesthetic</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Aspect Ratio</label>
                <select value={form.aspect_ratio} onChange={e => setForm({ ...form, aspect_ratio: e.target.value })}>
                  <option value="9:16">9:16 (Shorts/Reels)</option>
                  <option value="16:9">16:9 (YouTube)</option>
                  <option value="1:1">1:1 (Instagram)</option>
                  <option value="2:3">2:3 (Pinterest)</option>
                </select>
              </div>
            </div>

            {form.content_type === 'video' && (
              <div className="grid-2" style={{ marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Duration (sec)</label>
                  <input type="number" value={form.duration}
                    onChange={e => setForm({ ...form, duration: parseInt(e.target.value) })}
                    min={5} max={180} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 18 }}>
                  <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={form.video_artifacts}
                      onChange={e => setForm({ ...form, video_artifacts: e.target.checked })} />
                    Phone video artifacts
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>Captions & Music</h3>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={form.add_captions}
                  onChange={e => setForm({ ...form, add_captions: e.target.checked })} />
                Add captions
              </label>
            </div>

            {form.add_captions && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Caption Style</label>
                <select value={form.caption_style} onChange={e => setForm({ ...form, caption_style: e.target.value })}>
                  <option value="word_by_word">Word-by-word (trending)</option>
                  <option value="sentence">Full sentence</option>
                </select>
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Music Track</label>
              <input value={form.music_track} onChange={e => setForm({ ...form, music_track: e.target.value })}
                placeholder="Path to audio file or leave blank" />
            </div>

            <div style={{ marginTop: 24 }}>
              <button type="submit" className="btn-primary" disabled={generating}
                style={{ width: '100%', padding: 12, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Wand2 size={20} />
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>

            {result && (
              <div style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 8,
                background: result.error ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)',
                border: `1px solid ${result.error ? 'var(--danger)' : 'var(--success)'}`,
                fontSize: 13,
              }}>
                {result.error
                  ? <span style={{ color: 'var(--danger)' }}>{result.error}</span>
                  : <span style={{ color: 'var(--success)' }}>Generated! Post ID: {result.post_id}</span>
                }
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
