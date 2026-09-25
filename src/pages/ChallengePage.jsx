import { Link } from 'react-router-dom'
import { PageHeader } from '../components/AppShell'
import { Character } from '../components/Character'
import { Icon } from '../components/Icon'

export function ChallengePage() {
  return <div className="page challenge-page"><PageHeader eyebrow="FINAL CHALLENGE" title="Challenge mode is getting ready">The route and shared data contract are in place for the groupmate’s game.</PageHeader><section className="unavailable-state"><div className="unavailable-code">COMING<br/>SOON</div><Character id="doctor01" pose="error404" alt="Doctor looking for the unavailable challenge"/><div><span className="step-kicker">CHALLENGE UNAVAILABLE</span><h2>This rhythm game isn’t connected yet.</h2><p>When the final URL or component arrives, it can be mounted here and consume the same pathology IDs, names, modules, and videos used everywhere else.</p><div><Link className="button primary" to="/learn">Back to Learn <Icon name="arrow"/></Link><Link className="button secondary" to="/practice">Open Practice</Link></div></div></section></div>
}

