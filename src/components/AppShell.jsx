import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Icon } from './Icon'

const navItems = [
  { to: '/learn', label: 'Learn', icon: 'learn' },
  { to: '/practice', label: 'Practice', icon: 'practice' },
  { to: '/predict', label: 'Predict', icon: 'predict' },
  { to: '/challenge', label: 'Challenge', icon: 'challenge' },
  { to: '/guide', label: 'ECG Guide', icon: 'guide' },
]

export function AppShell() {
  const [open, setOpen] = useState(false)
  const { theme, toggleTheme } = useApp()
  const location = useLocation()
  useEffect(() => setOpen(false), [location.pathname])
  return <div className="app-shell">
    <header className="mobile-header"><Brand/><button className="icon-button" onClick={() => setOpen(true)} aria-label="Open navigation"><Icon name="menu"/></button></header>
    {open && <button className="drawer-backdrop" onClick={() => setOpen(false)} aria-label="Close navigation"/>}
    <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Primary navigation">
      <div className="sidebar-top"><Brand/><button className="icon-button drawer-close" onClick={() => setOpen(false)} aria-label="Close navigation"><Icon name="close"/></button></div>
      <nav>{navItems.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><span className={`nav-icon ${item.icon}`}><Icon name={item.icon}/></span><span>{item.label}</span></NavLink>)}</nav>
      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={toggleTheme} aria-pressed={theme === 'dark'}><Icon name={theme === 'dark' ? 'sun' : 'moon'}/><span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span></button>
        <p>Learn the pattern.<br/>Understand the rhythm.</p>
      </div>
    </aside>
    <main id="main-content"><Outlet/></main>
  </div>
}

function Brand() {
  return <NavLink to="/learn" className="brand" aria-label="ECGenius Learn"><span className="brand-mark"><span/><i/></span><span>EC<span>Genius</span></span></NavLink>
}

export function PageHeader({ eyebrow, title, children, actions }) {
  return <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children && <p className="page-intro">{children}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</header>
}
