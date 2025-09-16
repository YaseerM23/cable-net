"use client"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate, useLocation } from "react-router-dom"
import "./Layout.css"

const Layout = ({ children }) => {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const navigationItems = [
    { path: "/dashboard", label: "Home", icon: "🏠" },
    { path: "/network-map", label: "Network Map", icon: "🗺️" },
    { path: "/locations", label: "Locations", icon: "📍" },
    { path: "/services", label: "Services", icon: "⚙️" },
    { path: "/service-types", label: "Service Types", icon: "🔧" },
  ]

  return (
    <div className="layout-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Cable Network</h2>
          <p>Management System</p>
        </div>

        <ul className="nav-menu">
          {navigationItems.map((item) => (
            <li key={item.path}>
              <button
                className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <div className="user-info">
            <p>Welcome, {currentUser?.username}</p>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <span>🚪</span>
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        <header className="main-header">
          <h1>Cable Network Management Dashboard</h1>
        </header>
        <div className="content-area">{children}</div>
      </main>
    </div>
  )
}

export default Layout
