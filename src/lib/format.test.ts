import { describe, expect, it } from 'vitest'
import { maskPhone } from './format'

describe('maskPhone', () => {
  it('masks all but last 4 digits', () => {
    expect(maskPhone('09012345678')).toBe('****5678')
  })

  it('returns as-is for short strings', () => {
    expect(maskPhone('1234')).toBe('1234')
    expect(maskPhone('123')).toBe('123')
  })
})

