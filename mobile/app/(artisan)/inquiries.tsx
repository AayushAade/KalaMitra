import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '../../constants/theme';
import Header from '../../components/Header';
import InquiryCard from '../../components/InquiryCard';
import { useProductCatalog } from '../../context/ProductCatalogContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ArtisanInquiriesScreen() {
  const { inquiries } = useProductCatalog();

  const handleInquiryPress = (id: string) => {
    router.push(`/chat/${id}` as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBack={true} title="Inquiries Received" />
      <FlatList
        data={inquiries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <InquiryCard
            inquiry={item}
            onPress={() => handleInquiryPress(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.title}>Buyer Inquiries</Text>
            <Text style={styles.subtitle}>
              Review bulk order requests and communicate directly with interested wholesale buyers.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbox-ellipses-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No inquiries received yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: Spacing.marginMobile,
    paddingBottom: Spacing.xl,
  },
  listHeader: {
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onBackground,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  emptyContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
