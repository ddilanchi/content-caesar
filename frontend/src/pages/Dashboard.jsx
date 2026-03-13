import { useState, useEffect } from 'react'
import { Zap, DollarSign, TrendingUp } from 'lucide-react'
import api from '../utils/api'

function fmt(n) {
  if (n == null) return '—'
  return n === 0 ? '$0.00' : n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`
}

function CostCard({ label, data }) {
  if (!data) return null
  return (
    <div style={{ flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>{fmt(data.total_usd)}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{data.count} generations</div>
      {data.by_type && Object.entries(data.by_type).length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Object.entries(data.by_type).map(([type, cost]) => (
            <div key={type} style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{type}</span>
              <span>{fmt(cost)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [sotaReport, setSotaReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ posts: 0, scheduled: 0, characters: 0 })
  const [costs, setCosts] = useState(null)
  const workspaceId = localStorage.getItem('workspace_id')

  useEffect(() => {
    if (!workspaceId) return
    Promise.all([
      api.get('/posts/', { params: { workspace_id: workspaceId } }),
      api.get('/characters/', { params: { workspace_id: workspaceId } }),
      api.get('/posts/costs/summary', { params: { workspace_id: workspaceId } }),
    ]).then(([posts, chars, costsRes]) => {
      const postList = posts.data
      setStats({
        posts: postList.length,
        scheduled: postList.filter(p => p.status === 'scheduled').length,
        characters: chars.data.length,
      })
      setCosts(costsRes.data)
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

      {/* Stats row */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
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

      {/* Cost tracker */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <DollarSign size={16} color="var(--accent)" />
          <h3 style={{ fontSize: 16 }}>Generation Costs</h3>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            (Nano Banana 2: $0.067/img · Kling 3.0: $0.168/sec)
          </span>
        </div>
        {costs ? (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <CostCard label="Today" data={costs.today} />
            <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
            <CostCard label="This Week" data={costs.this_week} />
            <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
            <CostCard label="This Month" data={costs.this_month} />
            <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
            <CostCard label="All Time" data={costs.all_time} />
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No cost data yet — generate some content first.</p>
        )}
      </div>

      {/* SOTA check */}
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
            background: 'var(--bg-primary)', padding: 16, borderRadius: 8,
            fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
            maxHeight: 500, overflowY: 'auto',
          }}>
            {sotaReport}
          </pre>
        )}
      </div>
    </div>
  )
}
