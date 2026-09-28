const asset = (path) => `${import.meta.env.BASE_URL}characters/${path}`

export const characterAssets = {
  mascotCat: {
    default: asset('mascot-cat/default.svg'),
    presenting: asset('mascot-cat/presenting.svg'),
    warning: asset('mascot-cat/warning.svg'),
    celebrating: asset('mascot-cat/celebrating.svg'),
  },
  doctor01: {
    default: asset('doctor-01/default.svg'),
    presenting: asset('doctor-01/presenting.svg'),
    recap: asset('doctor-01/recap.svg'),
    error404: asset('doctor-01/404.svg'),
    path01: asset('doctor-01/path01.svg'),
    path02: asset('doctor-01/path02.svg'),
  },
  doctor02: {
    default: asset('doctor-02/default.svg'),
    presenting: asset('doctor-02/presenting.svg'),
    recap: asset('doctor-02/recap.svg'),
    loading: asset('doctor-02/loading.svg'),
    path01: asset('doctor-02/path01.svg'),
    path02: asset('doctor-02/path02.svg'),
  },
  doctor03: {
    default: asset('doctor-03/default.svg'),
    presenting: asset('doctor-03/presenting.svg'),
    recap: asset('doctor-03/recap.svg'),
    path01: asset('doctor-03/path01.svg'),
    path02: asset('doctor-03/path02.svg'),
  },
}

export function resolveCharacterAsset(characterId, pose = 'default') {
  const character = characterAssets[characterId]
  return character?.[pose] || character?.default || null
}

export function resolveExactCharacterAsset(characterId, pose) {
  return characterAssets[characterId]?.[pose] || null
}
