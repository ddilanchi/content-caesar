import { useState, useEffect } from 'react'
import { Wand2, ChevronDown, ChevronUp, Zap, Pin, Download, Sparkles, FileText, Copy, Check, RefreshCw } from 'lucide-react'
import api from '../utils/api'

const TEMPLATES = [
  {
    label: 'Unboxing Reaction',
    content_type: 'video',
    style: 'casual_phone',
    aspect_ratio: '9:16',
    duration: 15,
    prompt: 'Person excitedly unboxing a product for the first time. Genuine surprised reaction, hands pulling product out of packaging, close-up of product reveal. Natural home setting, cozy lighting. Authentic UGC feel.',
  },
  {
    label: 'Before / After',
    content_type: 'video',
    style: 'casual_phone',
    aspect_ratio: '9:16',
    duration: 15,
    prompt: 'Split before/after transformation video. Left side shows problem, right side shows result after using product. Text overlay: "Before" and "After". Fast cut transition. Authentic UGC style.',
  },
  {
    label: 'Product Demo',
    content_type: 'video',
    style: 'casual_phone',
    aspect_ratio: '9:16',
    duration: 15,
    prompt: 'Casual hands-on product demonstration. Person showing key features up close, gesturing at product, talking to camera. Kitchen/desk/bathroom setting appropriate to product. Bright natural light.',
  },
  {
    label: 'Talking Head Testimonial',
    content_type: 'video',
    style: 'casual_phone',
    aspect_ratio: '9:16',
    duration: 15,
    prompt: 'Person looking directly into camera giving honest testimonial about a product they love. Conversational tone, casual outfit, home background. Hand gestures for emphasis. Relatable and genuine.',
  },
  {
    label: 'POV Experience',
    content_type: 'video',
    style: 'casual_phone',
    aspect_ratio: '9:16',
    duration: 10,
    prompt: 'First-person POV shot using a product in everyday life. Camera moves like the user is actually using it. Text overlay: "POV: You just tried [product]". Immersive, authentic perspective.',
  },
  {
    label: 'Lifestyle Shot',
    content_type: 'image',
    style: 'aesthetic',
    aspect_ratio: '1:1',
    duration: 15,
    prompt: 'Lifestyle product photo. Product naturally placed in a beautiful real-life setting. Soft natural light, tasteful composition. Person interacting with product casually. Instagram-worthy but candid feel.',
  },
  {
    label: 'Green Flag / Red Flag',
    content_type: 'video',
    style: 'casual_phone',
    aspect_ratio: '9:16',
    duration: 15,
    prompt: 'Trending green flag red flag format. Green flag scenes of using the product correctly and getting good results. Red flag scenes of common mistakes. Fast cuts with text overlays. Hook in first 2 seconds.',
  },
  {
    label: 'Pinterest Product Carousel',
    content_type: 'slideshow',
    style: 'aesthetic',
    aspect_ratio: '2:3',
    duration: 15,
    prompt: 'Series of aesthetic product photos from multiple angles. Soft pastel background, clean composition, styled flat lay. Each slide highlights a different product feature or use case. Pinterest-optimized vertical format.',
  },
  {
    label: '3 Reasons Why',
    content_type: 'video',
    style: 'casual_phone',
    aspect_ratio: '9:16',
    duration: 15,
    prompt: 'Fast-paced "3 reasons why you need this product" video. Numbered text overlays (1, 2, 3) with quick cuts showing each reason. Energetic pace. Hook: "I cannot believe I lived without this". Ends with product close-up.',
  },
  {
    label: 'ASMR Unboxing',
    content_type: 'video',
    style: 'professional',
    aspect_ratio: '9:16',
    duration: 15,
    prompt: 'Satisfying ASMR-style unboxing. Slow deliberate movements, close-ups of textures and packaging details, tissue paper rustling sounds implied visually. Clean white/marble surface. Very satisfying and tactile.',
  },
]

