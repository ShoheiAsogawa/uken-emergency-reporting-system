import { PutCommand, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'
import type { StaffPrincipal } from '../auth/cognito.js'
import { docClient } from '../db/dynamo.js'
import { optionalEnv } from '../utils/env.js'
import { logAudit } from '../db/audit.js'

export interface ShelterItem {
  shelter_id: string
  name: string
  lat: number
  lng: number
  is_active: boolean
  updated_at: string
  updated_by: string
}

const TABLE_SHELTERS = optionalEnv('DYNAMODB_TABLE_SHELTERS') || 'Shelters'

export async function listShelters() {
  const res = await docClient.send(
    new ScanCommand({
      TableName: TABLE_SHELTERS,
    })
  )
  return (res.Items || []) as ShelterItem[]
}

export async function saveShelter(input: Partial<ShelterItem>, staff: StaffPrincipal) {
  if (!input.name || input.name.trim().length === 0) throw new Error('Invalid name')
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) throw new Error('Invalid lat/lng')

  const now = new Date().toISOString()
  const shelter: ShelterItem = {
    shelter_id: input.shelter_id || uuidv4(),
    name: input.name.trim(),
    lat: Number(input.lat),
    lng: Number(input.lng),
    is_active: input.is_active ?? true,
    updated_at: now,
    updated_by: staff.staff_id,
  }

  await docClient.send(
    new PutCommand({
      TableName: TABLE_SHELTERS,
      Item: shelter,
    })
  )

  await logAudit({
    actor_type: 'staff',
    actor_id: staff.staff_id,
    action: 'SHELTER_SAVE',
    details: { shelter_id: shelter.shelter_id },
  })

  return shelter
}

export async function getShelter(shelterId: string) {
  const res = await docClient.send(
    new GetCommand({
      TableName: TABLE_SHELTERS,
      Key: { shelter_id: shelterId },
    })
  )
  return (res.Item as ShelterItem | undefined) || null
}

