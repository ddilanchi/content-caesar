import { useState, useEffect } from 'react'
import api from '../utils/api'

export default function WorkspaceSelector() {
  const [workspaces, setWorkspaces] = useState([])
  const [selected, setSelected] = useState(
    localStorage.getItem('workspace_id') || ''
  )

  useEffect(() => {
    api.get('/workspaces/').then(r => setWorkspaces(r.data)).catch(() => {})
  }, [])

  const handleChange = (e) => {
    setSelected(e.target.value)
    localStorage.setItem('workspace_id', e.target.value)
    window.dispatchEvent(new Event('workspace-changed'))
  }

  return (
    <select value={selected} onChange={handleChange} style={{ fontSize: 13 }}>
      <option value="">Select workspace...</option>
      {workspaces.map(ws => (
        <option key={ws.id} value={ws.id}>{ws.name}</option>
      ))}
    </select>
  )
}
