import { describe, expect, test } from '@jest/globals'

jest.mock('@/src/api/client', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
}))

import {
  PATIENTS,
  ADMINISTRATIONS,
  MEDICAMENTS,
  ALERTES,
  CONSTANTES,
  SURVEILLANCES,
  INFIRMIER_WORKSPACE,
} from '@/src/api/endpoints'

describe('INFIRMIER - Endpoints configuration', () => {
  test('I-E1: PATIENTS.BY_CLINIQUE returns correct URL', () => {
    expect(PATIENTS.BY_CLINIQUE(1)).toBe('/api/patients/clinique/1')
  })

  test('I-E2: ADMINISTRATIONS endpoints', () => {
    expect(ADMINISTRATIONS.BY_INFIRMIER('1'))
      .toBe('/api/administrations/infirmier/1')
    expect(ADMINISTRATIONS.ADMINISTRER('1'))
      .toBe('/api/administrations/1/administrer')
    expect(ADMINISTRATIONS.BY_PATIENT_AUJOURDHUI('1'))
      .toBe('/api/administrations/patient/1/aujourd-hui')
  })

  test('I-E3: MEDICAMENTS.RECHERCHE exists', () => {
    expect(MEDICAMENTS.RECHERCHE).toBe('/api/medicaments/recherche')
  })

  test('I-E4: SURVEILLANCES.BY_INFIRMIER URL is correct', () => {
    expect(SURVEILLANCES.BY_INFIRMIER('1'))
      .toBe('/api/surveillances/infirmier/1')
  })

  test('I-E5: ALERTES endpoints', () => {
    expect(ALERTES.URGENCE).toBe('/api/alertes/urgence')
    expect(ALERTES.MATERIEL).toBe('/api/alertes/manque-materiel')
  })

  test('I-E6: CONSTANTES endpoints', () => {
    expect(CONSTANTES.CREATE).toBe('/api/constantes-vitales')
    expect(CONSTANTES.BY_PATIENT('1'))
      .toBe('/api/constantes-vitales/patient/1')
  })

  test('I-E7: INFIRMIER_WORKSPACE endpoints', () => {
    expect(INFIRMIER_WORKSPACE.SIGNALEMENT_MEDECIN('1'))
      .toBe('/api/infirmiers/1/workspace/signalement-medecin')
    expect(INFIRMIER_WORKSPACE.RAPPORT_FIN_JOURNEE('1'))
      .toBe('/api/infirmiers/1/workspace/rapport-fin-journee')
  })
})
