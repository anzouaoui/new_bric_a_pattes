import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';

// Composant réutilisable pour afficher une ligne de détail
const DetailRow = ({ label, value, isLast = false }) => (
  <View style={[styles.detailRow, isLast && styles.lastDetailRow]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

export default function SummaryScreen() {
  const router = useRouter();
  const { listingId } = useLocalSearchParams();
  
  const [listing, setListing] = useState(null);
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    shipping: 4.50,
    serviceFee: 1.50,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Charger les détails de l'annonce
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const docRef = doc(db, 'listings', listingId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const listingData = { id: docSnap.id, ...docSnap.data() };
          setListing(listingData);
          
          // Mettre à jour les totaux
          const subtotal = parseFloat(listingData.price) || 0;
          const total = subtotal + orderSummary.shipping + orderSummary.serviceFee;
          
          setOrderSummary(prev => ({
            ...prev,
            subtotal,
            total
          }));
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  const handlePayment = () => {
    if (!listing) return;
    
    // Rediriger vers l'écran de livraison avec les informations nécessaires
    router.push({
      pathname: '/(checkout)/ShippingAddressScreen      ',
      params: {
        listingId: listing.id,
        total: orderSummary.total.toString()
      }
    });
  };

  if (isLoading && !listing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.errorContainer}>
        <Text>Impossible de charger les détails de l'annonce</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Récapitulatif de la commande</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Carte de l'article */}
          <View style={styles.card}>
            <Image 
              source={{ uri: listing.imageUrls?.[0] || 'https://via.placeholder.com/60' }} 
              style={styles.productImage}
              resizeMode="cover"
            />
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={1}>
                {listing.title}
              </Text>
              <Text style={styles.productCondition}>
                {listing.condition}
              </Text>
              <Text style={styles.productPrice}>
                {parseFloat(listing.price).toFixed(2)} €
              </Text>
              <View style={styles.quantityContainer}>
                <Text>Quantité: 1</Text>
              </View>
            </View>
          </View>

          {/* Détails des coûts */}
          <View style={styles.costDetails}>
            <Text style={styles.sectionTitle}>Détails de la commande</Text>
            <DetailRow 
              label="Sous-total" 
              value={`${orderSummary.subtotal.toFixed(2)} €`} 
            />
            <DetailRow 
              label="Frais de livraison" 
              value={`${orderSummary.shipping.toFixed(2)} €`} 
            />
            <DetailRow 
              label={
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text>Frais de service acheteur</Text>
                  <Ionicons name="information-circle-outline" size={16} style={{ marginLeft: 4 }} />
                </View>
              }
              value={`${orderSummary.serviceFee.toFixed(2)} €`}
              isLast={true}
            />
          </View>

          {/* Total */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total à payer</Text>
            <Text style={styles.totalAmount}>{orderSummary.total.toFixed(2)} €</Text>
          </View>
        </View>
      </ScrollView>

      {/* Pied de page avec bouton de paiement */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total à payer</Text>
          <Text style={styles.totalAmount}>{orderSummary.total.toFixed(2)} €</Text>
        </View>
        <TouchableOpacity 
          style={[styles.payButton, isLoading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.payButtonText}>Valider et Payer</Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100, // Pour éviter que le contenu ne soit caché par le footer
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  productCondition: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costDetails: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  lastDetailRow: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  detailLabel: {
    color: '#6B7280',
  },
  detailValue: {
    fontWeight: '500',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: 'white',
  },
  payButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
