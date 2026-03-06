import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'
import api from '../utils/api'

export default function Dashboard() {
  const [sotaReport, setSotaReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ posts: 0, scheduled: 0, characters: 0 })
  const workspaceId = localStorage.getItem('workspace_id')

  useEffect(() => {
    if (!workspaceId) return
    Promise.all([
      api.get('/posts/', { params: { workspace_id: workspaceId } }),
      api.get('/characters/', { params: { workspace_id: workspaceId } }),
    ]).then(([posts, chars]) => {
      const postList = posts.data
      setStats({
        posts: postList.length,
        scheduled: postList.filter(p => p.status === 'scheduled').length,
        characters: chars.data.length,
      })
    }).catch(() => {})
  }, [workspaceId])

  const runSotaCheck = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/tools/sota-check')
      setSotaReport(data.report)
    } catch (e) {
      setSotaReport('Error: ' + (e.response?.data?.detail || e.message))
    }
    setLoading(false)
  }

  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 20 }}>Dashboard</h2>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Total Posts</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.posts}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Scheduled</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--info)' }}>{stats.scheduled}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Characters</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)' }}>{stats.characters}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>AI Tools SOTA Check</h3>
          <button className="btn-primary" onClick={runSotaCheck} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={16} />
            {loading ? 'Checking...' : 'Run SOTA Check'}
          </button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
          Queries Gemini to compare current best AI video, image, and voice generation tools.
        </p>
        {sotaReport && (
          <pre style={{
            background: 'var(--bg-primary)',
            padding: 16,
            borderRadius: 8,
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            maxHeight: 500,
            overflowY: 'auto',
          }}>
            {sotaReport}
          </pre>
        )}
      </div>
    </div>
  )
}
