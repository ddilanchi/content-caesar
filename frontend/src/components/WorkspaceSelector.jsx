import { useState, useEffect } from 'react'
import api from '../utils/api'

export default function WorkspaceSelector() {
  const [workspaces, setWorkspaces] = useState([])
  const [selected, setSelected] = useState(
    localStorage.getItem('workspace_id') || ''
  )

  const fetchWorkspaces = () => {
    api.get('/workspaces/').then(r => {
      setWorkspaces(r.data)
      // Auto-select first workspace if nothing is selected yet
      const stored = localStorage.getItem('workspace_id')
      if (!stored && r.data.length > 0) {
        const id = String(r.data[0].id)
        setSelected(id)
        localStorage.setItem('workspace_id', id)
        window.dispatchEvent(new Event('workspace-changed'))
      }
    }).catch(() => {})
  }

  useEffect(() => {
    fetchWorkspaces()
    window.addEventListener('workspaces-updated', fetchWorkspaces)
    return () => window.removeEventListener('workspaces-updated', fetchWorkspaces)
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
