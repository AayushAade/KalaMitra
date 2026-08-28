import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { artisanService } from '../../services/artisanService';

export default function ArtisanDashboard() {
  const [artisan, setArtisan] = useState(artisanService.getCurrentArtisan());
  const tips = artisanService.getDashboardRecommendations();

  useEffect(() => {
    const unsubscribe = artisanService.subscribe((updatedArtisan) => {
      setArtisan(updatedArtisan);
    });
    // Ensure we capture any status changes that happened during transit
    setArtisan(artisanService.getCurrentArtisan());
    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Welcome Section settings gear */}
        <Pressable
          onPress={() => router.push('/(artisan)/profile' as any)}
          style={({ pressed }) => [styles.welcomeCard, pressed && styles.pressedCard]}
        >
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{(artisan.ownerName || 'S').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.welcomeTextContainer}>
            <Text style={styles.welcomeName}>{artisan.name}</Text>
            <View style={styles.statusRow}>
              <Text style={styles.welcomeSub}>Namaste, {artisan.ownerName} • {artisan.location}</Text>
              <View style={styles.activePill}>
                <Text style={styles.activeText}>Active</Text>
              </View>
            </View>
          </View>
          <Ionicons name="settings-outline" size={22} color={Colors.primary} />
        </Pressable>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Pressable
            onPress={() => router.push('/(artisan)/products' as any)}
            style={({ pressed }) => [styles.statBox, pressed && styles.pressedCard]}
          >
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(artisan)/inquiries' as any)}
            style={({ pressed }) => [styles.statBox, pressed && styles.pressedCard]}
          >
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Inquiries</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(artisan)/store' as any)}
            style={({ pressed }) => [styles.statBox, pressed && styles.pressedCard]}
          >
            <Text style={styles.statNumber}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </Pressable>
        </View>

        {/* Main Action: Add New Product Tile */}
        <Pressable
          onPress={() => router.push('/(artisan)/add-product' as any)}
          style={({ pressed }) => [styles.addProductTile, pressed && styles.pressedCard]}
        >
          <View style={styles.tileIcons}>
            <Ionicons name="camera-outline" size={32} color={Colors.primary} />
            <Text style={styles.tilePlus}>+</Text>
            <Ionicons name="mic-outline" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.tileTitle}>Add New Product</Text>
          <Text style={styles.tileDesc}>Snap a photo and speak in your language to create a listing.</Text>
        </Pressable>

        {/* AI Cataloging Tools Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Smart Tools</Text>
          
          <Pressable
            style={({ pressed }) => [styles.toolCard, pressed && styles.pressedCard]}
            onPress={() => router.push('/(artisan)/voice' as any)}
          >
            <View style={[styles.toolIconContainer, { backgroundColor: Colors.primaryContainer }]}>
              <Ionicons name="mic-outline" size={24} color={Colors.textLight} />
            </View>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>Voice Cataloging</Text>
              <Text style={styles.toolDesc}>Describe your product in Hindi, Marathi, or English.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.border} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.toolCard, pressed && styles.pressedCard]}
            onPress={() => router.push('/(artisan)/image-enhancement' as any)}
          >
            <View style={[styles.toolIconContainer, { backgroundColor: Colors.tertiary }]}>
              <Ionicons name="sparkles-outline" size={24} color={Colors.textLight} />
            </View>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>Image Enhancement</Text>
              <Text style={styles.toolDesc}>Clean background & improve photo lighting instantly.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.border} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.toolCard, pressed && styles.pressedCard]}
            onPress={() => router.push('/(artisan)/pricing' as any)}
          >
            <View style={[styles.toolIconContainer, { backgroundColor: Colors.secondary }]}>
              <Ionicons name="calculator-outline" size={24} color={Colors.textLight} />
            </View>
            <View style={styles.toolText}>
              <Text style={styles.toolTitle}>Pricing Assistant</Text>
              <Text style={styles.toolDesc}>Calculate suggestions based on material and labor.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.border} />
          </Pressable>
        </View>

        {/* Tips & Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {tips.map(tip => {
            const getRoute = () => {
              if (tip.id === '1') return '/(artisan)/inquiries';
              if (tip.id === '2') return '/(artisan)/pricing';
              return '/(artisan)/add-product';
            };
            return (
              <Pressable
                key={tip.id}
                onPress={() => router.push(getRoute() as any)}
                style={({ pressed }) => [styles.tipCard, pressed && styles.pressedCard]}
              >
                <Ionicons name={tip.icon as any} size={22} color={Colors.primary} style={styles.tipIcon} />
                <View style={styles.tipText}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipDesc}>{tip.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.border} style={{ alignSelf: 'center' }} />
              </Pressable>
            );
          })}
        </View>

        {/* Switch Role Button */}
        <Button
          title="Switch to Buyer View"
          onPress={() => router.replace('/')}
          variant="secondary"
          style={styles.switchButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.marginMobile,
    paddingVertical: Spacing.md,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textLight,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onBackground,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: Spacing.xs,
  },
  welcomeSub: {
    fontSize: 11,
    color: Colors.textMuted,
    flexShrink: 1,
  },
  activePill: {
    backgroundColor: 'rgba(0,180,100,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  activeText: {
    fontSize: 9,
    color: 'rgb(0,140,80)',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  addProductTile: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primaryContainer,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  tileIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tilePlus: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.border,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  tileDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onBackground,
    marginBottom: Spacing.md,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.soft,
  },
  toolIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  toolText: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.onBackground,
  },
  toolDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tipIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onBackground,
  },
  tipDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  switchButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  pressedCard: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