export default function Generate() {
  const [characters, setCharacters] = useState([])
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [showTemplates, setShowTemplates] = useState(true)
  const [pinterest, setPinterest] = useState({ url: '', num: 20, importing: false, result: null })
  const [scriptTool, setScriptTool] = useState({
    productName: '', productDescription: '', targetAudience: '', platform: 'tiktok',
    format: 'ugc_ad', duration: 30,
    hooks: null, script: null, loading: false, copied: null,
  })
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

  const generateHooks = async () => {
    setScriptTool(s => ({ ...s, loading: 'hooks', hooks: null }))
    try {
      const { data } = await api.post('/scripts/hooks', {
        product_name: scriptTool.productName,
        product_description: scriptTool.productDescription,
        target_audience: scriptTool.targetAudience || undefined,
        platform: scriptTool.platform,
      })
      setScriptTool(s => ({ ...s, loading: false, hooks: data.hooks }))
    } catch (e) {
      setScriptTool(s => ({ ...s, loading: false, hooks: ['Error: ' + (e.response?.data?.detail || e.message)] }))
    }
  }

  const generateScript = async () => {
    setScriptTool(s => ({ ...s, loading: 'script', script: null }))
    try {
      const { data } = await api.post('/scripts/script', {
        product_name: scriptTool.productName,
        product_description: scriptTool.productDescription,
        target_audience: scriptTool.targetAudience || undefined,
        platform: scriptTool.platform,
        format: scriptTool.format,
        duration_sec: scriptTool.duration,
      })
      setScriptTool(s => ({ ...s, loading: false, script: data }))
    } catch (e) {
      setScriptTool(s => ({ ...s, loading: false, script: { error: e.response?.data?.detail || e.message } }))
    }
  }

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text)
    setScriptTool(s => ({ ...s, copied: key }))
    setTimeout(() => setScriptTool(s => ({ ...s, copied: null })), 1500)
  }

  const applyTemplate = (t) => {
    setForm(f => ({ ...f, content_type: t.content_type, style: t.style, aspect_ratio: t.aspect_ratio, duration: t.duration, prompt: t.prompt }))
    setShowTemplates(false)
  }

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

  const handlePinterestImport = async (e) => {
    e.preventDefault()
    setPinterest(p => ({ ...p, importing: true, result: null }))
    try {
      const { data } = await api.post('/pinterest/import', {
        workspace_id: parseInt(workspaceId),
        board_url: pinterest.url,
        num_images: pinterest.num,
      })
      setPinterest(p => ({ ...p, importing: false, result: { success: true, count: data.imported } }))
    } catch (err) {
      setPinterest(p => ({ ...p, importing: false, result: { error: err.response?.data?.detail || err.message } }))
    }
  }

  if (!workspaceId) return <p style={{ color: 'var(--text-secondary)' }}>Select a workspace first.</p>

  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 20 }}>Generate Content</h2>

      {/* Templates */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setShowTemplates(v => !v)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color="var(--accent)" />
            <h3 style={{ fontSize: 16 }}>UGC Templates</h3>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{TEMPLATES.length} ready-to-use</span>
          </div>
          {showTemplates ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {showTemplates && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {TEMPLATES.map(t => (
              <button key={t.label} onClick={() => applyTemplate(t)} className="btn-secondary"
                style={{ fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 10, padding: '1px 5px', borderRadius: 3,
                  background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                  textTransform: 'uppercase', fontWeight: 600,
                }}>{t.content_type}</span>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pinterest Import */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Pin size={16} color="#e60023" />
          <h3 style={{ fontSize: 16 }}>Import from Pinterest Board</h3>
        </div>
        <form onSubmit={handlePinterestImport} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Board URL</label>
            <input value={pinterest.url} onChange={e => setPinterest(p => ({ ...p, url: e.target.value }))}
              placeholder="https://pinterest.com/username/board-name/" required />
          </div>
          <div style={{ width: 80 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Count</label>
            <input type="number" value={pinterest.num} min={1} max={100}
              onChange={e => setPinterest(p => ({ ...p, num: parseInt(e.target.value) }))} />
          </div>
          <button type="submit" className="btn-primary" disabled={pinterest.importing}
            style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <Download size={14} />
            {pinterest.importing ? 'Importing...' : 'Import'}
          </button>
        </form>
        {pinterest.result && (
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 6, fontSize: 13,
            background: pinterest.result.error ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)',
            border: `1px solid ${pinterest.result.error ? 'var(--danger)' : 'var(--success)'}`,
          }}>
            {pinterest.result.error
              ? <span style={{ color: 'var(--danger)' }}>{pinterest.result.error}</span>
              : <span style={{ color: 'var(--success)' }}>Imported {pinterest.result.count} images — check Posts page.</span>
            }
          </div>
        )}
      </div>

      {/* Script Tools */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Sparkles size={16} color="var(--accent)" />
          <h3 style={{ fontSize: 16 }}>Hook & Script Generator</h3>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>AI-written hooks and full video scripts</span>
        </div>

        <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Product Name</label>
            <input value={scriptTool.productName}
              onChange={e => setScriptTool(s => ({ ...s, productName: e.target.value }))}
              placeholder="e.g. Pareto Protein Bar" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Target Audience (optional)</label>
            <input value={scriptTool.targetAudience}
              onChange={e => setScriptTool(s => ({ ...s, targetAudience: e.target.value }))}
              placeholder="e.g. gym bros aged 18-30" />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Product Description</label>
          <textarea rows={2} value={scriptTool.productDescription}
            onChange={e => setScriptTool(s => ({ ...s, productDescription: e.target.value }))}
            placeholder="What does it do, what problem does it solve, what makes it different?" />
        </div>

        <div className="grid-2" style={{ gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Script Format</label>
            <select value={scriptTool.format} onChange={e => setScriptTool(s => ({ ...s, format: e.target.value }))}>
              <option value="ugc_ad">UGC Ad (Hook → Problem → Solution → CTA)</option>
              <option value="testimonial">Testimonial (Story → Discovery → Results)</option>
              <option value="tutorial">Tutorial (Hook → Steps → Result → CTA)</option>
              <option value="problem_solution">Problem/Solution</option>
            </select>
          </div>
          <div className="grid-2" style={{ gap: 8 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Platform</label>
              <select value={scriptTool.platform} onChange={e => setScriptTool(s => ({ ...s, platform: e.target.value }))}>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube Shorts</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Duration (sec)</label>
              <input type="number" value={scriptTool.duration} min={10} max={120}
                onChange={e => setScriptTool(s => ({ ...s, duration: parseInt(e.target.value) }))} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn-secondary"
            disabled={!scriptTool.productName || !scriptTool.productDescription || scriptTool.loading === 'hooks'}
            onClick={generateHooks}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Zap size={14} />
            {scriptTool.loading === 'hooks' ? 'Generating...' : 'Generate Hooks'}
          </button>
          <button type="button" className="btn-primary"
            disabled={!scriptTool.productName || !scriptTool.productDescription || scriptTool.loading === 'script'}
            onClick={generateScript}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <FileText size={14} />
            {scriptTool.loading === 'script' ? 'Writing Script...' : 'Write Full Script'}
          </button>
        </div>

        {/* Hooks output */}
        {scriptTool.hooks && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={12} /> Hook options — click to copy or use as prompt
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {scriptTool.hooks.map((hook, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 6, gap: 10,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  cursor: 'pointer',
                }} onClick={() => setForm(f => ({ ...f, prompt: hook }))}>
                  <span style={{ fontSize: 13, flex: 1 }}>{hook}</span>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button type="button" className="btn-secondary"
                      style={{ padding: '3px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}
                      onClick={e => { e.stopPropagation(); copyText(hook, `hook-${i}`) }}>
                      {scriptTool.copied === `hook-${i}` ? <Check size={10} /> : <Copy size={10} />}
                    </button>
                    <button type="button" className="btn-primary"
                      style={{ padding: '3px 8px', fontSize: 11 }}
                      onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, prompt: hook })) }}>
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="btn-secondary" onClick={generateHooks}
              style={{ marginTop: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={12} /> Regenerate
            </button>
          </div>
        )}

        {/* Script output */}
        {scriptTool.script && !scriptTool.script.error && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={12} /> Full script — ~{scriptTool.script.estimated_seconds}s
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="btn-secondary"
                  style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => copyText(scriptTool.script.full_script, 'script')}>
                  {scriptTool.copied === 'script' ? <Check size={10} /> : <Copy size={10} />}
                  {scriptTool.copied === 'script' ? 'Copied!' : 'Copy All'}
                </button>
                <button type="button" className="btn-primary"
                  style={{ fontSize: 11 }}
                  onClick={() => setForm(f => ({ ...f, prompt: scriptTool.script.full_script }))}>
                  Use as Prompt
                </button>
              </div>
            </div>
            {scriptTool.script.sections?.map((section, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  color: 'var(--accent)', marginBottom: 4, letterSpacing: 1,
                }}>{section.label}</div>
                {section.lines?.map((line, j) => (
                  <div key={j} style={{
                    fontSize: 13, lineHeight: 1.6, padding: '2px 0',
                    color: line.startsWith('[VISUAL') ? 'var(--text-secondary)' : 'var(--text-primary)',
                    fontStyle: line.startsWith('[VISUAL') ? 'italic' : 'normal',
                  }}>{line}</div>
                ))}
              </div>
            ))}
          </div>
        )}
        {scriptTool.script?.error && (
          <div style={{ marginTop: 12, color: 'var(--danger)', fontSize: 13 }}>{scriptTool.script.error}</div>
        )}
      </div>

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
              <textarea rows={6} value={form.prompt} onChange={e => setForm({ ...form, prompt: e.target.value })}
                placeholder="Describe what you want to generate, or pick a template above..." required />
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
                {generating ? 'Queuing...' : 'Generate'}
              </button>
            </div>

            {result && (
              <div style={{
                marginTop: 16, padding: 12, borderRadius: 8,
                background: result.error ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)',
                border: `1px solid ${result.error ? 'var(--danger)' : 'var(--success)'}`,
                fontSize: 13,
              }}>
                {result.error
                  ? <span style={{ color: 'var(--danger)' }}>{result.error}</span>
                  : <span style={{ color: 'var(--success)' }}>Queued! Check Posts page to see progress.</span>
                }
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
