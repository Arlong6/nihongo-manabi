import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import * as Haptics from 'expo-haptics'
import { speakJapanese } from '../lib/speech'
import { useTheme, fonts } from '../lib/theme'
import type { ThemeColors } from '../lib/theme'
import { startConversation, sendMessage, type AIResponse, type ChatMessage } from '../lib/gemini'
import { recordDailyActivity, getAIChatUsage, incrementAIChatUsage, AI_CHAT_DAILY_LIMIT } from '../lib/storage'

type ScreenMode = 'menu' | 'chat' | 'result'
type Level = 'N5' | 'N4' | 'N3'

interface Scene {
  id: string
  emoji: string
  nameKey: string
  descKey: string
  prompt: string
}

const SCENES: Scene[] = [
  { id: 'restaurant', emoji: '🍣', nameKey: 'aiChat.sceneRestaurant', descKey: 'aiChat.sceneRestaurantDesc', prompt: 'Japanese restaurant - ordering food, asking about menu' },
  { id: 'konbini', emoji: '🏪', nameKey: 'aiChat.sceneKonbini', descKey: 'aiChat.sceneKonbiniDesc', prompt: 'Convenience store (konbini) - buying items, asking for things' },
  { id: 'station', emoji: '🚉', nameKey: 'aiChat.sceneStation', descKey: 'aiChat.sceneStationDesc', prompt: 'Train station - asking directions, buying tickets' },
  { id: 'hotel', emoji: '🏨', nameKey: 'aiChat.sceneHotel', descKey: 'aiChat.sceneHotelDesc', prompt: 'Hotel - checking in, asking about facilities, requesting services' },
  { id: 'shopping', emoji: '🛍️', nameKey: 'aiChat.sceneShopping', descKey: 'aiChat.sceneShoppingDesc', prompt: 'Shopping at a clothing or electronics store - asking prices, sizes, colors' },
  { id: 'clinic', emoji: '🏥', nameKey: 'aiChat.sceneClinic', descKey: 'aiChat.sceneClinicDesc', prompt: 'Clinic or pharmacy - describing symptoms, asking about medicine' },
  { id: 'freeChat', emoji: '💬', nameKey: 'aiChat.sceneFreeChat', descKey: 'aiChat.sceneFreeChatDesc', prompt: 'Casual daily conversation with a Japanese friend' },
]

interface BubbleMessage {
  id: number
  role: 'user' | 'ai'
  text: string
  reading?: string
  translation?: string
  correction?: string
  hint?: string
}

