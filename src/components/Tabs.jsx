export function Tabs({ tabs, active, onChange, ariaLabel }) {
  const handleKeyDown = (event, index) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
    onChange(tabs[next].id)
    event.currentTarget.parentElement.children[next]?.focus()
  }
  return <div className="tabs" role="tablist" aria-label={ariaLabel}>{tabs.map((tab, index) => <button key={tab.id} type="button" role="tab" aria-selected={active === tab.id} tabIndex={active === tab.id ? 0 : -1} className={active === tab.id ? 'active' : ''} onClick={() => onChange(tab.id)} onKeyDown={(e) => handleKeyDown(e, index)}>{tab.label}</button>)}</div>
}
