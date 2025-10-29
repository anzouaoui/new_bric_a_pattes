import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function BoostOptions() {
  const [selectedBoost, setSelectedBoost] = useState(null);
  const [listing, setListing] = useState(null);
  const router = useRouter();
  const { listingId } = useLocalSearchParams();

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const listingDoc = await getDoc(doc(db, 'listings', listingId));
        if (listingDoc.exists()) {
          setListing({ id: listingDoc.id, ...listingDoc.data() });
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  const handlePayment = () => {
    if (!selectedBoost) return;
    
    const price = selectedBoost === '3jours' ? 2.99 : 5.99;
    router.push({
      pathname: '/(boost)/payment',
      params: { 
        listingId, 
        boostType: selectedBoost, 
        price: price.toString() 
      }
    });
  };

  if (!listing) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Chargement...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close-outline" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booster votre annonce</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Annonce Preview */}
        <View style={styles.listingPreview}>
          <Image 
            source={{ uri: listing.imageUrls?.[0] }} 
            style={styles.listingImage} 
            resizeMode="cover"
          />
          <Text style={styles.listingTitle} numberOfLines={1}>
            {listing.title}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Rendez votre annonce visible</Text>
        
        {/* Bénéfices */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitItem}>🚀 7x plus de vues</Text>
          <Text style={styles.benefitItem}>⚡️ Vente plus rapide</Text>
          <Text style={styles.benefitItem}>🔝 Placé en haut des résultats</Text>
        </View>

        {/* Options de boost */}
        <View style={styles.boostOptions}>
          <TouchableOpacity 
            style={[
              styles.boostOption, 
              selectedBoost === '3jours' && styles.boostOptionSelected
            ]}
            onPress={() => setSelectedBoost('3jours')}
          >
            <View style={styles.boostOptionContent}>
              <Text style={styles.boostOptionTitle}>Boost 3 jours</Text>
              <Text style={styles.boostOptionPrice}>2,99 €</Text>
            </View>
            {selectedBoost === '3jours' && (
              <View style={styles.radioSelected}>
                <View style={styles.radioInner} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.boostOption, 
              selectedBoost === '7jours' && styles.boostOptionSelected
            ]}
            onPress={() => setSelectedBoost('7jours')}
          >
            <View style={styles.boostOptionContent}>
              <Text style={styles.boostOptionTitle}>Boost 7 jours</Text>
              <Text style={styles.boostOptionPrice}>5,99 €</Text>
            </View>
            {selectedBoost === '7jours' && (
              <View style={styles.radioSelected}>
                <View style={styles.radioInner} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.ctaButton, 
            !selectedBoost && styles.ctaButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={!selectedBoost}
        >
          <Text style={styles.ctaButtonText}>
            Procéder au paiement
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 24, // Pour compenser le bouton de fermeture
  },
  headerPlaceholder: {
    width: 40, // Même largeur que le bouton de fermeture
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listingPreview: {
    marginTop: 16,
    marginBottom: 24,
  },
  listingImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  listingTitle: {
    fontSize: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  benefitsContainer: {
    marginBottom: 32,
  },
  benefitItem: {
    fontSize: 16,
    marginBottom: 8,
  },
  boostOptions: {
    marginBottom: 24,
  },
  boostOption: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boostOptionSelected: {
    borderColor: '#34D399',
    backgroundColor: '#F0FDF4',
  },
  boostOptionContent: {
    flex: 1,
  },
  boostOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  boostOptionPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34D399',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  ctaButton: {
    backgroundColor: '#34D399',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  ctaButtonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  ctaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
