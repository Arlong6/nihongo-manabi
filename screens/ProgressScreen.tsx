import React, { useEffect, useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import i18n, { SUPPORTED_LANGUAGES } from '../lib/i18n'
import { loadProgress, resetProgress, setLocale } from '../lib/storage'
import { allVocabulary, categoryInfo } from '../data/vocabulary'
import { getDueCards } from '../lib/srs'
import { scheduleDaily, cancelNotifications, getNotificationSettings } from '../lib/notifications'
import type { UserProgress } from '../types'
import { useTheme } from '../lib/theme'
import type { ThemeColors, ThemeMode } from '../lib/theme'

function ProgressBar({ label, emoji, learned, total, color, colors }: {
  label: string; emoji?: string; learned: number; total: number; color: string; colors: ThemeColors
}) {
  const pct = total > 0 ? Math.round((learned / total) * 100) : 0
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text }}>{emoji ? `${emoji} ` : ''}{label}</Text>
        <Text style={{ fontSize: 12, color: colors.subtext }}>{learned}/{total} ({pct}%)</Text>
      </View>
      <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4 }}>
        <View style={{ height: 8, borderRadius: 4, width: `${pct}%` as any, backgroundColor: color }} />
      </View>
    </View>
  )
}

const catColors: Record<string, string> = {
  greeting: '#4F46E5', number: '#059669', time: '#D97706',
  food: '#DC2626', transport: '#0284C7', shopping: '#7C3AED',
  weather: '#F59E0B', family: '#EC4899', work: '#6366F1',
  color: '#E11D48', body: '#0891B2', place: '#65A30D',
  adjective: '#9333EA', verb: '#EA580C', noun: '#0D9488',
  adverb: '#10B981', expression: '#F97316',
}

