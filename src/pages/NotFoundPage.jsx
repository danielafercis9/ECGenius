import { Link } from 'react-router-dom'
import { Character } from '../components/Character'
import { Icon } from '../components/Icon'

export function NotFoundPage() {
  return <div className="page not-found-page"><section className="not-found"><div className="giant-404">4<span>0</span>4</div><Character id="doctor01" pose="error404" alt="Doctor looking for a lost rhythm"/><div><span className="step-kicker">PAGE NOT FOUND</span><h1>This rhythm got lost.</h1><p>The page you’re looking for isn’t on this ECG strip. Let’s get you back on the learning path.</p><div><Link className="button primary" to="/learn">Back to Learn <Icon name="arrow"/></Link><Link className="button secondary" to="/practice">Browse Practice</Link></div></div></section></div>
}
