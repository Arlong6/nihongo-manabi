import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width, height } = Dimensions.get('window')

interface TourStep {
  emoji: string
  title: string
  desc: string
  position?: 'top' | 'middle' | 'bottom'
}

interface TourGuideProps {
  tourKey: string
  steps: TourStep[]
  onComplete?: () => void
}

export function useTour(tourKey: string) {
  const [visible, setVisible] = useState(false)

  const checkAndShow = async () => {
    const done = await AsyncStorage.getItem(`tour_${tourKey}`)
    if (!done) setVisible(true)
  }

  const dismiss = async () => {
    await AsyncStorage.setItem(`tour_${tourKey}`, 'done')
    setVisible(false)
  }

  return { visible, checkAndShow, dismiss }
}

export default function TourGuide({ tourKey, steps, onComplete }: TourGuideProps) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(true)

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      await AsyncStorage.setItem(`tour_${tourKey}`, 'done')
      setVisible(false)
      onComplete?.()
    }
  }

  const handleSkip = async () => {
    await AsyncStorage.setItem(`tour_${tourKey}`, 'done')
    setVisible(false)
    onComplete?.()
  }

  if (!visible || steps.length === 0) return null

  const current = steps[step]
  const posStyle = current.position === 'top'
    ? s.tooltipTop
    : current.position === 'bottom'
    ? s.tooltipBottom
    : s.tooltipMiddle

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={s.overlay}>
        <View style={[s.tooltip, posStyle]}>
          <Text style={s.emoji}>{current.emoji}</Text>
          <Text style={s.title}>{current.title}</Text>
          <Text style={s.desc}>{current.desc}</Text>

          {/* Progress dots */}
          <View style={s.dotsRow}>
            {steps.map((_, i) => (
              <View key={i} style={[s.dot, step === i && s.dotActive]} />
            ))}
          </View>

          <View style={s.btnRow}>
            <TouchableOpacity style={s.skipBtn} onPress={handleSkip}>
              <Text style={s.skipText}>跳過說明</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
              <Text style={s.nextText}>
                {step < steps.length - 1 ? '下一步 →' : '開始使用！'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tooltip: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  tooltipTop: { marginTop: 80 },
  tooltipMiddle: {},
  tooltipBottom: { marginBottom: 120 },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  title: {
    fontSize: 20, fontWeight: 'bold', color: '#111827',
    textAlign: 'center', marginBottom: 10,
  },
  desc: {
    fontSize: 15, color: '#4B5563', textAlign: 'center',
    lineHeight: 24, marginBottom: 20,
  },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB' },
  dotActive: { backgroundColor: '#4F46E5', width: 18 },
  btnRow: { flexDirection: 'row', gap: 10 },
  skipBtn: {
    flex: 1, borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  skipText: { color: '#9CA3AF', fontSize: 14 },
  nextBtn: {
    flex: 2, backgroundColor: '#4F46E5',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  nextText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
