import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// Composant réutilisable pour afficher une ligne de détail
const DetailRow = ({ label, value, isBold = false }) => (
  <View style={styles.detailRow}>
    <Text style={[styles.detailLabel, isBold && styles.boldText]}>{label}</Text>
    <Text style={[styles.detailValue, isBold && styles.boldText]}>{value}</Text>
  </View>
);

// Composant réutilisable pour les cartes
const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { orderId, listingTitle, totalPaid, shippingAddress } = useLocalSearchParams();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger les détails de la commande si seul l'ID est fourni
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          setOrderDetails({ id: orderDoc.id, ...orderDoc.data() });
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la commande:', error);
      } finally {
        setLoading(false);
      }
    };

    // Si on n'a pas les détails complets, on les charge
    if (!listingTitle || !totalPaid) {
      fetchOrderDetails();
    } else {
      setOrderDetails({
        id: orderId,
        listingTitle,
        totalPaid: parseFloat(totalPaid),
        shippingAddress: JSON.parse(shippingAddress || '{}')
      });
      setLoading(false);
    }
  }, [orderId, listingTitle, totalPaid, shippingAddress]);

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34D399" />
      </View>
    );
  }

  // Formatage de l'adresse pour l'affichage
  const formatAddress = (address) => {
    if (!address) return 'Aucune adresse fournie';
    return `${address.addressLine1 || ''}${address.addressLine2 ? `, ${address.addressLine2}` : ''}\n${address.postalCode || ''} ${address.city || ''}\n${address.country || ''}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icône de succès */}
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-done" size={48} color="#34D399" />
        </View>

        {/* Titre */}
        <Text style={styles.title}>Achat réussi !</Text>
        <Text style={styles.subtitle}>Merci pour votre achat ! Votre commande a bien été enregistrée.</Text>

        {/* Carte Détails de la commande */}
        <Card>
          <Text style={styles.cardTitle}>Détails de la commande</Text>
          <DetailRow 
            label="Numéro de commande" 
            value={orderDetails?.id || orderId || 'N/A'} 
          />
          
          {/* Liste des articles (exemple avec un seul article) */}
          {orderDetails?.listingTitle && (
            <DetailRow 
              label={orderDetails.listingTitle} 
              value={`${orderDetails.totalPaid?.toFixed(2) || '0.00'} €`} 
            />
          )}
          
          {/* Total */}
          <View style={styles.divider} />
          <DetailRow 
            label="Total payé" 
            value={`${orderDetails?.totalPaid?.toFixed(2) || '0.00'} €`} 
            isBold={true}
          />
        </Card>

        {/* Carte Livraison */}
        <Card style={styles.shippingCard}>
          <Text style={styles.cardTitle}>Livraison</Text>
          <Text style={styles.shippingAddress}>
            {orderDetails?.shippingAddress 
              ? formatAddress(orderDetails.shippingAddress) 
              : 'Retrait en magasin'}
          </Text>
        </Card>

        {/* Bouton Voir mes commandes */}
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.replace('/(tabs)/profile/my-orders')}
        >
          <Text style={styles.primaryButtonText}>Voir mes commandes</Text>
        </TouchableOpacity>

        {/* Bouton Retour à l'accueil */}
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.replace('/(tabs)/')}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginTop: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '400',
    textAlign: 'right',
    flex: 1,
  },
  boldText: {
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  shippingCard: {
    marginTop: 16,
  },
  shippingAddress: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#34D399',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    marginTop: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontWeight: '600',
    fontSize: 16,
  },
});
