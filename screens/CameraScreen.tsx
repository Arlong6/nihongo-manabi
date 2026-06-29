import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
  SafeAreaView, Image, Alert, Pressable,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { useTheme } from '../lib/theme'
import type { ThemeColors } from '../lib/theme'
import { ocrAndTranslate, type OCRResult } from '../lib/gemini-vision'
import { isPro } from '../lib/iap'
import { getCameraUsage, incrementCameraUsage, CAMERA_DAILY_LIMIT } from '../lib/storage'

type Phase = 'capture' | 'processing' | 'result'

export default function CameraScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const navigation = useNavigation<any>()
  const [permission, requestPermission] = useCameraPermissions()
  const cameraRef = useRef<CameraView>(null)
  const [phase, setPhase] = useState<Phase>('capture')
  const [previewUri, setPreviewUri] = useState<string | null>(null)
  const [result, setResult] = useState<OCRResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pro, setPro] = useState(false)

  useEffect(() => {
    isPro().then(setPro)
  }, [])

  // Downsample + compress on-device so the payload fits in the proxy's 5MB limit
  // (and so Gemini doesn't pay for processing huge images we don't need).
  const compressAndOCR = useCallback(async (uri: string) => {
    // Pro unlocks unlimited photo translation; free tier gets CAMERA_DAILY_LIMIT/day.
    // Recompute isPro() live so a mid-session upgrade takes effect without relaunch.
    const currentlyPro = pro || await isPro()
    if (!currentlyPro) {
      const usage = await getCameraUsage()
      if (usage.count >= CAMERA_DAILY_LIMIT) {
        setPreviewUri(null)
        setPhase('capture')
        Alert.alert(
          '今日拍照翻譯已用完',
          `免費版每天可翻譯 ${CAMERA_DAILY_LIMIT} 次，升級 Pro 即可無限使用。`,
          [
            { text: '取消', style: 'cancel' },
            { text: '升級 Pro 解鎖', onPress: () => navigation.navigate('Paywall') },
          ],
        )
        return
      }
    }
    setPhase('processing')
    setError(null)
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1000 } }],
        { compress: 0.55, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      )
      if (!manipulated.base64) throw new Error('failed to encode image')
      const r = await ocrAndTranslate(manipulated.base64, 'image/jpeg')
      // Count only successful translations so a failed OCR doesn't burn the quota.
      if (!currentlyPro) await incrementCameraUsage()
      setResult(r)
      setPhase('result')
    } catch (e: any) {
      setError(e?.message ?? '辨識失敗')
      setPhase('capture')
    }
  }, [pro, navigation])

  const takePhoto = async () => {
    if (!cameraRef.current) return
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: true })
      if (!photo?.uri) return
      setPreviewUri(photo.uri)
      await compressAndOCR(photo.uri)
    } catch (e: any) {
      Alert.alert('拍照失敗', e?.message ?? '請再試一次')
    }
  }

  const pickFromLibrary = async () => {
    const granted = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!granted.granted) {
      Alert.alert('需要相簿權限', '請到 設定 → Nihongo Manabi 開啟相簿存取')
      return
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    })
    if (picked.canceled || !picked.assets?.[0]?.uri) return
    setPreviewUri(picked.assets[0].uri)
    await compressAndOCR(picked.assets[0].uri)
  }

  const reset = () => {
    setPreviewUri(null)
    setResult(null)
    setError(null)
    setPhase('capture')
  }

  // Permission gate — first launch will prompt automatically once requestPermission() is called.
  if (!permission) {
    return <SafeAreaView style={styles.gate}><ActivityIndicator color={colors.primary} /></SafeAreaView>
  }
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.gate}>
        <Text style={styles.gateTitle}>需要相機權限</Text>
        <Text style={styles.gateBody}>
          這個功能會用相機辨識日文招牌或菜單，影像不會被儲存到我們的伺服器
        </Text>
        <TouchableOpacity style={styles.gateBtn} onPress={requestPermission}>
          <Text style={styles.gateBtnText}>開啟權限</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  if (phase === 'processing') {
    return (
      <SafeAreaView style={styles.gate}>
        {previewUri && <Image source={{ uri: previewUri }} style={styles.previewImg} />}
        <ActivityIndicator color="#fff" size="large" style={{ marginTop: 24 }} />
        <Text style={styles.processingLabel}>讀取日文中...</Text>
      </SafeAreaView>
    )
  }

  if (phase === 'result' && result) {
    return (
      <SafeAreaView style={[styles.gate, { backgroundColor: colors.bg }]}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>📸 辨識結果</Text>
            <TouchableOpacity onPress={reset}>
              <Text style={styles.resetText}>重拍 ↻</Text>
            </TouchableOpacity>
          </View>
          {previewUri && <Image source={{ uri: previewUri }} style={styles.thumb} />}

          {result.detected ? (
            <>
              <View style={styles.resultBlock}>
                <Text style={styles.resultLabel}>日文原文</Text>
                <Text style={styles.resultJa}>{result.detected}</Text>
              </View>
              <View style={[styles.resultBlock, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.resultLabel, { color: colors.primaryDeep }]}>繁體中文翻譯</Text>
                <Text style={styles.resultZh}>{result.translation}</Text>
              </View>
              {result.breakdown.length > 0 && (
                <View style={styles.resultBlock}>
                  <Text style={styles.resultLabel}>關鍵單字</Text>
                  {result.breakdown.map((b, i) => (
                    <View key={i} style={styles.wordRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.wordJa}>{b.word}</Text>
                        <Text style={styles.wordReading}>{b.reading}</Text>
                      </View>
                      <Text style={styles.wordMeaning}>{b.meaning}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.resultBlock}>
              <Text style={styles.resultJa}>沒辨識到日文。換個角度或更近一點再試。</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      <View style={styles.scrim}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'space-between' }}>
          <View style={styles.topBar}>
            <Text style={styles.topHint}>📸 對準日文招牌或菜單</Text>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.libraryBtn} onPress={pickFromLibrary}>
              <Text style={styles.libraryBtnText}>🖼️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shutter} onPress={takePhoto} />
            <View style={styles.libraryBtn} />
          </View>
        </SafeAreaView>
      </View>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    gate: {
      flex: 1, backgroundColor: '#000', alignItems: 'center',
      justifyContent: 'center', padding: 32, gap: 16,
    },
    gateTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
    gateBody: { color: '#cbd5e1', fontSize: 14, textAlign: 'center', lineHeight: 22 },
    gateBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
    gateBtnText: { color: '#fff', fontWeight: '700' },
    previewImg: { width: '90%', aspectRatio: 1, borderRadius: 16, resizeMode: 'cover' },
    processingLabel: { color: '#fff', fontSize: 15, marginTop: 14 },
    scrim: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    topHint: { color: '#fff', fontSize: 14, fontWeight: '600' },
    closeBtn: {
      color: '#fff', fontSize: 22, fontWeight: '600',
      width: 36, height: 36, textAlign: 'center', lineHeight: 36,
      backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 18, overflow: 'hidden',
    },
    bottomBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
      paddingBottom: 40, paddingHorizontal: 32,
    },
    shutter: {
      width: 76, height: 76, borderRadius: 38,
      backgroundColor: '#fff', borderWidth: 5, borderColor: 'rgba(255,255,255,0.5)',
    },
    libraryBtn: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center', justifyContent: 'center',
    },
    libraryBtnText: { fontSize: 26 },
    errorBanner: {
      position: 'absolute', top: 60, left: 20, right: 20,
      backgroundColor: '#EF4444', padding: 12, borderRadius: 8,
    },
    errorText: { color: '#fff', textAlign: 'center', fontSize: 13 },
    resultHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 16,
    },
    resultTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
    resetText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
    thumb: { width: '100%', height: 200, borderRadius: 12, resizeMode: 'cover', marginBottom: 16 },
    resultBlock: {
      backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    resultLabel: { fontSize: 12, color: colors.subtext, marginBottom: 8, letterSpacing: 0.8, fontWeight: '600' },
    resultJa: { fontSize: 22, fontWeight: '500', color: colors.text, lineHeight: 32 },
    resultZh: { fontSize: 17, fontWeight: '600', color: colors.primaryDeep, lineHeight: 26 },
    wordRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
    },
    wordJa: { fontSize: 18, fontWeight: '600', color: colors.text },
    wordReading: { fontSize: 12, color: colors.subtext, marginTop: 2 },
    wordMeaning: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  })
}
