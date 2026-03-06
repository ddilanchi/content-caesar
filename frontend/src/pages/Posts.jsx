import { useState, useEffect } from 'react'
import { Send, Clock, FileDown, Trash2 } from 'lucide-react'
import api from '../utils/api'

const statusColors = {
  draft: 'var(--text-secondary)',
  scheduled: 'var(--info)',
  posted: 'var(--success)',
  failed: 'var(--danger)',
}

export default function Posts() {
  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState('')
  const workspaceId = localStorage.getItem('workspace_id')

  const load = () => {
    if (!workspaceId) return
    const params = { workspace_id: workspaceId }
    if (filter) params.status = filter
    api.get('/posts/', { params }).then(r => setPosts(r.data)).catch(() => {})
  }

  useEffect(load, [workspaceId, filter])

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24 }}>Posts</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'draft', 'scheduled', 'posted'].map(s => (
            <button key={s} className={filter === s ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setFilter(s)} style={{ fontSize: 12, padding: '6px 12px' }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map(post => (
          <div key={post.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                    color: statusColors[post.status] || 'var(--text-secondary)',
                    background: `${statusColors[post.status] || 'var(--text-secondary)'}20`,
                    padding: '2px 8px', borderRadius: 4,
                  }}>
                    {post.status}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{post.content_type}</span>
                  {post.scheduled_at && (
                    <span style={{ fontSize: 12, color: 'var(--info)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {new Date(post.scheduled_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 14 }}>{post.title || post.prompt?.substring(0, 80) || 'Untitled'}</p>
                {post.caption && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{post.caption}</p>
                )}
                {post.target_platforms && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    {post.target_platforms.map(p => (
                      <span key={p} style={{
                        fontSize: 11, padding: '2px 6px', borderRadius: 4,
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      }}>{p}</span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {post.status === 'draft' && post.file_path && (
                  <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => publishPost(post.id, 'tiktok')}>
                    <Send size={12} /> Post
                  </button>
                )}
                <button className="btn-danger" onClick={() => deletePost(post.id)} style={{ padding: '6px 10px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
            No posts yet. Generate some content first.
          </p>
        )}
      </div>
    </div>
  )
}
