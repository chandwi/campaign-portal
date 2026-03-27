import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { ToastContainer } from './components/ui/Toast'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import CampaignWizard from './pages/CampaignWizard'
import CampaignDetails from './pages/CampaignDetails'
import Templates from './pages/Templates'
import TemplateEditor from './pages/TemplateEditor'
import Contacts from './pages/Contacts'
import Settings from './pages/Settings'

function RequireAuth({ children }) {
  const { user } = useApp()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useApp()

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/campaigns" element={<RequireAuth><Campaigns /></RequireAuth>} />
        <Route path="/campaigns/new" element={<RequireAuth><CampaignWizard /></RequireAuth>} />
        <Route path="/campaigns/:id" element={<RequireAuth><CampaignDetails /></RequireAuth>} />
        <Route path="/templates" element={<RequireAuth><Templates /></RequireAuth>} />
        <Route path="/templates/new" element={<RequireAuth><TemplateEditor /></RequireAuth>} />
        <Route path="/templates/:id/edit" element={<RequireAuth><TemplateEditor /></RequireAuth>} />
        <Route path="/contacts" element={<RequireAuth><Contacts /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastContainer />
    </>
  )
}
