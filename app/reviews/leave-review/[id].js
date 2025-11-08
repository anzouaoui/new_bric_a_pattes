import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../../firebaseConfig';

const LeaveReviewScreen = () => {
  const router = useRouter();
  const { id: orderId, sellerId, listingId, listingTitle } = useLocalSearchParams();
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellerName, setSellerName] = useState('le vendeur');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerInfo = async () => {
      try {
        const sellerDoc = await getDoc(doc(db, 'users', sellerId));
        if (sellerDoc.exists()) {
          setSellerName(sellerDoc.data().displayName || 'le vendeur');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des informations du vendeur:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      fetchSellerInfo();
    } else {
      setLoading(false);
    }
  }, [sellerId]);

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      Alert.alert('Erreur', 'Veuillez ajouter un commentaire');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Vous devez être connecté pour laisser un avis');
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData = {
        orderId,
        listingId,
        sellerId,
        buyerId: auth.currentUser.uid,
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
        buyerName: auth.currentUser.displayName || 'Acheteur anonyme',
        listingTitle: listingTitle || 'Produit sans nom'
      };

      // Ajouter l'avis à la collection des avis
      const reviewRef = await addDoc(collection(db, 'reviews'), reviewData);
      
      // Mettre à jour la commande pour indiquer que l'acheteur a laissé un avis
      await updateDoc(doc(db, 'orders', orderId), {
        buyerReviewLeft: true,
        buyerReviewId: reviewRef.id,
        updatedAt: serverTimestamp()
      });

      // Mettre à jour la note moyenne du vendeur
      await updateSellerRating(sellerId);

      Alert.alert(
        'Merci !',
        'Votre avis a été enregistré avec succès.',
        [
          { 
            text: 'OK', 
            onPress: () => router.back() 
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la soumission de l\'avis:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'enregistrement de votre avis.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSellerRating = async (sellerId) => {
    try {
      // Récupérer tous les avis du vendeur
      const reviewsSnapshot = await getDocs(
        query(
          collection(db, 'reviews'),
          where('sellerId', '==', sellerId)
        )
      );

      let totalRating = 0;
      let reviewCount = 0;

      reviewsSnapshot.forEach(doc => {
        totalRating += doc.data().rating;
        reviewCount++;
      });

      const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

      // Mettre à jour la note moyenne du vendeur
      await updateDoc(doc(db, 'users', sellerId), {
        rating: parseFloat(averageRating.toFixed(1)),
        reviewCount
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour de la note du vendeur:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#95ba72" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laisser un avis</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.reviewContainer}>
          <Text style={styles.reviewTitle}>Comment s'est passé votre achat ?</Text>
          <Text style={styles.reviewSubtitle}>
            Partagez votre expérience avec {sellerName} pour aider la communauté
          </Text>

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Votre note</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={star <= rating ? 'star' : 'star-outline'} 
                    size={32} 
                    color={star <= rating ? '#FFD700' : '#D1D5DB'} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.commentContainer}>
            <Text style={styles.commentLabel}>Votre avis</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Décrivez votre expérience (au moins 20 caractères)"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              value={comment}
              onChangeText={setComment}
            />
            <Text style={styles.charCount}>{comment.length}/500</Text>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmitReview}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Publier l'avis</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  reviewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  reviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  reviewSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  ratingContainer: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#374151',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  commentContainer: {
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151',
  },
  commentInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#111827',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#95ba72',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default LeaveReviewScreen;
