import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDoc, setDoc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { auth, db } from '../../../firebaseConfig';

const StarRating = ({ rating, onRatingChange }) => {
  return (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onRatingChange(star)}>
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={32}
            color={star <= rating ? '#FFD700' : '#CCCCCC'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function LeaveReviewScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [order, setOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [seller, setSeller] = useState({ id: null, name: 'le vendeur' });

  useEffect(() => {
    const fetchOrderAndSellerDetails = async () => {
      try {
        // Vérifier que l'utilisateur est connecté
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError('Vous devez être connecté pour laisser un avis');
          setLoading(false);
          return;
        }

        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (!orderDoc.exists()) {
          setError('Commande non trouvée');
          setLoading(false);
          return;
        }

        const orderData = { id: orderDoc.id, ...orderDoc.data() };
        setOrder(orderData);

        // Vérifier que l'utilisateur est bien l'acheteur
        if (currentUser.uid !== orderData.buyerId) {
          setError('Seul l\'acheteur peut laisser un avis pour cette commande');
          setLoading(false);
          return;
        }

        // Vérifier que l'acheteur n'a pas déjà laissé d'avis
        if (orderData.buyerReviewLeft) {
          setError('Vous avez déjà laissé un avis pour cette commande');
          setLoading(false);
          return;
        }

        // Récupérer les informations du vendeur
        const sellerRef = doc(db, 'users', orderData.sellerId);
        const sellerDoc = await getDoc(sellerRef);
        
        if (sellerDoc.exists()) {
          setSeller({
            id: orderData.sellerId,
            name: sellerDoc.data().displayName || 'le vendeur'
          });
        }

      } catch (err) {
        console.error('Erreur lors de la récupération des détails:', err);
        setError('Une erreur est survenue lors du chargement des informations');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderAndSellerDetails();
    }
  }, [orderId]);

  const handleSubmitReview = async () => {
    if (!rating) {
      Alert.alert('Erreur', 'Veuillez attribuer une note');
      return;
    }
    
    if (comment.trim().length < 10) {
      Alert.alert('Erreur', 'Votre commentaire doit contenir au moins 10 caractères');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      // Utilisation d'une transaction pour garantir l'intégrité des données
      await runTransaction(db, async (transaction) => {
        // Vérifier que l'utilisateur n'a pas déjà laissé d'avis
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await transaction.get(orderRef);
        
        if (!orderDoc.exists()) {
          throw new Error('Commande non trouvée');
        }
        
        const orderData = orderDoc.data();
        
        if (orderData.buyerId !== currentUser.uid) {
          throw new Error('Non autorisé');
        }
        
        if (orderData.buyerReviewLeft) {
          throw new Error('Vous avez déjà laissé un avis pour cette commande');
        }

        // Créer un nouvel avis
        const reviewData = {
          orderId,
          sourceId: currentUser.uid, // L'acheteur qui laisse l'avis
          targetId: seller.id,       // Le vendeur évalué
          role: 'buyer_reviewing_seller',
          rating,
          comment: comment.trim(),
          createdAt: serverTimestamp(),
          itemTitle: order?.listingTitle || 'Produit sans nom',
          targetName: seller.name,
          orderDate: order?.createdAt || serverTimestamp()
        };

        // Ajouter l'avis à la collection des avis
        const reviewRef = doc(collection(db, 'reviews'));
        transaction.set(reviewRef, reviewData);

        // Mettre à jour la commande pour indiquer que l'acheteur a laissé un avis
        transaction.update(orderRef, {
          buyerReviewLeft: true,
          updatedAt: serverTimestamp()
        });

        // Mettre à jour la note moyenne du vendeur
        const sellerRef = doc(db, 'users', seller.id);
        const sellerDoc = await transaction.get(sellerRef);
        
        if (sellerDoc.exists()) {
          const sellerData = sellerDoc.data();
          const currentRating = sellerData.rating || 0;
          const reviewCount = sellerData.reviewCount || 0;
          
          const newReviewCount = reviewCount + 1;
          const newRating = ((currentRating * reviewCount) + rating) / newReviewCount;
          
          transaction.update(sellerRef, {
            rating: parseFloat(newRating.toFixed(1)),
            reviewCount: newReviewCount,
            updatedAt: serverTimestamp()
          });
        }
      });

      // Afficher un message de succès et rediriger
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
    } catch (err) {
      console.error('Erreur lors de la soumission de l\'avis:', err);
      setError(err.message || 'Une erreur est survenue lors de la soumission de votre avis');
      Alert.alert('Erreur', err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Laisser un avis',
          headerBackTitle: 'Retour',
        }}
      />

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Partagez votre expérience avec {seller.name}
        </Text>
        
        <Text style={styles.subtitle}>
          Votre avis aidera les autres acheteurs
        </Text>
        
        {order && (
          <View style={styles.orderInfo}>
            <Text style={styles.orderText}>Article : {order.itemTitle}</Text>
            <Text style={styles.orderText}>
              {isBuyer ? 'Vendeur' : 'Acheteur'} : {targetUser.name}
            </Text>
          </View>
        )}

        <View style={styles.ratingContainer}>
          <Text style={styles.ratingLabel}>Votre note :</Text>
          <StarRating rating={rating} onRatingChange={setRating} />
        </View>

        <View style={styles.commentContainer}>
          <Text style={styles.commentLabel}>Votre avis (optionnel) :</Text>
          <TextInput
            style={styles.commentInput}
            placeholder={
              isBuyer 
                ? "Comment évaluez-vous l'article, l'envoi et la communication du vendeur ?"
                : "Comment évaluez-vous la rapidité de paiement et la communication de l'acheteur ?"
            }
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.submitButton, (rating === 0 || submitting) && styles.submitButtonDisabled]}
          onPress={handleSubmitReview}
          disabled={rating === 0 || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Soumettre l'avis</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  orderInfo: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  orderText: {
    fontSize: 16,
    marginBottom: 4,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  commentContainer: {
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  submitButtonDisabled: {
    backgroundColor: '#A7A7A7',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
});
