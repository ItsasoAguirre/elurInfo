import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { availableLocales } from '../locales'

export function useLanguage() {
  const { locale, t } = useI18n()

  const currentLanguage = computed(() => locale.value)
  
  const currentLanguageInfo = computed(() => {
    return availableLocales.find(lang => lang.code === locale.value) || availableLocales[0]
  })

  const setLanguage = (languageCode: string) => {
    if (availableLocales.some(lang => lang.code === languageCode)) {
      locale.value = languageCode
      localStorage.setItem('elurinfo-language', languageCode)
      
      // Update document language attribute
      document.documentElement.lang = languageCode
    }
  }

  const getLanguageName = (code: string) => {
    const lang = availableLocales.find(l => l.code === code)
    return lang ? lang.name : code
  }

  // Watch for locale changes to update document language
  watch(locale, (newLocale) => {
    document.documentElement.lang = newLocale
  }, { immediate: true })

  return {
    currentLanguage,
    currentLanguageInfo,
    availableLocales,
    setLanguage,
    getLanguageName,
    t
  }
}