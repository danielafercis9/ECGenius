const patientAsset = (patientId, pose) => `${import.meta.env.BASE_URL}challenge-patients/${patientId}/${pose}.svg`

export const challengePatientAssets = Object.fromEntries(
  Array.from({ length: 10 }, (_, index) => {
    const id = `P${index + 1}`
    return [id, { default: patientAsset(id, 'default'), success: patientAsset(id, 'success') }]
  }),
)

export function resolvePatientAsset(patientId, pose = 'default') {
  const patient = challengePatientAssets[patientId]
  return patient?.[pose] || patient?.default || null
}

const challengeAsset = (filename) => `${import.meta.env.BASE_URL}challenge-backgrounds/${filename}`

export const challengeWardAssets = {
  'ward-1': challengeAsset('ward1.png'),
  'ward-2': challengeAsset('ward2.png'),
  'ward-3': challengeAsset('ward3.png'),
}

export const challengeWardSlots = {
  'ward-1': [
    { x: 23, y: 23 }, { x: 77, y: 23 }, { x: 23, y: 58 }, { x: 77, y: 58 }, { x: 50, y: 82 },
  ],
  'ward-2': [
    { x: 23, y: 23 }, { x: 77, y: 23 }, { x: 23, y: 58 }, { x: 77, y: 58 }, { x: 50, y: 82 },
  ],
  'ward-3': [
    { x: 23, y: 23 }, { x: 77, y: 23 }, { x: 23, y: 59 }, { x: 77, y: 59 }, { x: 50, y: 82 },
  ],
}

export function resolveWardBackground(wardId) {
  return challengeWardAssets[wardId] || null
}
