import { useState, useEffect } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import api from '../utils/api'

export default function Settings() {
  const [workspaces, setWorkspaces] = useState([])
  const [tools, setTools] = useState([])
  const [accounts, setAccounts] = useState([])
  const [newWs, setNewWs] = useState({ name: '', description: '' })
  const [newTool, setNewTool] = useState({ tool_name: '', category: 'video', api_key: '' })
  const [newAccount, setNewAccount] = useState({ platform: 'tiktok', account_name: '', access_token: '' })
  const workspaceId = localStorage.getItem('workspace_id')

  const load = () => {
    api.get('/workspaces/').then(r => setWorkspaces(r.data)).catch(() => {})
    api.get('/tools/').then(r => setTools(r.data)).catch(() => {})
    if (workspaceId) {
      api.get('/social/accounts', { params: { workspace_id: workspaceId } })
        .then(r => setAccounts(r.data)).catch(() => {})
    }
  }

  useEffect(load, [workspaceId])

  const addWorkspace = async (e) => {
    e.preventDefault()
    await api.post('/workspaces/', newWs)
    setNewWs({ name: '', description: '' })
    load()
    window.dispatchEvent(new Event('workspaces-updated'))
  }

  const addTool = async (e) => {
    e.preventDefault()
    await api.post('/tools/', newTool)
    setNewTool({ tool_name: '', category: 'video', api_key: '' })
    load()
  }

  const addAccount = async (e) => {
    e.preventDefault()
    await api.post('/social/accounts', { ...newAccount, workspace_id: parseInt(workspaceId) })
    setNewAccount({ platform: 'tiktok', account_name: '', access_token: '' })
    load()
  }

  const deleteWorkspace = async (id) => {
    await api.delete(`/workspaces/${id}`)
    load()
    window.dispatchEvent(new Event('workspaces-updated'))
  }

  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 20 }}>Settings</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Workspaces */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Workspaces</h3>
          <form onSubmit={addWorkspace} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input placeholder="Name" value={newWs.name} onChange={e => setNewWs({ ...newWs, name: e.target.value })} required style={{ flex: 1 }} />
            <input placeholder="Description" value={newWs.description} onChange={e => setNewWs({ ...newWs, description: e.target.value })} style={{ flex: 2 }} />
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> Add
            </button>
          </form>
          {workspaces.map(ws => (
            <div key={ws.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span>{ws.name} <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>- {ws.description}</span></span>
              <button className="btn-danger" onClick={() => deleteWorkspace(ws.id)} style={{ padding: '4px 8px' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* AI Tools */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>AI Tool API Keys</h3>
          <form onSubmit={addTool} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input placeholder="Tool name (e.g., gemini)" value={newTool.tool_name}
              onChange={e => setNewTool({ ...newTool, tool_name: e.target.value })} required style={{ flex: 1 }} />
            <select value={newTool.category} onChange={e => setNewTool({ ...newTool, category: e.target.value })} style={{ width: 120 }}>
              <option value="llm">LLM</option>
              <option value="video">Video</option>
              <option value="image">Image</option>
              <option value="voice">Voice</option>
              <option value="music">Music</option>
            </select>
            <input placeholder="API Key" type="password" value={newTool.api_key}
              onChange={e => setNewTool({ ...newTool, api_key: e.target.value })} style={{ flex: 2 }} />
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Save size={14} /> Save
            </button>
          </form>
          {tools.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span>
                <strong>{t.tool_name}</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12, marginLeft: 8 }}>[{t.category}]</span>
              </span>
              <span style={{ color: t.is_active ? 'var(--success)' : 'var(--danger)', fontSize: 12 }}>
                {t.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>

        {/* Social Accounts */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Social Accounts {!workspaceId && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>(select workspace first)</span>}</h3>
          {workspaceId && (
            <>
              <form onSubmit={addAccount} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <select value={newAccount.platform} onChange={e => setNewAccount({ ...newAccount, platform: e.target.value })} style={{ width: 120 }}>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="instagram">Instagram</option>
                  <option value="pinterest">Pinterest</option>
                </select>
                <input placeholder="Account name" value={newAccount.account_name}
                  onChange={e => setNewAccount({ ...newAccount, account_name: e.target.value })} required style={{ flex: 1 }} />
                <input placeholder="Access token" type="password" value={newAccount.access_token}
                  onChange={e => setNewAccount({ ...newAccount, access_token: e.target.value })} style={{ flex: 2 }} />
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus size={14} /> Add
                </button>
              </form>
              {accounts.map(a => (
                <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                  <strong>{a.platform}</strong> - {a.account_name}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
