import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebaseConfig'; // Assurez-vous que ce chemin est correct (probablement ../firebaseConfig)

const formatStatus = (status) => {
  const statusMap = {
    'paid_pending_shipment': 'En attente d\'expédition',
    'shipped': 'Expédié',
    'delivered': 'Livré',
    'completed': 'Terminé',
    'disputed': 'En litige',
    'cancelled': 'Annulé'
  };
  return statusMap[status] || status;
};

const SaleDetail = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, 'orders', id), (docSnap) => {
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      } else {
        Alert.alert('Erreur', 'Commande introuvable');
        router.back();
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching order:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la commande');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const copyToClipboard = async () => {
    if (!order?.shippingAddress) return;
    
    // Correction: 'name' n'existe pas dans le schéma, 'firstName' et 'lastName' oui
    const { firstName, lastName, line1, line2, postalCode, city, country } = order.shippingAddress;
    const addressString = `${firstName} ${lastName}\n${line1}${line2 ? '\n' + line2 : ''}\n${postalCode} ${city}\n${country}`;
    
    try {
      await Clipboard.setStringAsync(addressString);
      Alert.alert('Copié !', 'L\'adresse a été copiée dans le presse-papier.');
    } catch (error) {
      console.error('Failed to copy address:', error);
      Alert.alert('Erreur', 'Impossible de copier l\'adresse');
    }
  };

  const handleMarkAsShipped = async () => {
    if (trackingNumber.trim() === '') return;
    
    setSubmitLoading(true);
    try {
      await updateDoc(doc(db, 'orders', id), {
        status: 'shipped',
        trackingNumber: trackingNumber.trim(),
        shippedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      Alert.alert(
        'Succès', 
        'La commande a été marquée comme expédiée. L\'acheteur a été notifié.'
      );
      router.back();
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert(
        'Erreur', 
        'Une erreur est survenue lors de la mise à jour de la commande. Veuillez réessayer.'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#95ba72" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gérer la Vente</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Carte Article */}
        <View style={styles.card}>
          <View style={styles.productHeader}>
            <Image 
              source={{ uri: order.listingImage || 'https://via.placeholder.com/60' }} 
              style={styles.productImage} 
            />
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={2}>
                {order.listingTitle}
              </Text>
              <Text style={styles.saleInfo}>
                Vendu à @{order.buyerName || 'un acheteur'} pour {order.amount} €
              </Text>
            </View>
          </View>
        </View>

        {/* Statut de la commande */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statut de la commande</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: order.status === 'disputed' ? '#FEE2E2' : '#EFF6FF' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: order.status === 'disputed' ? '#DC2626' : '#1D4ED8' }
            ]}>
              {formatStatus(order.status)}
            </Text>
          </View>
        </View>

        {/* --- [MODIFICATION COMMENCE ICI] --- */}

        {/* Adresse de livraison (SI DOMICILE) */}
        {order.deliveryMethod === 'domicile' && order.shippingAddress && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Adresse de livraison</Text>
              <TouchableOpacity onPress={copyToClipboard}>
                <Text style={styles.copyButton}>Copier</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.card}>
              <Text style={styles.addressText}>
                {/* Correction pour utiliser firstName et lastName */}
                {`${order.shippingAddress.firstName} ${order.shippingAddress.lastName}
${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? `\n${order.shippingAddress.addressLine2}` : ''}
${order.shippingAddress.postalCode} ${order.shippingAddress.city}
${order.shippingAddress.country || ''}`} 
              </Text>
            </View>
          </View>
        )}

        {/* Info de Retrait (SI PICKUP) */}
        {order.deliveryMethod === 'pickup' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Méthode de retrait</Text>
            <View style={styles.card}>
              <View style={styles.pickupInfo}>
                <Ionicons name="storefront-outline" size={24} color="#95ba72" />
                <Text style={styles.pickupText}>Retrait sur Place</Text>
              </View>
              <Text style={styles.addressText}>
                L'acheteur viendra récupérer l'article. Veuillez le contacter via la messagerie pour convenir d'un rendez-vous.
              </Text>
              <TouchableOpacity 
                style={styles.messageButton}
                onPress={() => {
                  // Vérifier si on a bien l'ID de l'acheteur
                  if (order.buyerId) {
                    // Créer ou accéder à la conversation avec l'acheteur
                    router.push(`/chat/${order.buyerId}`);
                  } else {
                    Alert.alert('Erreur', 'Impossible de contacter l\'acheteur.');
                  }
                }}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#3B82F6" />
                <Text style={styles.messageButtonText}>Contacter l'acheteur</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* --- [FIN DE LA MODIFICATION] --- */}

        {/* Expédier la commande (Ne s'affiche que pour 'domicile') */}
        {order.deliveryMethod === 'domicile' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expédier la commande</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Entrez le numéro de suivi"
                value={trackingNumber}
                onChangeText={setTrackingNumber}
                placeholderTextColor="#9CA3AF"
              />
              <Ionicons 
                name="car-outline" 
                size={20} 
                color="#6B7280" 
                style={styles.inputIcon} 
              />
            </View>
            <Text style={styles.helperText}>
              Le numéro de suivi protège les deux parties en cas de litige.
            </Text>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (trackingNumber.trim() === '' || submitLoading) && styles.disabledButton
              ]}
              onPress={handleMarkAsShipped}
              disabled={trackingNumber.trim() === '' || submitLoading}
            >
              {submitLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Marquer comme Expédié
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Litige ouvert */}
        {order.status === 'disputed' && (
          <View style={[styles.card, styles.disputeCard]}>
            <View style={styles.disputeHeader}>
              <View style={styles.disputeBadge}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.disputeTitle}>Litige ouvert</Text>
              </View>
              <Text style={styles.disputeText}>
                L'acheteur a signalé un problème avec cette commande.
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.disputeButton}
              onPress={() => {
                // S'assurer de naviguer vers le bon litige
                // Vous devez vous assurer que order.disputeId est bien sauvegardé lors de la création du litige
                if (order.disputeId) {
                  router.push(`/dispute-detail/${order.disputeId}`)
                } else {
                  Alert.alert('Erreur', 'Impossible de trouver les détails du litige associé.')
                }
              }}
            >
              <Text style={styles.disputeButtonText}>Voir les détails</Text>
              <Ionicons name="arrow-forward" size={18} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ... (tous vos styles existants)
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    color: '#1F2937',
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  productHeader: {
    flexDirection: 'row',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  saleInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  copyButton: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 14,
  },
  addressText: {
    color: '#4B5563',
    lineHeight: 22,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    paddingLeft: 48,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#95ba72',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  disputeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    padding: 16,
  },
  disputeHeader: {
    marginBottom: 12,
  },
  disputeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  disputeTitle: {
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: 8,
  },
  disputeText: {
    color: '#4B5563',
    lineHeight: 20,
  },
  disputeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  disputeButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  // --- [NOUVEAUX STYLES AJOUTÉS] ---
  pickupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickupText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 10,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  messageButtonText: {
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 8,
  },
  // --- [FIN DES NOUVEAUX STYLES] ---
});

export default SaleDetail;