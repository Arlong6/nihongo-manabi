import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity,
  ActivityIndicator, Linking, RefreshControl, ViewToken,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { VideoView, useVideoPlayer } from 'expo-video'
import { useTheme } from '../lib/theme'
import type { ThemeColors } from '../lib/theme'

const FEED_URL = 'https://nihongo-manabi-proxy.vercel.app/api/feed'
const APP_REDIRECT_BASE = 'https://nihongo-manabi-proxy.vercel.app'

type FeedItem = {
  filename: string
  stem: string
  theme: string
  video_url: string
  caption: string
  uploaded_at: string
  redirect_path: string
}

// Theme → emoji + readable label, used for the small badge on each card.
const THEME_BADGES: Record<string, { emoji: string; label: string; color: string }> = {
  vocab: { emoji: '📚', label: '每日單字', color: '#3B82F6' },
  kana: { emoji: 'あ', label: '假名', color: '#EC4899' },
  grammar: { emoji: '✏️', label: '文法', color: '#10B981' },
  travel: { emoji: '✈️', label: '旅遊', color: '#F59E0B' },
  anime: { emoji: '🎬', label: '動漫台詞', color: '#A855F7' },
  oops: { emoji: '⚠️', label: '觀光踩雷', color: '#EF4444' },
  other: { emoji: '🌸', label: 'Reel', color: '#6B7280' },
}

export default function WatchScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const navigation = useNavigation<any>()
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const { height: WINDOW_H, width: WINDOW_W } = Dimensions.get('window')

  const fetchFeed = useCallback(async () => {
    try {
      const r = await fetch(FEED_URL)
      const j = await r.json()
      const arr: FeedItem[] = Array.isArray(j?.items) ? j.items : []
      setItems(arr)
    } catch (e) {
      console.warn('feed fetch failed', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchFeed() }, [fetchFeed])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchFeed()
  }, [fetchFeed])

  // FlatList viewability callback: track which index is "the" visible one so
  // we only autoplay it. Threshold 80% guards against partial-scroll glitches.
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 80 })
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && typeof viewableItems[0].index === 'number') {
      setActiveIndex(viewableItems[0].index)
    }
  })

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingLabel, { color: colors.subtext }]}>載入中...</Text>
      </SafeAreaView>
    )
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text style={[styles.loadingLabel, { color: colors.subtext }]}>還沒有影片，稍後再來看</Text>
      </SafeAreaView>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <FlatList
        data={items}
        keyExtractor={item => item.filename}
        renderItem={({ item, index }) => (
          <ReelCard
            item={item}
            isActive={index === activeIndex}
            height={WINDOW_H}
            width={WINDOW_W}
            colors={colors}
          />
        )}
        pagingEnabled
        snapToInterval={WINDOW_H}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        viewabilityConfig={viewConfigRef.current}
        onViewableItemsChanged={onViewableItemsChanged.current}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      />
      <TouchableOpacity
        style={cardStyles.closeBtn}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={cardStyles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>
  )
}

interface ReelCardProps {
  item: FeedItem
  isActive: boolean
  height: number
  width: number
  colors: ThemeColors
}

function ReelCard({ item, isActive, height, width, colors }: ReelCardProps) {
  const player = useVideoPlayer(item.video_url, p => {
    p.loop = true
    p.muted = false
  })

  useEffect(() => {
    if (isActive) {
      player.play()
    } else {
      player.pause()
      // Reset to start so when the user scrolls back they don't catch the tail.
      try { player.currentTime = 0 } catch { /* ignore */ }
    }
  }, [isActive, player])

  const badge = THEME_BADGES[item.theme] || THEME_BADGES.other
  const captionLines = (item.caption || '').split('\n').filter(Boolean)
  // First line is the hook; everything before hashtags is the bulk we surface.
  const visibleLines = captionLines
    .filter(l => !l.startsWith('#') && !l.startsWith('📲'))
    .slice(0, 3)

  const openInBrowser = () => {
    Linking.openURL(`${APP_REDIRECT_BASE}${item.redirect_path}`).catch(() => {})
  }

  const togglePlay = () => {
    if (player.playing) player.pause()
    else player.play()
  }

  return (
    <View style={[cardStyles.card, { width, height }]}>
      <TouchableOpacity activeOpacity={1} onPress={togglePlay} style={StyleSheet.absoluteFill}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      </TouchableOpacity>

      <View style={[cardStyles.themeBadge, { backgroundColor: badge.color }]}>
        <Text style={cardStyles.themeBadgeText}>
          {badge.emoji} {badge.label}
        </Text>
      </View>

      <View style={cardStyles.captionOverlay}>
        {visibleLines.map((line, i) => (
          <Text key={i} style={[cardStyles.captionLine, i === 0 && cardStyles.captionFirst]} numberOfLines={2}>
            {line}
          </Text>
        ))}
        <Text style={cardStyles.filenameTag}>{item.stem}</Text>
      </View>

      <TouchableOpacity style={cardStyles.ctaButton} onPress={openInBrowser}>
        <Text style={cardStyles.ctaText}>📲 學更多</Text>
      </TouchableOpacity>
    </View>
  )
}

const cardStyles = StyleSheet.create({
  card: { backgroundColor: '#000', position: 'relative' },
  themeBadge: {
    position: 'absolute', top: 60, left: 16, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
  },
  themeBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  captionOverlay: {
    position: 'absolute', left: 16, right: 96, bottom: 40, gap: 6,
  },
  captionLine: { color: '#fff', fontSize: 15, lineHeight: 21, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },
  captionFirst: { fontSize: 18, fontWeight: '700' },
  filenameTag: { color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 8, letterSpacing: 1 },
  ctaButton: {
    position: 'absolute', right: 16, bottom: 96, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 999,
  },
  ctaText: { fontWeight: '800', color: '#111', fontSize: 14 },
  closeBtn: {
    position: 'absolute', top: 56, right: 16, width: 36, height: 36,
    borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  closeText: { color: '#fff', fontSize: 18, fontWeight: '700' },
})

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    loading: {
      flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16,
      backgroundColor: colors.bg,
    },
    loadingLabel: { fontSize: 14 },
  })
}
