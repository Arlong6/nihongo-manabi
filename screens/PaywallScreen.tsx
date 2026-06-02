import React, { useEffect, useMemo, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  SafeAreaView, Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../lib/theme'
import type { ThemeColors } from '../lib/theme'
import {
  getOfferings, purchasePackage, restorePurchases, packageIsPro,
} from '../lib/iap'
import type { PurchasesPackage, PurchasesOffering } from 'react-native-purchases'

// Sales copy lives here so we don't keep recompiling translation files for
// every wording tweak. Each line is one bullet on the paywall card.
const PRO_BENEFITS = [
  { emoji: '🤖', title: 'AI 對話無上限', body: '不限次數跟 AI 老師練習各種情境' },
  { emoji: '🎓', title: 'N1 / N2 進階模考', body: '高階文法 + 完整模擬考' },
  { emoji: '📸', title: '拍照翻譯無上限', body: '日本旅遊看不懂的招牌、菜單，秒翻' },
  { emoji: '🎬', title: '影片下載 + 字典', body: '看 Reel 學日文時，單字一鍵存進複習' },
  { emoji: '🚫', title: '無廣告', body: '專心學習，零打擾' },
]

export default function PaywallScreen() {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const navigation = useNavigation<any>()
  const [offering, setOffering] = useState<PurchasesOffering | null>(null)
  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    getOfferings().then(o => {
      setOffering(o)
      // Default-select the annual package if present (highest LTV, biggest
      // discount per period — drives perceived value).
      if (o) {
        const annual = o.availablePackages.find(p => p.packageType === 'ANNUAL')
        setSelectedPkg(annual || o.availablePackages[0] || null)
      }
      setLoading(false)
    })
  }, [])

  const handleBuy = async () => {
    if (!selectedPkg) return
    setBuying(true)
    try {
      const info = await purchasePackage(selectedPkg)
      if (packageIsPro(info)) {
        Alert.alert('歡迎加入 Pro 🎉', '所有 Pro 功能已解鎖')
        navigation.goBack()
      } else {
        Alert.alert('購買流程已完成', '但 Pro 權限尚未生效，請稍後再試')
      }
    } catch (e: any) {
      // RevenueCat throws userCancelled with code 1 — silent for that case.
      if (e?.userCancelled) return
      Alert.alert('購買失敗', e?.message ?? '請稍後再試')
    } finally {
      setBuying(false)
    }
  }

  const handleRestore = async () => {
    setBuying(true)
    try {
      const info = await restorePurchases()
      if (packageIsPro(info)) {
        Alert.alert('已恢復購買', 'Pro 權限已啟用')
        navigation.goBack()
      } else {
        Alert.alert('沒有可恢復的購買', '這個 Apple ID 沒有有效的 Pro 訂閱')
      }
    } catch (e: any) {
      Alert.alert('恢復失敗', e?.message ?? '請稍後再試')
    } finally {
      setBuying(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={styles.title}>升級 Nihongo Pro ✨</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>解鎖完整學習體驗，加速你的日文進步</Text>

        <View style={styles.benefitList}>
          {PRO_BENEFITS.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Text style={styles.benefitEmoji}>{b.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitBody}>{b.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {!offering ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              方案載入中，或 Apple 沙盒尚未配置好。請稍後再試。
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.planLabel}>選擇方案</Text>
            {offering.availablePackages.map(pkg => (
              <PlanOption
                key={pkg.identifier}
                pkg={pkg}
                selected={selectedPkg?.identifier === pkg.identifier}
                onSelect={() => setSelectedPkg(pkg)}
                colors={colors}
              />
            ))}
          </>
        )}

        <TouchableOpacity
          style={[styles.buyBtn, (!selectedPkg || buying) && styles.buyBtnDisabled]}
          onPress={handleBuy}
          disabled={!selectedPkg || buying}
        >
          {buying
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buyBtnText}>立即升級 Pro</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={buying}>
          <Text style={styles.restoreText}>已經買過？恢復購買</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          訂閱會自動續訂，可在 設定 → Apple ID → 訂閱項目 取消。{'\n'}
          7 天試用期僅限新訂閱用戶。
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

interface PlanOptionProps {
  pkg: PurchasesPackage
  selected: boolean
  onSelect: () => void
  colors: ThemeColors
}

function PlanOption({ pkg, selected, onSelect, colors }: PlanOptionProps) {
  const styles = createStyles(colors)
  const product = pkg.product
  // RC normalizes to packageType: ANNUAL, MONTHLY, WEEKLY, LIFETIME, CUSTOM…
  const isAnnual = pkg.packageType === 'ANNUAL'
  const label = isAnnual ? '年訂閱（每月省 50%）' : pkg.packageType === 'MONTHLY' ? '月訂閱' : pkg.identifier
  // priceString already locale-formatted ("NT$590" / "$5.99")
  const priceLine = product.priceString
  return (
    <TouchableOpacity
      style={[styles.planCard, selected && styles.planCardSelected]}
      onPress={onSelect}
      activeOpacity={0.85}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.planLabelInline}>{label}</Text>
        <Text style={styles.planPrice}>{priceLine}</Text>
        {isAnnual && (
          <Text style={styles.planBonus}>含 7 天免費試用</Text>
        )}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    closeText: {
      fontSize: 22, color: colors.subtext, fontWeight: '700',
      width: 32, height: 32, textAlign: 'center', lineHeight: 32,
    },
    subtitle: { fontSize: 15, color: colors.subtext, marginBottom: 28 },
    benefitList: { gap: 16, marginBottom: 32 },
    benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    benefitEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
    benefitTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
    benefitBody: { fontSize: 13, color: colors.subtext, lineHeight: 19 },
    planLabel: { fontSize: 13, fontWeight: '700', color: colors.subtext, marginBottom: 10, letterSpacing: 1 },
    planLabelInline: { fontSize: 15, fontWeight: '700', color: colors.text },
    planPrice: { fontSize: 22, fontWeight: '800', color: colors.primaryDeep, marginTop: 4, letterSpacing: -0.3 },
    planBonus: { fontSize: 12, fontWeight: '600', color: '#10B981', marginTop: 4 },
    planCard: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
      borderRadius: 14, padding: 16, borderWidth: 2, borderColor: colors.border,
      marginBottom: 10,
    },
    planCardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    radio: {
      width: 24, height: 24, borderRadius: 12,
      borderWidth: 2, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    radioSelected: { borderColor: colors.primary },
    radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
    buyBtn: {
      backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16,
      alignItems: 'center', marginTop: 18,
    },
    buyBtnDisabled: { opacity: 0.4 },
    buyBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
    restoreBtn: { alignItems: 'center', padding: 14 },
    restoreText: { color: colors.subtext, fontSize: 13, fontWeight: '600' },
    legal: { fontSize: 11, color: colors.subtext, textAlign: 'center', marginTop: 12, lineHeight: 16 },
    errorCard: {
      backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, marginBottom: 16,
    },
    errorText: { color: '#92400E', fontSize: 13, lineHeight: 18 },
  })
}
