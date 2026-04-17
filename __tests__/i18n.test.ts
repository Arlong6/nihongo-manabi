import zhTW from '../locales/zh-TW.json'
import en from '../locales/en.json'
import ko from '../locales/ko.json'

// Recursively collect all leaf keys from a nested object
function collectKeys(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = []
  for (const k of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${k}` : k
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      keys.push(...collectKeys(obj[k], full))
    } else {
      keys.push(full)
    }
  }
  return keys
}

const zhKeys = collectKeys(zhTW).sort()
const enKeys = collectKeys(en).sort()
const koKeys = collectKeys(ko).sort()

describe('i18n locale files', () => {
  test('en and zh-TW have the same keys', () => {
    expect(enKeys).toEqual(zhKeys)
  })

  test('ko and zh-TW have the same keys', () => {
    expect(koKeys).toEqual(zhKeys)
  })

  test('zh-TW has no empty strings', () => {
    const empty = zhKeys.filter(k => {
      const parts = k.split('.')
      let val: any = zhTW
      for (const p of parts) val = val[p]
      return val === ''
    })
    expect(empty).toEqual([])
  })

  test('en has no empty strings', () => {
    const empty = enKeys.filter(k => {
      const parts = k.split('.')
      let val: any = en
      for (const p of parts) val = val[p]
      return val === ''
    })
    expect(empty).toEqual([])
  })

  test('ko has no empty strings', () => {
    const empty = koKeys.filter(k => {
      const parts = k.split('.')
      let val: any = ko
      for (const p of parts) val = val[p]
      return val === ''
    })
    expect(empty).toEqual([])
  })
})
