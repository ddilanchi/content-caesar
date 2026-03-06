import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Characters from './pages/Characters'
import Generate from './pages/Generate'
import Posts from './pages/Posts'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="characters" element={<Characters />} />
        <Route path="generate" element={<Generate />} />
        <Route path="posts" element={<Posts />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
