import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [order, setOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isBuyer, setIsBuyer] = useState(false);
  const [targetUser, setTargetUser] = useState({ id: null, name: '' });

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (orderDoc.exists()) {
          const orderData = { id: orderDoc.id, ...orderDoc.data() };
          setOrder(orderData);
          
          // Déterminer si l'utilisateur actuel est l'acheteur ou le vendeur
          const currentUserId = auth.currentUser?.uid;
          const isUserBuyer = currentUserId === orderData.buyerId;
          setIsBuyer(isUserBuyer);
          
          // Définir la cible de l'avis
          setTargetUser({
            id: isUserBuyer ? orderData.sellerId : orderData.buyerId,
            name: isUserBuyer ? orderData.sellerName : orderData.buyerName
          });
        } else {
          setError('Commande non trouvée');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération de la commande:', err);
        setError('Erreur lors du chargement des détails de la commande');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handleSubmitReview = async () => {
    if (!rating) {
      setError('Veuillez attribuer une note');
      return;
    }
    if (!comment.trim()) {
      setError('Veuillez écrire un commentaire');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const currentUserId = auth.currentUser.uid;
      const reviewData = {
        orderId,
        sourceId: currentUserId, // Celui qui laisse l'avis
        targetId: targetUser.id, // Celui qui est évalué
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
        role: isBuyer ? 'buyer' : 'seller',
        itemTitle: order?.itemTitle,
        targetName: targetUser.name,
        orderDate: order?.createdAt
      };

      // Créer un nouvel avis
      const reviewRef = doc(collection(db, 'reviews'));
      await setDoc(reviewRef, reviewData);

      // Mettre à jour la commande pour indiquer que l'avis a été laissé
      const orderRef = doc(db, 'orders', orderId);
      const updateData = isBuyer 
        ? { buyerReviewLeft: true }
        : { sellerReviewLeft: true };
      
      await setDoc(orderRef, updateData, { merge: true });

      // Rediriger vers l'écran précédent ou l'écran des commandes
      router.back();
    } catch (err) {
      console.error('Erreur lors de la soumission de l\'avis:', err);
      setError('Une erreur est survenue lors de la soumission de votre avis');
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
        <Text style={styles.title}>
          {isBuyer ? 'Évaluer le vendeur' : 'Évaluer l\'acheteur'}
          {targetUser.name && ` ${targetUser.name}`}
        </Text>
        
        <Text style={styles.subtitle}>
          {isBuyer 
            ? 'Votre avis aidera les autres acheteurs' 
            : 'Votre avis aidera les autres vendeurs'}
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
