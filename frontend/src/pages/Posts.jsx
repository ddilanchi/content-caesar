import { useState, useEffect, useRef } from 'react'
import { Send, Clock, FileDown, Trash2, X, Loader, DollarSign } from 'lucide-react'
import api from '../utils/api'

function fmtCost(n) {
  if (n == null) return null
  return n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`
}

const statusColors = {
  draft: 'var(--text-secondary)',
  scheduled: 'var(--info)',
  posted: 'var(--success)',
  failed: 'var(--danger)',
  generating: '#f59e0b',
}

function mediaUrl(filePath) {
  if (!filePath) return null
  const filename = filePath.replace(/\\/g, '/').split('/').pop()
  return `http://localhost:8000/api/media/${filename}`
}

function Spinner() {
  return (
    <div style={{
      width: 80, height: 80, flexShrink: 0, borderRadius: 6,
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Loader size={24} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  )
}

export default function Posts() {
  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const workspaceId = localStorage.getItem('workspace_id')
  const pollRef = useRef(null)

  const load = () => {
    if (!workspaceId) return
    const params = { workspace_id: workspaceId }
    if (filter) params.status = filter
    api.get('/posts/', { params }).then(r => {
      setPosts(r.data)
      // Auto-poll while any post is generating
      const hasGenerating = r.data.some(p => p.status === 'generating')
      if (hasGenerating && !pollRef.current) {
        pollRef.current = setInterval(load, 3000)
      } else if (!hasGenerating && pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }).catch(() => {})
  }

  useEffect(() => {
    load()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [workspaceId, filter])

  const deletePost = async (id) => {
    await api.delete(`/posts/${id}`)
    load()
  }

  const publishPost = async (id, platform) => {
    try {
      const { data } = await api.post(`/social/post/${id}`, null, { params: { platform } })
      alert(data.message || 'Published!')
      load()
    } catch (e) {
      alert('Error: ' + (e.response?.data?.detail || e.message))
    }
  }

  if (!workspaceId) return <p style={{ color: 'var(--text-secondary)' }}>Select a workspace first.</p>

  const generating = posts.filter(p => p.status === 'generating')

  return (
    <div>
      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute', top: 16, right: 16, background: 'none',
            border: 'none', color: '#fff', cursor: 'pointer',
          }}><X size={28} /></button>
          {lightbox.type === 'image'
            ? <img src={lightbox.url} alt="preview" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
            : <video src={lightbox.url} controls autoPlay style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
          }
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24 }}>Posts</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'draft', 'generating', 'scheduled', 'posted', 'failed'].map(s => (
            <button key={s} className={filter === s ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setFilter(s)} style={{ fontSize: 12, padding: '6px 12px' }}>
              {s || 'All'}
              {s === 'generating' && generating.length > 0 && (
                <span style={{
                  marginLeft: 5, background: '#f59e0b', color: '#000',
                  borderRadius: 10, fontSize: 10, padding: '1px 5px', fontWeight: 700,
                }}>{generating.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Generating banner */}
      {generating.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          padding: '10px 16px', borderRadius: 8,
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
        }}>
          <Loader size={16} color="#f59e0b" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#f59e0b' }}>
            {generating.length} post{generating.length > 1 ? 's' : ''} generating... checking every 3s
          </span>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map(post => {
          const url = mediaUrl(post.file_path)
          const isVideo = post.content_type === 'video' || post.content_type === 'slideshow'
          const isGenerating = post.status === 'generating'
          return (
            <div key={post.id} className="card" style={isGenerating ? { borderColor: 'rgba(245,158,11,0.4)' } : {}}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Thumbnail or spinner */}
                {isGenerating ? (
                  <Spinner />
                ) : url ? (
                  <div onClick={() => setLightbox({ url, type: isVideo ? 'video' : 'image' })}
                    style={{ flexShrink: 0, cursor: 'pointer', borderRadius: 6, overflow: 'hidden', width: 80, height: 80 }}>
                    {isVideo
                      ? <video src={url} style={{ width: 80, height: 80, objectFit: 'cover' }} />
                      : <img src={url} alt="thumb" style={{ width: 80, height: 80, objectFit: 'cover' }} />
                    }
                  </div>
                ) : null}

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                      color: statusColors[post.status] || 'var(--text-secondary)',
                      background: `${statusColors[post.status] || 'var(--text-secondary)'}22`,
                      padding: '2px 8px', borderRadius: 4,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      {isGenerating && <Loader size={10} style={{ animation: 'spin 1s linear infinite' }} />}
                      {post.status}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{post.content_type}</span>
                    {fmtCost(post.cost_usd) && (
                      <span style={{
                        fontSize: 11, display: 'flex', alignItems: 'center', gap: 2,
                        color: 'var(--accent)', background: 'rgba(201,162,39,0.12)',
                        padding: '2px 7px', borderRadius: 4, fontWeight: 600,
                      }}>
                        <DollarSign size={9} />{fmtCost(post.cost_usd)}
                      </span>
                    )}
                    {post.scheduled_at && (
                      <span style={{ fontSize: 12, color: 'var(--info)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {new Date(post.scheduled_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 14 }}>{post.title || post.prompt?.substring(0, 100) || 'Untitled'}</p>
                  {post.caption && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{post.caption}</p>
                  )}
                  {isGenerating && (
                    <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>
                      Safe to leave this page — generation runs in the background.
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {url && (
                    <a href={url} download style={{ textDecoration: 'none' }}>
                      <button className="btn-secondary" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FileDown size={12} />
                      </button>
                    </a>
                  )}
                  {post.status === 'draft' && url && (
                    <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={() => publishPost(post.id, 'tiktok')}>
                      <Send size={12} /> Post
                    </button>
                  )}
                  {!isGenerating && (
                    <button className="btn-danger" onClick={() => deletePost(post.id)} style={{ padding: '6px 10px' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {posts.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
            No posts yet. Generate some content first.
          </p>
        )}

        {/* Cost footer */}
        {posts.some(p => p.cost_usd != null) && (
          <div style={{
            marginTop: 8, padding: '12px 16px', borderRadius: 8,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {posts.filter(p => p.cost_usd != null).length} priced posts shown
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>
              Total: {fmtCost(posts.reduce((sum, p) => sum + (p.cost_usd || 0), 0))}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
