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
  MEDECINS,
  RDV,
  ORDONNANCES,
  IMAGERIES,
  CONSULTATIONS,
  MESSAGES,
  NOTIFICATIONS,
} from '@/src/api/endpoints'

describe('MEDECIN - Endpoints configuration', () => {
  test('M-E1: MEDECINS.PATIENTS_LIST returns correct URL', () => {
    expect(MEDECINS.PATIENTS_LIST(123)).toBe('/api/medecins/123/patients')
  })

  test('M-E2: PATIENTS.BY_CLINIQUE returns correct URL', () => {
    expect(PATIENTS.BY_CLINIQUE(1)).toBe('/api/patients/clinique/1')
  })

  test('M-E3: ORDONNANCES.SIGNER returns correct URL', () => {
    expect(ORDONNANCES.SIGNER(456)).toBe('/api/ordonnances/456/signer')
  })

  test('M-E4: ORDONNANCES.CREATE returns correct URL', () => {
    expect(ORDONNANCES.CREATE).toBe('/api/ordonnances')
  })

  test('M-E5: IMAGERIES endpoints present', () => {
    expect(IMAGERIES.DEMANDER).toBe('/api/imageries/demander')
    expect(IMAGERIES.BY_PATIENT('1')).toBe('/api/imageries/patient/1')
    expect(IMAGERIES.BY_MEDECIN('1')).toBe('/api/imageries/medecin/1')
  })

  test('M-E6: CONSULTATIONS endpoints present', () => {
    expect(CONSULTATIONS.CREATE).toBe('/api/consultations')
    expect(CONSULTATIONS.BY_PATIENT('1')).toBe('/api/consultations/patient/1')
  })

  test('M-E7: RDV endpoints present', () => {
    expect(RDV.BY_MEDECIN('1')).toBe('/api/rendez-vous/medecin/1')
    expect(RDV.CREATE).toBe('/api/rendez-vous')
  })

  test('M-E8: MESSAGES endpoints present', () => {
    expect(MESSAGES.CONTACTS('1')).toBe('/api/messages/contacts/1')
  })

  test('M-E9: NOTIFICATIONS endpoints present', () => {
    expect(NOTIFICATIONS.LIST).toBe('/api/notifications')
    expect(NOTIFICATIONS.NON_LUES).toBe('/api/notifications/non-lues')
  })
})
