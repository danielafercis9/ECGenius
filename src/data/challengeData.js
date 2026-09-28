export const challengePatients = Array.from({ length: 10 }, (_, index) => ({
  id: `P${index + 1}`,
  displayName: `Patient ${index + 1}`,
}))

export const challengeWards = [
  { id: 'ward-1', order: 1, title: 'First Shift', subtitle: 'Five randomized ECG encounters' },
  { id: 'ward-2', order: 2, title: 'Second Shift', subtitle: 'Five new randomized ECG encounters' },
  { id: 'ward-3', order: 3, title: 'Final Shift', subtitle: 'Random cases, targeted review, and a timed final' },
]

export const reviewFallbackGroups = [
  ['sinus-exit-block', 'sinus-arrest'],
  ['2-degree-avb-type-i', '2-degree-avb-type-ii'],
  ['atrial-fibrillation', 'atrial-flutter', 'wandering-pacemaker'],
  ['svt', 'sinus-tachycardia', 'atrial-flutter'],
  ['ventricular-tachycardia', 'accelerated-idioventricular-rhythm', 'paced-ventricular'],
  ['junctional-rhythm', 'sinus-bradycardia', 'idioventricular-rhythm'],
  ['nsr-with-pac', 'nsr-with-pjc', 'nsr-with-pvc'],
]

export function getWardByOrder(order) {
  return challengeWards.find((ward) => ward.order === Number(order))
}

export function resolveWardAdmissions(ward, state) {
  return state.wardAssignments?.[ward.id] || []
}
