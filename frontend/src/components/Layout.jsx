import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Wand2, FileText, Settings } from 'lucide-react'
import WorkspaceSelector from './WorkspaceSelector'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/characters', icon: Users, label: 'Characters' },
  { to: '/generate', icon: Wand2, label: 'Generate' },
  { to: '/posts', icon: FileText, label: 'Posts' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav style={{
        width: 220,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
            CONTENT CAESAR
          </h1>
        </div>

        <div style={{ padding: '16px 12px', borderBottom: '1px solid var(--border)' }}>
          <WorkspaceSelector />
        </div>

        <div style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 20px',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(201, 162, 39, 0.1)' : 'transparent',
                borderRight: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
