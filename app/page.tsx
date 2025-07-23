"use client"

import { useState } from "react"
import KanbanBoard from "../kanban-board"
import Login from "../components/login"

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div>
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
        >
          Logout
        </button>
      </div>
      <KanbanBoard />
    </div>
  )
}
