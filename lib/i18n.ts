import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import { getLocale } from './storage'

import zhTW from '../locales/zh-TW.json'
import en from '../locales/en.json'
import ko from '../locales/ko.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en',    label: 'English' },
  { code: 'ko',    label: '한국어' },
]

export async function initI18n(): Promise<void> {
  const saved = await getLocale()
  const deviceTag = Localization.getLocales()[0]?.languageTag ?? 'zh-TW'
  let lng = saved
  if (!lng) {
    if (deviceTag.startsWith('zh')) lng = 'zh-TW'
    else if (deviceTag.startsWith('ko')) lng = 'ko'
    else lng = 'en'
  }

  await i18n.use(initReactI18next).init({
    resources: {
      'zh-TW': { translation: zhTW },
      en:      { translation: en },
      ko:      { translation: ko },
    },
    lng,
    fallbackLng: 'zh-TW',
    interpolation: { escapeValue: false },
  })
}

export default i18n
