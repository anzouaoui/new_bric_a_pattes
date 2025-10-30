import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  FlatList, 
  Alert,
  SafeAreaView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

const DisputeDetail = () => {
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { currentUser } = auth;

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, 'disputes', id), (docSnap) => {
      if (docSnap.exists()) {
        setDispute({ id: docSnap.id, ...docSnap.data() });
      } else {
        Alert.alert('Erreur', 'Ce litige est introuvable');
        router.back();
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching dispute:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du litige');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleContactBuyer = async () => {
    if (!dispute) {
      console.warn('Dispute data not loaded yet');
      return;
    }
    // Logique pour contacter l'acheteur
    // À implémenter avec la logique de chat existante
    console.log('Contacter l\'acheteur:', dispute.buyerId);
  };

  const handleEscalate = async () => {
    try {
      await updateDoc(doc(db, 'disputes', id), { 
        status: 'escalated_to_admin', 
        escalatedAt: serverTimestamp() 
      });
      Alert.alert("Transféré", "Notre équipe support va examiner le litige.");
    } catch (error) {
      console.error('Error escalating dispute:', error);
      Alert.alert('Erreur', 'Impossible de transférer le litige');
    }
  };

  const handleProposeSolution = () => {
    router.push(`/dispute/propose-solution/${id}`);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!dispute) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails du Litige</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Impossible de charger les détails du litige</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => setLoading(true)}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du Litige</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Badge Statut */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {dispute.status === 'escalated_to_admin' 
              ? 'En attente du support' 
              : 'En attente de votre réponse'}
          </Text>
        </View>

        {/* Carte Récap Commande */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => router.push(`/sale-detail/${dispute.orderId}`)}
        >
          <View style={styles.orderHeader}>
            <Image 
              source={{ uri: dispute.listingImage || 'https://via.placeholder.com/60' }} 
              style={styles.listingImage} 
            />
            <View style={styles.orderInfo}>
              <Text style={styles.orderTitle} numberOfLines={1}>
                {dispute.listingTitle}
              </Text>
              <Text style={styles.orderDate}>
                Vendu le {formatDate(dispute.orderDate)} • {dispute.orderAmount} €
              </Text>
              <Text style={styles.buyerName}>
                Acheteur: {dispute.buyerName || 'Utilisateur'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>

        {/* Problème signalé */}
        <View style={[styles.card, styles.problemCard]}>
          <Text style={styles.sectionSubtitle}>
            Problème signalé le {formatDate(dispute.createdAt)}
          </Text>
          <Text style={styles.problemTitle}>{dispute.reason}</Text>
          <Text style={styles.problemDescription}>
            {dispute.description || 'Aucune description fournie.'}
          </Text>
        </View>

        {/* Preuves de l'acheteur */}
        {dispute.photoUrls?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preuves de l'acheteur</Text>
            <FlatList
              horizontal
              data={dispute.photoUrls}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.proofImageContainer}
                  onPress={() => {
                    // Ici vous pourriez ouvrir une lightbox pour voir l'image en grand
                    console.log('Voir image:', item);
                  }}
                >
                  <Image 
                    source={{ uri: item }} 
                    style={styles.proofImage} 
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.proofsList}
            />
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Que souhaitez-vous faire ?</Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={handleProposeSolution}
          >
            <Text style={styles.buttonTextPrimary}>Proposer une solution</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={handleContactBuyer}
          >
            <Text style={styles.buttonTextSecondary}>
              Contacter {dispute.buyerName ? dispute.buyerName.split(' ')[0] : 'l\'acheteur'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.tertiaryButton]}
            onPress={handleEscalate}
          >
            <Text style={styles.buttonTextTertiary}>
              Transférer au support
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  statusText: {
    color: '#D97706',
    fontWeight: '600',
    fontSize: 14,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listingImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  buyerName: {
    fontSize: 14,
    color: '#6B7280',
  },
  problemCard: {
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  problemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  problemDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  proofsList: {
    paddingVertical: 4,
  },
  proofImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  proofImage: {
    width: '100%',
    height: '100%',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#10B981',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonTextPrimary: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonTextSecondary: {
    color: '#1F2937',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonTextTertiary: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DisputeDetail;
