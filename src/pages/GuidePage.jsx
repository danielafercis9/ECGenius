import { PageHeader } from '../components/AppShell'
import { Character } from '../components/Character'
import { Disclaimer } from '../components/Shared'

const topics = [
  ['01', 'Heart rate', 'Count how often ventricular complexes occur. Rate gives context for the rhythm pattern.'],
  ['02', 'Rhythm regularity', 'Compare the spacing between beats. Look for regular, repeating, cyclic, or completely random variation.'],
  ['03', 'P wave', 'Look for atrial activity before each QRS, then compare its presence, shape, and consistency.'],
  ['04', 'PR interval', 'Follow conduction from the start of the P wave to the start of the QRS and note whether it stays constant.'],
  ['05', 'QRS complex', 'Assess ventricular depolarization. Compare complex width, shape, and whether every atrial impulse conducts.'],
  ['06', 'R-R interval', 'Measure the space between consecutive R waves to assess ventricular regularity and pauses.'],
  ['07', 'ST segment', 'Inspect the segment after ventricular depolarization and compare it with the isoelectric baseline.'],
  ['08', 'QT interval', 'Follow total ventricular depolarization and repolarization from QRS onset to the end of the T wave.'],
]

export function GuidePage() {
  return <div className="page guide-page"><PageHeader eyebrow="ECG FUNDAMENTALS" title="A calm way to read every strip">Use the same sequence every time. This guide introduces the concepts used throughout the 27 rhythm lessons.</PageHeader><section className="guide-intro surface"><div><span className="step-kicker">YOUR READING ROUTINE</span><h2>Rate → rhythm → P wave → PR → QRS</h2><p>Start broad, then move through the tracing in a consistent order. The goal is to describe what you observe before naming a pattern.</p></div><Character id="mascotCat" pose="presenting" alt="ECGenius mascot presenting the reading routine"/></section><div className="guide-grid">{topics.map(([number, title, text]) => <article key={title}><span>{number}</span><div className="mini-trace"><i/><i/><i/><i/><i/></div><h2>{title}</h2><p>{text}</p></article>)}</div><Disclaimer/></div>
}

