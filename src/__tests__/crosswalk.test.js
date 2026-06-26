import { describe, it, expect } from 'vitest'
import { CONCEPTS } from '../../crosswalk-data.js'

const SCHEMAS = ['unimarc', 'marc21', 'dc', 'rda', 'bibframe']
const VALID_GROUPS = ['descriptive', 'subject', 'linking', 'provenance', 'administrative']
const VALID_MATCH = ['exact', 'lossy', 'partial', 'none']

describe('crosswalk-data.js — schema integrity', () => {
  it('exports at least one concept', () => {
    expect(CONCEPTS.length).toBeGreaterThan(0)
  })

  it('every concept has required fields', () => {
    for (const c of CONCEPTS) {
      expect(c.id, `concept missing id`).toBeTruthy()
      expect(c.label, `${c.id} missing label`).toBeTruthy()
      expect(c.group, `${c.id} missing group`).toBeTruthy()
      expect(c.mappings, `${c.id} missing mappings`).toBeTruthy()
    }
  })

  it('all ids are unique', () => {
    const ids = CONCEPTS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every concept maps all five schemas', () => {
    for (const c of CONCEPTS) {
      for (const schema of SCHEMAS) {
        expect(c.mappings[schema], `${c.id} missing mapping for ${schema}`).toBeTruthy()
      }
    }
  })

  it('every mapping has a field and a valid match value', () => {
    for (const c of CONCEPTS) {
      for (const [schema, m] of Object.entries(c.mappings)) {
        expect(m.field, `${c.id}/${schema} missing field`).toBeTruthy()
        expect(VALID_MATCH, `${c.id}/${schema} invalid match "${m.match}"`).toContain(m.match)
      }
    }
  })

  it('descriptive group exists', () => {
    expect(CONCEPTS.some((c) => c.group === 'descriptive')).toBe(true)
  })

  it('subject group exists', () => {
    expect(CONCEPTS.some((c) => c.group === 'subject')).toBe(true)
  })
})

describe('crosswalk match quality', () => {
  it('title concept exists and maps exactly in marc21', () => {
    const title = CONCEPTS.find((c) => c.id === 'title')
    expect(title).toBeDefined()
    expect(title.mappings.marc21.match).toBe('exact')
    expect(title.mappings.unimarc.match).toBe('exact')
  })

  it('no concept has all-none matches (would be useless)', () => {
    for (const c of CONCEPTS) {
      const allNone = Object.values(c.mappings).every((m) => m.match === 'none')
      expect(allNone, `${c.id} has no useful mappings at all`).toBe(false)
    }
  })

  it('MARC 21 fields follow NNN $x format', () => {
    for (const c of CONCEPTS) {
      const field = c.mappings.marc21.field
      if (field && field !== 'N/A' && field !== '-') {
        expect(/^\d{3}/.test(field), `${c.id} marc21 field "${field}" doesn't start with 3-digit tag`).toBe(true)
      }
    }
  })
})
