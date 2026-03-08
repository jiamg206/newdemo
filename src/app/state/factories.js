function makeId(prefix) {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now()}-${random}`
}

export function createLight(index) {
  return {
    id: makeId('light'),
    group: `Group ${String.fromCharCode(65 + (index % 26))}`,
    maxWs: 400,
    headWs: 400,
    fraction: 1,
    continuousW: 200,
    powerIndex: 0,
    modelingOn: true,
    modelingPower: 40,
    mode: 'flash',
    colorTemp: 5600,
    modifier: 'standard_reflector',
    accessories: [],
    ctoLevel: '1/1',
    gridAngle: 20,
    beamShape: 'standard',
    focusConstraint: 0.35,
    edgeFalloff: 0,
    rectWidth: 1.7,
    rectHeight: 1.1,
    enabled: true,
    showGuide: false,
    position: [2 + index * 0.8, 2.3, 2.4],
    rotation: [0, -2.2, 0],
  }
}

export function createFlag(type, index) {
  return {
    id: makeId('flag'),
    type,
    width: 0.8,
    height: 0.5,
    position: [1 + index * 0.5, 1.2, -1.2],
    rotation: [0, 0, 0],
  }
}
