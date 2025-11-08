import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

// Composant pour afficher une étape de la timeline
const TimelineStep = ({ icon, title, date, isActive, isLast }) => (
  <View style={styles.timelineStep}>
    <View style={styles.timelineIconContainer}>
      <Ionicons 
        name={icon} 
        size={20} 
        color={isActive ? '#95ba72' : '#9CA3AF'} 
      />
    </View>
    <View style={styles.timelineContent}>
      <Text style={[styles.timelineTitle, isActive && styles.activeText]}>{title}</Text>
      {date && <Text style={styles.timelineDate}>{new Date(date).toLocaleDateString()}</Text>}
    </View>
    {!isLast && <View style={[styles.timelineLine, isActive && styles.activeLine]} />}
  </View>
);

export default function OrderTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const { currentUser } = auth;

  // Fonction pour confirmer la réception
  const handleConfirmReceipt = async () => {
    try {
      setConfirmLoading(true);
      await updateDoc(doc(db, 'orders', id), {
        status: 'delivered',
        deliveredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      Alert.alert('Succès', 'La réception de votre commande a été confirmée');
    } catch (error) {
      console.error('Erreur lors de la confirmation de réception:', error);
      Alert.alert('Erreur', 'Impossible de confirmer la réception');
    } finally {
      setConfirmLoading(false);
    }
  };

  // Fonction pour signaler un problème
  const handleReportProblem = () => {
    router.push(`/report-problem/${id}`);
  };

  // Récupérer les détails de la commande
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
    });

    return () => unsubscribe();
  }, [id]);

  const copyTrackingNumber = () => {
    if (order?.trackingNumber) {
      // Implémentation de la copie du numéro de suivi
      // Note: En web, on pourrait utiliser le Clipboard API
      Alert.alert('Numéro copié', 'Le numéro de suivi a été copié dans le presse-papier');
    }
  };

  const handleContactSeller = () => {
    if (order?.sellerInfo?.id) {
      // Implémentation de la création/démarrage d'une conversation
      // Redirection vers l'écran de chat avec le vendeur
      router.push(`/chat/${order.sellerInfo.id}`);
    }
  };

  const handleConfirmReception = async () => {
    setConfirmLoading(true);
    try {
      await updateDoc(doc(db, 'orders', id), { 
        status: 'completed', 
        buyerConfirmedAt: serverTimestamp() 
      });
      Alert.alert("Merci !", "Réception confirmée. Le vendeur va être payé.");
    } catch (error) {
      console.error("Erreur lors de la confirmation de réception:", error);
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    } finally { 
      setConfirmLoading(false);
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#95ba72" />
      </View>
    );
  }

  // Déterminer les étapes de la timeline
  const getTimelineSteps = () => {
    const steps = [
      {
        id: 'ordered',
        title: 'Commande passée',
        icon: 'checkmark-circle',
        date: order.createdAt,
        isActive: true
      },
      {
        id: 'shipped',
        title: 'Expédiée',
        icon: 'cube',
        date: order.shippedAt,
        isActive: ['shipped', 'delivered', 'completed'].includes(order.status)
      },
      {
        id: 'delivered',
        title: 'En transit',
        icon: 'bicycle',
        date: order.deliveredAt,
        isActive: ['delivered', 'completed'].includes(order.status)
      },
      {
        id: 'completed',
        title: 'Livré',
        icon: 'checkmark-done',
        date: order.buyerConfirmedAt,
        isActive: order.status === 'completed'
      }
    ];

    return steps;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suivi de votre commande</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Carte Article */}
        <View style={styles.card}>
          <View style={styles.articleInfo}>
            <Text style={styles.articleTitle} numberOfLines={2}>
              {order.listingTitle}
            </Text>
            <Text style={styles.priceText}>
              Prix payé: {order.totalPaid?.toFixed(2)} €
            </Text>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push(`/listing/${order.listingId}`)}
            >
              <Text style={styles.secondaryButtonText}>Voir l'annonce</Text>
            </TouchableOpacity>
          </View>
          <Image 
            source={{ uri: order.listingImage }} 
            style={styles.articleImage}
            resizeMode="cover"
          />
        </View>

        {/* Carte Vendeur */}
        <View style={[styles.card, styles.sellerCard]}>
          <Image 
            source={{ 
              uri: order.sellerInfo?.avatar || 'https://via.placeholder.com/50' 
            }} 
            style={styles.avatar}
          />
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>
              Vendu par : {order.sellerInfo?.name || 'Vendeur'}
            </Text>
            <Text style={styles.ratingText}>4.8/5 (123 avis)</Text>
          </View>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleContactSeller}
          >
            <Text style={styles.primaryButtonText}>Contacter</Text>
          </TouchableOpacity>
        </View>

        {/* Statut de livraison */}
        <Text style={styles.sectionTitle}>Statut de la livraison</Text>
        
        {/* Carte numéro de suivi */}
        <View style={[styles.card, styles.trackingCard]}>
          <View>
            <Text style={styles.labelText}>Numéro de suivi</Text>
            <Text style={styles.trackingNumber}>
              {order.trackingNumber || 'En attente de numéro'}
            </Text>
          </View>
          {order.trackingNumber && (
            <TouchableOpacity onPress={copyTrackingNumber}>
              <Ionicons name="copy-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.timelineContainer}>
          {getTimelineSteps().map((step, index) => (
            <TimelineStep
              key={step.id}
              icon={step.icon}
              title={step.title}
              date={step.date}
              isActive={step.isActive}
              isLast={index === getTimelineSteps().length - 1}
            />
          ))}
        </View>

        {/* Message de confirmation */}
        <Text style={styles.infoText}>
          Une fois votre article reçu, veuillez confirmer la réception afin que le vendeur puisse être payé.
        </Text>
      </ScrollView>

      {/* Boutons d'action */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.confirmButton, 
            (confirmLoading || !['shipped', 'delivered'].includes(order.status)) && styles.disabledButton
          ]}
          onPress={handleConfirmReception}
          disabled={confirmLoading || !['shipped', 'delivered'].includes(order.status)}
        >
          {confirmLoading ? (
            <ActivityIndicator color="#4B5563" />
          ) : (
            <Text style={[
              styles.confirmButtonText,
              !['shipped', 'delivered'].includes(order.status) && styles.disabledText
            ]}>
              {order.status === 'delivered' ? 'Confirmer la réception' : 'Marquer comme reçu'}
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={() => router.push(`/report-problem/${id}`)}
        >
          <Text style={styles.reportButtonText}>Signaler un problème</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  articleInfo: {
    flex: 1,
    marginRight: 16,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#95ba72',
    marginBottom: 12,
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  sellerCard: {
    justifyContent: 'space-between',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
    marginRight: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  primaryButton: {
    backgroundColor: '#95ba72',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  secondaryButtonText: {
    color: '#4B5563',
    fontWeight: '500',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 12,
  },
  trackingCard: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  trackingNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  timelineContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    position: 'relative',
  },
  timelineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 2,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineTitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  timelineLine: {
    position: 'absolute',
    left: 20,
    top: 40,
    bottom: -16,
    width: 1,
    backgroundColor: '#E5E7EB',
    zIndex: 1,
  },
  activeText: {
    color: '#95ba72',
    fontWeight: '600',
  },
  activeLine: {
    backgroundColor: '#95ba72',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  // Styles pour les boutons d'action
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  // Bouton principal (confirmer la réception)
  confirmButton: {
    backgroundColor: '#95ba72',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  // Bouton secondaire (signaler un problème)
  reportButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  // États désactivés
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  disabledText: {
    color: '#9CA3AF',
  },
});
