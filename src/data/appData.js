import rawData from '../../pathologies_with_classifier.json'

const moduleDescriptions = [
  'Build a systematic rhythm-reading foundation.',
  'Recognize atrial activity and supraventricular patterns.',
  'Compare conduction relationships between P waves and QRS complexes.',
  'Identify rhythms that originate around the AV junction.',
  'Recognize wide-complex ventricular patterns and ectopy.',
  'Spot atrial and ventricular pacing activity.',
]

const characterIds = { character1: 'doctor01', character2: 'doctor02', character3: 'doctor03' }

const cleanModuleTitle = (value) => value.replace(/^MODULE\s+\d+\s*-\s*/i, '').replace(/\b\w/g, (c) => c.toUpperCase())

const splitCharacteristic = (line) => {
  const index = line.indexOf(':')
  return index < 0
    ? { label: 'Finding', value: line }
    : { label: line.slice(0, index).trim(), value: line.slice(index + 1).trim() }
}

const nameToId = new Map(rawData.pathologies.flatMap((item) => [[item.pathology.toLowerCase(), item.id], [item.short_name.toLowerCase(), item.id]]))

export const pathologies = rawData.pathologies.map((item, index) => ({
  ...item,
  order: index + 1,
  fullName: item.pathology,
  shortName: item.short_name,
  moduleId: `module-${Number(item.module.match(/MODULE\s+(\d+)/i)?.[1] || 1)}`,
  characterId: characterIds[item.character] || 'doctor01',
  videoUrl: item.video_url,
  characteristics: item.ecg_characteristics.map(splitCharacteristic),
  symptoms: item.clinical_signs_symptoms,
  keyLearningPoints: item.key_learning_points,
  quizDistractorIds: item.quiz_distractors.map((name) => nameToId.get(name.toLowerCase())).filter(Boolean),
  relatedRhythmIds: (item.related_rhythms || []).map((name) => nameToId.get(String(name).toLowerCase()) || name).filter(Boolean),
}))

const moduleNames = [...new Set(rawData.pathologies.map((item) => item.module))]
export const modules = moduleNames.map((name, index) => ({
  id: `module-${index + 1}`,
  order: index + 1,
  title: cleanModuleTitle(name),
  sourceTitle: name,
  description: moduleDescriptions[index],
  pathologyIds: pathologies.filter((item) => item.module === name).map((item) => item.id),
}))

export const classifierSchema = rawData.classifier_schema
export const pathologyById = new Map(pathologies.map((item) => [item.id, item]))
export const totalLessons = pathologies.length

export function getPathology(id) { return pathologyById.get(id) }
export function getModule(id) { return modules.find((module) => module.id === id) }
export function getPathologyByName(name) { return getPathology(nameToId.get(String(name).toLowerCase())) }

export function validateData() {
  const errors = []
  if (pathologies.length !== 27) errors.push(`Expected 27 pathologies, found ${pathologies.length}.`)
  if (new Set(pathologies.map((p) => p.id)).size !== pathologies.length) errors.push('Pathology IDs must be unique.')
  if (modules.length !== 6) errors.push(`Expected 6 modules, found ${modules.length}.`)
  const expected = [6, 5, 5, 4, 5, 2]
  modules.forEach((m, i) => { if (m.pathologyIds.length !== expected[i]) errors.push(`${m.id} has ${m.pathologyIds.length} lessons.`) })
  pathologies.forEach((p) => {
    if (!['doctor01', 'doctor02', 'doctor03'].includes(p.characterId)) errors.push(`${p.id}: invalid character.`)
    if (p.quizDistractorIds.length !== 2) errors.push(`${p.id}: requires two valid distractors.`)
    for (const field of ['definition', 'symptoms', 'diagnosis', 'treatment', 'recommendations']) {
      if (!p[field]) errors.push(`${p.id}: missing ${field}.`)
    }
  })
  return errors
}

export const dataValidationErrors = validateData()