export default function AIConversationScreen() {
  const { t, i18n } = useTranslation()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const [mode, setMode] = useState<ScreenMode>('menu')
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const [level, setLevel] = useState<Level>('N5')
  const [messages, setMessages] = useState<BubbleMessage[]>([])
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [corrections, setCorrections] = useState(0)
  const [showReading, setShowReading] = useState(true)
  const [usageCount, setUsageCount] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const inputRef = useRef<TextInput>(null)
  const msgIdRef = useRef(0)

  useEffect(() => {
    getAIChatUsage().then(u => setUsageCount(u.count))
  }, [mode])

  const nextId = () => ++msgIdRef.current

  const handleStartChat = async (scene: Scene) => {
    const usage = await getAIChatUsage()
    if (usage.count >= AI_CHAT_DAILY_LIMIT) {
      Alert.alert(t('aiChat.limitTitle'), t('aiChat.limitMessage', { limit: AI_CHAT_DAILY_LIMIT }))
      return
    }

    setSelectedScene(scene)
    setMode('chat')
    setMessages([])
    setChatHistory([])
    setMessageCount(0)
    setCorrections(0)
    setLoading(true)

    const updated = await incrementAIChatUsage()
    setUsageCount(updated.count)

    try {
      const res = await startConversation(scene.prompt, level, i18n.language)
      const aiBubble: BubbleMessage = {
        id: nextId(),
        role: 'ai',
        text: res.japanese,
        reading: res.reading,
        translation: res.translation,
        hint: res.hint,
      }
      setMessages([aiBubble])
      setChatHistory([{ role: 'model', text: res.japanese }])
      speakJapanese(res.japanese)
    } catch (err) {
      Alert.alert('Error', t('aiChat.apiError'))
      setMode('menu')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    const text = inputText.trim()
    if (!text || loading || !selectedScene) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setInputText('')
    inputRef.current?.clear()

    const userBubble: BubbleMessage = { id: nextId(), role: 'user', text }
    setMessages(prev => [...prev, userBubble])
    setLoading(true)

    try {
      const res = await sendMessage(text, chatHistory, selectedScene.prompt, level, i18n.language)

      const aiBubble: BubbleMessage = {
        id: nextId(),
        role: 'ai',
        text: res.japanese,
        reading: res.reading,
        translation: res.translation,
        correction: res.correction ?? undefined,
        hint: res.hint ?? undefined,
      }
      setMessages(prev => [...prev, aiBubble])
      setChatHistory(prev => [
        ...prev,
        { role: 'user', text },
        { role: 'model', text: res.japanese },
      ])
      setMessageCount(prev => prev + 1)
      if (res.correction) setCorrections(prev => prev + 1)
      speakJapanese(res.japanese)
    } catch (err) {
      const errorBubble: BubbleMessage = {
        id: nextId(),
        role: 'ai',
        text: t('aiChat.apiError'),
      }
      setMessages(prev => [...prev, errorBubble])
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    await recordDailyActivity(0, messageCount, 0, 0)
    setMode('result')
  }

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }, [messages])

  // ─── Menu ───
  if (mode === 'menu') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.menuContent}>
          <Text style={styles.title}>{t('aiChat.title')}</Text>
          <Text style={styles.subtitle}>{t('aiChat.subtitle')}</Text>

          {/* Usage banner */}
          <View style={[styles.usageBanner, usageCount >= AI_CHAT_DAILY_LIMIT && styles.usageBannerExhausted]}>
            <Text style={usageCount >= AI_CHAT_DAILY_LIMIT ? styles.usageTextExhausted : styles.usageText}>
              {usageCount >= AI_CHAT_DAILY_LIMIT
                ? t('aiChat.limitReached')
                : t('aiChat.usageRemaining', { remaining: AI_CHAT_DAILY_LIMIT - usageCount, limit: AI_CHAT_DAILY_LIMIT })}
            </Text>
          </View>

          {/* Level selector */}
          <View style={styles.levelRow}>
            {(['N5', 'N4', 'N3'] as Level[]).map(lv => (
              <TouchableOpacity
                key={lv}
                style={[styles.levelChip, level === lv && styles.levelChipActive]}
                onPress={() => { setLevel(lv); Haptics.selectionAsync() }}
              >
                <Text style={[styles.levelText, level === lv && styles.levelTextActive]}>{lv}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>{t('aiChat.chooseScene')}</Text>

          {SCENES.map(scene => {
            const exhausted = usageCount >= AI_CHAT_DAILY_LIMIT
            return (
              <TouchableOpacity
                key={scene.id}
                style={[styles.sceneCard, exhausted && styles.sceneCardDisabled]}
                onPress={() => handleStartChat(scene)}
                activeOpacity={0.7}
                disabled={exhausted}
              >
                <Text style={styles.sceneEmoji}>{scene.emoji}</Text>
                <View style={styles.sceneInfo}>
                  <Text style={styles.sceneName}>{t(scene.nameKey)}</Text>
                  <Text style={styles.sceneDesc}>{t(scene.descKey)}</Text>
                </View>
              </TouchableOpacity>
            )
          })}

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>{t('aiChat.tipTitle')}</Text>
            <Text style={styles.tipText}>{t('aiChat.tip1')}</Text>
            <Text style={styles.tipText}>{t('aiChat.tip2')}</Text>
            <Text style={styles.tipText}>{t('aiChat.tip3')}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ─── Result ───
  if (mode === 'result') {
    const accuracy = messageCount > 0 ? Math.round(((messageCount - corrections) / messageCount) * 100) : 100
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContent}>
          <Text style={styles.resultEmoji}>{accuracy >= 80 ? '🎉' : accuracy >= 50 ? '💪' : '📚'}</Text>
          <Text style={styles.resultTitle}>{t('aiChat.resultTitle')}</Text>

          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{messageCount}</Text>
              <Text style={styles.statLabel}>{t('aiChat.statMessages')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{corrections}</Text>
              <Text style={styles.statLabel}>{t('aiChat.statCorrections')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{accuracy}%</Text>
              <Text style={styles.statLabel}>{t('aiChat.statAccuracy')}</Text>
            </View>
          </View>

          <Text style={styles.resultMsg}>
            {accuracy >= 80 ? t('aiChat.resultMsg80') : accuracy >= 50 ? t('aiChat.resultMsg50') : t('aiChat.resultMsgLow')}
          </Text>

          {/* Show corrections from the conversation */}
          {messages.filter(m => m.correction).length > 0 && (
            <View style={styles.correctionSection}>
              <Text style={styles.correctionSectionTitle}>{t('aiChat.correctionsReview')}</Text>
              {messages.filter(m => m.correction).map(m => (
                <View key={m.id} style={styles.correctionCard}>
                  <Text style={styles.correctionText}>{m.correction}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={() => setMode('menu')}>
            <Text style={styles.primaryBtnText}>{t('common.return')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ─── Chat ───
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={handleFinish}>
            <Text style={styles.backBtn}>{t('aiChat.finish')}</Text>
          </TouchableOpacity>
          <Text style={styles.chatTitle}>
            {selectedScene?.emoji} {t(selectedScene?.nameKey ?? '')}
          </Text>
          <TouchableOpacity onPress={() => setShowReading(!showReading)}>
            <Text style={styles.toggleBtn}>{showReading ? t('aiChat.hideReading') : t('aiChat.showReading')}</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatMessages}
          contentContainerStyle={styles.chatMessagesContent}
        >
          {messages.map(msg => (
            <View key={msg.id} style={msg.role === 'user' ? styles.userBubbleRow : styles.aiBubbleRow}>
              <View style={msg.role === 'user' ? styles.userBubble : styles.aiBubble}>
                <Text style={msg.role === 'user' ? styles.userBubbleText : styles.aiBubbleText}>
                  {msg.text}
                </Text>
                {msg.role === 'ai' && showReading && msg.reading ? (
                  <Text style={styles.readingText}>{msg.reading}</Text>
                ) : null}
                {msg.role === 'ai' && msg.translation ? (
                  <Text style={styles.translationText}>{msg.translation}</Text>
                ) : null}
                {msg.correction ? (
                  <View style={styles.correctionBubble}>
                    <Text style={styles.correctionLabel}>{t('aiChat.correctionLabel')}</Text>
                    <Text style={styles.correctionBubbleText}>{msg.correction}</Text>
                  </View>
                ) : null}
                {msg.hint ? (
                  <TouchableOpacity
                    style={styles.hintBubble}
                    onPress={() => setInputText(msg.hint ?? '')}
                  >
                    <Text style={styles.hintLabel}>{t('aiChat.hintLabel')}</Text>
                    <Text style={styles.hintText}>{msg.hint}</Text>
                  </TouchableOpacity>
                ) : null}
                {msg.role === 'ai' && msg.text && !msg.text.includes('Error') ? (
                  <TouchableOpacity
                    style={styles.speakBtn}
                    onPress={() => speakJapanese(msg.text)}
                  >
                    <Text style={styles.speakBtnText}>🔊</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
          {loading && (
            <View style={styles.aiBubbleRow}>
              <View style={styles.aiBubble}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('aiChat.inputPlaceholder')}
            placeholderTextColor={colors.subtext}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!loading}
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },

    // ─── Menu ───
    menuContent: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 4, marginTop: 8, letterSpacing: -0.5 },
    subtitle: { fontSize: 15, color: colors.subtext, marginBottom: 20 },
    levelRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    levelChip: {
      paddingHorizontal: 20, paddingVertical: 10, borderRadius: 9999,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    levelChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    levelText: { fontSize: 14, fontWeight: '600', color: colors.subtext, letterSpacing: 0.2 },
    levelTextActive: { color: colors.onPrimary },
    sectionLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12, letterSpacing: -0.3 },
    sceneCard: {
      flexDirection: 'row', alignItems: 'center', padding: 18,
      backgroundColor: colors.card, borderRadius: 20, marginBottom: 10,
      borderWidth: 1, borderColor: colors.border,
    },
    sceneCardDisabled: { opacity: 0.4 },
    usageBanner: {
      padding: 14, borderRadius: 16, marginBottom: 16,
      backgroundColor: colors.cardSoft, borderWidth: 1, borderColor: colors.border,
    },
    usageBannerExhausted: {
      backgroundColor: colors.warningSoft, borderColor: colors.warning,
    },
    usageText: { fontSize: 13, color: colors.subtext, textAlign: 'center', letterSpacing: 0.2 },
    usageTextExhausted: { fontSize: 13, color: colors.warning, textAlign: 'center', fontWeight: '600' },
    sceneEmoji: { fontSize: 30, marginRight: 14 },
    sceneInfo: { flex: 1 },
    sceneName: { fontSize: 16, fontWeight: '600', color: colors.text, letterSpacing: -0.2 },
    sceneDesc: { fontSize: 13, color: colors.subtext, marginTop: 3, lineHeight: 18 },
    tipBox: {
      marginTop: 20, padding: 16, backgroundColor: colors.cardSoft,
      borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    },
    tipTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 8 },
    tipText: { fontSize: 13, color: colors.subtext, marginBottom: 4, lineHeight: 18 },

    // ─── Chat ───
    chatContainer: { flex: 1 },
    chatHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bg,
    },
    backBtn: { fontSize: 15, color: colors.primary, fontWeight: '600' },
    chatTitle: { fontSize: 16, fontWeight: '600', color: colors.text, letterSpacing: -0.2 },
    toggleBtn: { fontSize: 12, color: colors.primary, fontWeight: '500' },
    chatMessages: { flex: 1 },
    chatMessagesContent: { padding: 16, paddingBottom: 8 },

    userBubbleRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 14 },
    aiBubbleRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 14 },
    userBubble: {
      maxWidth: '78%', padding: 14, borderRadius: 20,
      borderBottomRightRadius: 6, backgroundColor: colors.primarySoft,
      borderWidth: 1, borderColor: colors.primary,
    },
    aiBubble: {
      maxWidth: '82%', padding: 14, borderRadius: 20,
      borderBottomLeftRadius: 6, backgroundColor: colors.aiSoft,
      borderWidth: 1, borderColor: colors.aiAccent,
    },
    userBubbleText: { fontSize: 17, color: colors.primaryDeep, lineHeight: 26, fontFamily: fonts.jpSerif, letterSpacing: 0.3 },
    aiBubbleText: { fontSize: 17, color: colors.text, lineHeight: 26, fontFamily: fonts.jpSerif, letterSpacing: 0.3 },
    readingText: { fontSize: 12, color: colors.subtext, marginTop: 6, fontFamily: fonts.jpSerif, letterSpacing: 0.3 },
    translationText: { fontSize: 13, color: colors.subtext, marginTop: 4, lineHeight: 18 },

    correctionBubble: {
      marginTop: 10, padding: 10, borderRadius: 12,
      backgroundColor: colors.warningSoft,
      borderWidth: 1, borderColor: colors.warning,
    },
    correctionLabel: { fontSize: 11, fontWeight: '700', color: colors.warning, marginBottom: 4, letterSpacing: 0.3 },
    correctionBubbleText: { fontSize: 13, color: colors.text, lineHeight: 18 },

    hintBubble: {
      marginTop: 10, padding: 12, borderRadius: 12,
      backgroundColor: colors.cardSoft,
      borderWidth: 1, borderColor: colors.border,
    },
    hintLabel: { fontSize: 11, fontWeight: '700', color: colors.subtext, marginBottom: 4, letterSpacing: 0.3 },
    hintText: { fontSize: 15, color: colors.text, fontWeight: '500', lineHeight: 22, fontFamily: fonts.jpSerif, letterSpacing: 0.3 },

    speakBtn: { marginTop: 8, alignSelf: 'flex-start' },
    speakBtnText: { fontSize: 18 },

    // ─── Input ───
    inputBar: {
      flexDirection: 'row', alignItems: 'center', padding: 12,
      borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg,
    },
    textInput: {
      flex: 1, height: 48, paddingHorizontal: 16, borderRadius: 24,
      backgroundColor: colors.cardSoft, color: colors.text, fontSize: 16,
      borderWidth: 1, borderColor: colors.border, fontFamily: fonts.jpSerif,
    },
    sendBtn: {
      width: 48, height: 48, borderRadius: 24, marginLeft: 8,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.4 },
    sendBtnText: { fontSize: 20, color: colors.onPrimary, fontWeight: '700' },

    // ─── Result ───
    resultContent: { padding: 24, alignItems: 'center', paddingBottom: 40 },
    resultEmoji: { fontSize: 64, marginBottom: 16, marginTop: 40 },
    resultTitle: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 24, letterSpacing: -0.5 },
    statRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statBox: {
      alignItems: 'center', padding: 18, borderRadius: 16,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, minWidth: 90,
    },
    statNumber: { fontSize: 28, fontWeight: '700', color: colors.primary, letterSpacing: -0.3 },
    statLabel: { fontSize: 12, color: colors.subtext, marginTop: 4 },
    resultMsg: { fontSize: 16, color: colors.text, textAlign: 'center', marginBottom: 24, lineHeight: 24 },

    correctionSection: { width: '100%', marginBottom: 24 },
    correctionSectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
    correctionCard: {
      padding: 14, borderRadius: 16, marginBottom: 8,
      backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warning,
    },
    correctionText: { fontSize: 14, color: colors.text, lineHeight: 20 },

    primaryBtn: {
      paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16,
      backgroundColor: colors.primary,
    },
    primaryBtnText: { fontSize: 16, fontWeight: '600', color: colors.onPrimary, letterSpacing: 0.2 },
  })
}
