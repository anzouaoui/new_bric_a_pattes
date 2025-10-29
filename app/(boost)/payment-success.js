import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { listingId, boostType } = useLocalSearchParams();
  const [listingTitle, setListingTitle] = useState('');
  const [endDate, setEndDate] = useState('');

  // Récupérer les détails de l'annonce et calculer la date de fin
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const listingDoc = await getDoc(doc(db, 'listings', listingId));
        if (listingDoc.exists()) {
          setListingTitle(listingDoc.data().title);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'annonce:', error);
      }
    };

    // Calculer la date de fin du boost
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (boostType === '3jours' ? 3 : 7));
    
    // Formater la date en français (ex: 15 octobre 2023)
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    setEndDate(endDate.toLocaleDateString('fr-FR', options));

    if (listingId) {
      fetchListing();
    }
  }, [listingId, boostType]);

  const handleViewListing = () => {
    router.replace({
      pathname: `/listing/${listingId}`,
    });
  };

  const handleGoHome = () => {
    router.replace('/(tabs)/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icône de succès */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-done" size={48} color="#34D399" />
        </View>

        {/* Titre */}
        <Text style={styles.title}>Votre annonce est maintenant promue !</Text>
        
        {/* Description */}
        <Text style={styles.description}>
          Elle sera mise en avant pour attirer plus d'acheteurs potentiels.
        </Text>

        {/* Carte Détails de la promotion */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Détails de la promotion</Text>
          
          {listingTitle ? (
            <Text style={styles.listingTitle} numberOfLines={1}>
              {listingTitle}
            </Text>
          ) : (
            <View style={styles.titlePlaceholder} />
          )}
          
          <Text style={styles.boostInfo}>
            Boost '{boostType === '3jours' ? '3 jours' : '7 jours'}' - {boostType === '3jours' ? '3' : '7'} jours
          </Text>
          
          <Text style={styles.endDate}>
            Finit le {endDate}
          </Text>
        </View>

        {/* Bouton Voir mon annonce */}
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleViewListing}
        >
          <Text style={styles.primaryButtonText}>Voir mon annonce</Text>
        </TouchableOpacity>

        {/* Bouton Retour à l'accueil */}
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleGoHome}
        >
          <Text style={styles.secondaryButtonText}>Retourner à l'accueil</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  detailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 32,
    width: '100%',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  titlePlaceholder: {
    height: 20,
    width: '80%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  boostInfo: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  endDate: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  primaryButton: {
    backgroundColor: '#34D399',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
});