export default function ProgressScreen() {
  const { t } = useTranslation()
  const { colors, themeMode, setThemeMode } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [notifHour, setNotifHour] = useState(9)

  useEffect(() => {
    loadProgress().then(setProgress)
    getNotificationSettings().then(s => {
      setNotifEnabled(s.enabled)
      setNotifHour(s.hour)
    })
  }, [])

  if (!progress) return null

  const dueCards = getDueCards(progress.srsCards)

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const handleReset = () => {
    Alert.alert(t('progress.resetTitle'), t('progress.resetMessage'), [
      { text: t('progress.resetCancel'), style: 'cancel' },
      {
        text: t('progress.resetConfirm'), style: 'destructive',
        onPress: async () => {
          await resetProgress()
          const p = await loadProgress()
          setProgress(p)
        }
      }
    ])
  }

  const themeModes: Array<{ mode: ThemeMode; label: string }> = [
    { mode: 'light', label: t('progress.themeLight') },
    { mode: 'dark', label: t('progress.themeDark') },
    { mode: 'system', label: t('progress.themeSystem') },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.pageTitle}>{t('progress.title')}</Text>
        <Text style={styles.pageSub}>{t('progress.subtitle')}</Text>

        {/* Summary */}
        <View style={styles.summaryRow}>
          {[
            { num: progress.totalWordsLearned, label: t('progress.learnedWords'), color: colors.primary },
            { num: progress.streak, label: t('progress.streakDays'), color: '#EA580C' },
            { num: dueCards.length, label: t('progress.dueReview'), color: '#DC2626' },
            { num: progress.srsCards.filter(c => c.interval >= 7).length, label: t('progress.mastered'), color: '#16A34A' },
          ].map((item, i) => (
            <View key={i} style={styles.summaryBox}>
              <Text style={[styles.summaryNum, { color: item.color }]}>{item.num}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Category Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('progress.categorySection')}</Text>
          {Object.entries(categoryInfo).map(([key, info]) => {
            const total = allVocabulary.filter(v => v.category === key).length
            const learned = progress.categoryProgress[key]?.learned ?? 0
            return (
              <ProgressBar
                key={key}
                label={info.label}
                emoji={info.emoji}
                learned={learned}
                total={total}
                color={catColors[key] ?? colors.primary}
                colors={colors}
              />
            )
          })}
        </View>

        {/* 7-day chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('progress.weekSection')}</Text>
          <View style={styles.chartRow}>
            {last7Days.map(date => {
              const day = progress.dailyHistory.find(d => d.date === date)
              const words = (day?.newWordsLearned ?? 0) + (day?.wordsReviewed ?? 0)
              const label = new Date(date + 'T00:00:00').toLocaleDateString('zh-TW', { weekday: 'short' })
              const maxH = 60
              const barH = words > 0 ? Math.max(8, Math.min(maxH, words * 4)) : 4
              return (
                <View key={date} style={styles.chartCol}>
                  <Text style={styles.chartNum}>{words > 0 ? words : ''}</Text>
                  <View style={styles.chartBarBg}>
                    <View style={[styles.chartBarFill, { height: barH, backgroundColor: words > 0 ? colors.primary : colors.border }]} />
                  </View>
                  <Text style={styles.chartLabel}>{label}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* SRS status */}
        {progress.srsCards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('progress.srsSection')}</Text>
            <View style={styles.srsRow}>
              <View style={[styles.srsBox, { backgroundColor: '#FEF2F2' }]}>
                <Text style={[styles.srsNum, { color: '#DC2626' }]}>{dueCards.length}</Text>
                <Text style={styles.srsLabel}>{t('progress.srsDueToday')}</Text>
              </View>
              <View style={[styles.srsBox, { backgroundColor: '#EFF6FF' }]}>
                <Text style={[styles.srsNum, { color: '#2563EB' }]}>
                  {progress.srsCards.filter(c => {
                    const d = new Date(c.nextReview)
                    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
                    return d > new Date() && d <= tomorrow
                  }).length}
                </Text>
                <Text style={styles.srsLabel}>{t('progress.srsDueTomorrow')}</Text>
              </View>
              <View style={[styles.srsBox, { backgroundColor: '#F0FDF4' }]}>
                <Text style={[styles.srsNum, { color: '#16A34A' }]}>
                  {progress.srsCards.filter(c => c.interval >= 7).length}
                </Text>
                <Text style={styles.srsLabel}>{t('progress.srsMastered')}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('progress.notifSection')}</Text>
          <View style={styles.notifRow}>
            <Text style={styles.notifLabel}>{t('progress.notifToggleLabel')}</Text>
            <TouchableOpacity
              style={[styles.toggle, notifEnabled && styles.toggleOn]}
              onPress={async () => {
                if (notifEnabled) {
                  await cancelNotifications()
                  setNotifEnabled(false)
                } else {
                  await scheduleDaily(notifHour)
                  setNotifEnabled(true)
                }
              }}
            >
              <View style={[styles.toggleThumb, notifEnabled && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
          {notifEnabled && (
            <View style={styles.hourRow}>
              <Text style={styles.notifLabel}>{t('progress.notifTimeLabel')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[7, 8, 9, 10, 12, 18, 20, 21, 22].map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.hourBtn, notifHour === h && styles.hourBtnActive]}
                    onPress={async () => {
                      setNotifHour(h)
                      await scheduleDaily(h)
                    }}
                  >
                    <Text style={[styles.hourText, notifHour === h && styles.hourTextActive]}>
                      {h}:00
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>語言 / Language</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {SUPPORTED_LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langBtn, i18n.language === lang.code && styles.langBtnActive]}
                onPress={async () => {
                  await i18n.changeLanguage(lang.code)
                  await setLocale(lang.code)
                }}
              >
                <Text style={[styles.langBtnText, i18n.language === lang.code && styles.langBtnTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('progress.themeSection')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {themeModes.map(item => (
              <TouchableOpacity
                key={item.mode}
                style={[styles.langBtn, themeMode === item.mode && styles.langBtnActive]}
                onPress={() => setThemeMode(item.mode)}
              >
                <Text style={[styles.langBtnText, themeMode === item.mode && styles.langBtnTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetText}>{t('progress.resetBtn')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    pageTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    pageSub: { fontSize: 14, color: colors.subtext, marginBottom: 20 },
    summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    summaryBox: {
      width: '47%', backgroundColor: colors.card, borderRadius: 14, padding: 14,
      alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    },
    summaryNum: { fontSize: 28, fontWeight: 'bold' },
    summaryLabel: { fontSize: 12, color: colors.subtext, marginTop: 4, textAlign: 'center' },
    section: {
      backgroundColor: colors.card, borderRadius: 16, padding: 16,
      marginBottom: 16, borderWidth: 1, borderColor: colors.border,
    },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 14 },
    chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    chartCol: { alignItems: 'center', flex: 1 },
    chartNum: { fontSize: 10, color: colors.primary, fontWeight: '600', marginBottom: 4, height: 14 },
    chartBarBg: { width: 28, height: 60, justifyContent: 'flex-end' },
    chartBarFill: { width: 28, borderRadius: 4 },
    chartLabel: { fontSize: 10, color: colors.subtext, marginTop: 4 },
    srsRow: { flexDirection: 'row', gap: 10 },
    srsBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
    srsNum: { fontSize: 24, fontWeight: 'bold' },
    srsLabel: { fontSize: 11, color: colors.subtext, marginTop: 2 },
    notifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    notifLabel: { fontSize: 14, color: colors.text },
    toggle: {
      width: 48, height: 28, borderRadius: 14, backgroundColor: colors.border,
      justifyContent: 'center', padding: 2,
    },
    toggleOn: { backgroundColor: colors.primary },
    toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
    toggleThumbOn: { alignSelf: 'flex-end' },
    hourRow: { marginTop: 4 },
    hourBtn: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border, marginRight: 8, backgroundColor: colors.bg,
    },
    hourBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    hourText: { fontSize: 13, color: colors.subtext, fontWeight: '500' },
    hourTextActive: { color: '#fff' },
    resetBtn: {
      borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 12,
      padding: 14, alignItems: 'center', marginBottom: 20,
    },
    resetText: { color: '#DC2626', fontSize: 14, fontWeight: '500' },
    langBtn: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg,
    },
    langBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    langBtnText: { fontSize: 13, color: colors.subtext, fontWeight: '500' },
    langBtnTextActive: { color: '#fff' },
  })
}
