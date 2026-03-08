export const EXPOSURE_CALIBRATION = 1000

export function computeEV({ aperture, shutterSpeed, iso }) {
  const fNumber = Math.max(0.1, Number(aperture) || 5.6)
  const exposureTime = Math.max(1e-6, Number(shutterSpeed) || 1 / 125)
  const isoValue = Math.max(1, Number(iso) || 100)
  return Math.log2((fNumber * fNumber) / exposureTime) - Math.log2(isoValue / 100)
}

export function evToToneMappingExposure(ev, calibration = EXPOSURE_CALIBRATION) {
  return Math.pow(2, -ev) * calibration
}

export function resolveToneMappingExposure({
  aperture,
  shutterSpeed,
  iso,
  calibration = EXPOSURE_CALIBRATION,
}) {
  const ev = computeEV({ aperture, shutterSpeed, iso })
  const exposure = evToToneMappingExposure(ev, calibration)
  return Number.isFinite(exposure) ? exposure : 1
}
