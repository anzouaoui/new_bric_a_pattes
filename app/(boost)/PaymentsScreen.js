import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';

const DetailRow = ({ label, value, isBold = false }) => (
  <View style={styles.detailRow}>
    <Text style={[styles.detailLabel, isBold && styles.boldText]}>{label}</Text>
    <Text style={[styles.detailValue, isBold && styles.boldText]}>{value}</Text>
  </View>
);

export default function PaymentScreen() {
  const router = useRouter();
  const { listingId, boostType, price } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [boostDetails, setBoostDetails] = useState(null);

  // Calcul des montants
  const { basePrice, tva, total } = useMemo(() => {
    const base = parseFloat(price || 0);
    const tvaAmount = base * 0.20;
    return {
      basePrice: base.toFixed(2),
      tva: tvaAmount.toFixed(2),
      total: (base + tvaAmount).toFixed(2)
    };
  }, [price]);

  // Formatage du type de boost pour l'affichage
  const boostTypeDisplay = useMemo(() => {
    if (boostType === '3jours') return 'Mise en avant (3 jours)';
    if (boostType === '7jours') return 'Mise en avant (7 jours)';
    return 'Mise en avant';
  }, [boostType]);

  // Mise à jour des détails du boost
  useEffect(() => {
    setBoostDetails({
      type: boostTypeDisplay,
      duration: boostType === '3jours' ? '3 jours' : '7 jours',
      basePrice,
      tva,
      total
    });
  }, [boostType, basePrice, tva, total, boostTypeDisplay]);

  const handlePayment = async () => {
    if (!listingId || !boostType) return;
    
    setIsLoading(true);
    
    try {
      // 1. Appeler une Cloud Function 'createPaymentIntent' pour obtenir un 'client_secret' de Stripe
      // const { clientSecret } = await createPaymentIntent({ amount: parseFloat(total) * 100 });
      
      // 2. Initialiser le 'payment sheet' de Stripe
      // const { error } = await initPaymentSheet({ clientSecret, ... });
      
      // 3. Afficher le 'payment sheet'
      // const { error: paymentError } = await presentPaymentSheet();
      
      // 4. Gérer le résultat du paiement
      // if (paymentError) {
      //   throw new Error(paymentError.message);
      // }
      
      // 5. Mise à jour de l'annonce dans Firestore
      const boostEnds = new Date();
      boostEnds.setDate(boostEnds.getDate() + (boostType === '3jours' ? 3 : 7));
      
      await updateDoc(doc(db, 'listings', listingId), {
        isBoosted: true,
        boostType,
        boostStarts: serverTimestamp(),
        boostEnds,
        lastUpdated: serverTimestamp()
      });
      
      // 6. Redirection vers l'écran de succès
      router.replace({
        pathname: '/(boost)/payment-success',
        params: { listingId, boostType, amount: total }
      });
      
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      // Afficher une alerte d'erreur
      alert(`Erreur lors du paiement: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!boostDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34D399" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.modalContainer}>
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Résumé de votre commande</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Détails de la commande */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Détails de la promotion</Text>
          
          <View style={styles.detailsContent}>
            <DetailRow label="Plan" value={boostDetails.type} />
            <DetailRow label="Durée" value={boostDetails.duration} />
            <DetailRow label="Prix de base" value={`${boostDetails.basePrice} €`} />
            <DetailRow label="TVA (20%)" value={`${boostDetails.tva} €`} />
            
            <View style={styles.divider} />
            
            <DetailRow 
              label="Total à payer" 
              value={`${boostDetails.total} €`} 
              isBold={true} 
            />
          </View>
        </View>

        {/* Sécurité du paiement */}
        <View style={styles.securityInfo}>
          <Ionicons name="lock-closed-outline" size={16} color="#6B7280" />
          <Text style={styles.securityText}>Paiement sécurisé</Text>
        </View>

        {/* Bouton de paiement */}
        <TouchableOpacity 
          style={[styles.payButton, isLoading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.payButtonText}>
              Payer {boostDetails.total} €
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    color: '#1F2937',
  },
  headerPlaceholder: {
    width: 40,
  },
  detailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailsContent: {
    paddingHorizontal: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  boldText: {
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  securityInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  securityText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  payButton: {
    backgroundColor: '#95ba72',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payButtonDisabled: {
    backgroundColor: '#A7F3D0',
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
