import { describe, expect, test } from '@jest/globals'

jest.mock('@/src/api/client', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
}))

import {
  IMAGERIES,
  RAPPORTS,
} from '@/src/api/endpoints'

describe('RADIOLOGUE - Endpoints configuration', () => {
  test('R-E1: IMAGERIES.EN_ATTENTE', () => {
    expect(IMAGERIES.EN_ATTENTE)
      .toBe('/api/imageries/en-attente')
  })

  test('R-E2: IMAGERIES.BY_RADIOLOGUE', () => {
    expect(IMAGERIES.BY_RADIOLOGUE('1'))
      .toBe('/api/imageries/radiologue/1')
  })

  test('R-E3: IMAGERIES.BY_ID', () => {
    expect(IMAGERIES.BY_ID('1'))
      .toBe('/api/imageries/1')
  })

  test('R-E4: IMAGERIES.PRENDRE_EN_CHARGE', () => {
    expect(IMAGERIES.PRENDRE_EN_CHARGE('1'))
      .toBe('/api/imageries/1/prendre-en-charge')
  })

  test('R-E5: IMAGERIES.TERMINER', () => {
    expect(IMAGERIES.TERMINER('1'))
      .toBe('/api/imageries/1/terminer')
  })

  test('R-E6: RAPPORTS.CREATE', () => {
    expect(RAPPORTS.CREATE)
      .toBe('/api/rapports-imagerie')
  })

  test('R-E7: RAPPORTS.BY_IMAGERIE', () => {
    expect(RAPPORTS.BY_IMAGERIE('1'))
      .toBe('/api/rapports-imagerie/imagerie/1')
  })

  test('R-E8: RAPPORTS.VALIDER', () => {
    expect(RAPPORTS.VALIDER('1'))
      .toBe('/api/rapports-imagerie/1/valider')
  })

  test('R-E9: RAPPORTS.BROUILLON', () => {
    expect(RAPPORTS.BROUILLON('1'))
      .toBe('/api/rapports-imagerie/1/brouillon')
  })

  test('R-E10: IMAGERIES.BY_PATIENT', () => {
    expect(IMAGERIES.BY_PATIENT('1'))
      .toBe('/api/imageries/patient/1')
  })
})
