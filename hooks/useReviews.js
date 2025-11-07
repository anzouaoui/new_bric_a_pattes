import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const useReviews = (userId) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Créer une requête pour récupérer les avis du vendeur
    const q = query(
      collection(db, 'reviews'),
      where('targetId', '==', userId)
    );

    // S'abonner aux mises à jour en temps réel
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const reviewsData = [];
          querySnapshot.forEach((doc) => {
            reviewsData.push({ id: doc.id, ...doc.data() });
          });
          setReviews(reviewsData);
          setError(null);
        } catch (err) {
          console.error('Erreur lors du traitement des avis:', err);
          setError('Erreur lors du chargement des avis');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Erreur de souscription aux avis:', err);
        setError('Impossible de charger les avis');
        setLoading(false);
      }
    );

    // Nettoyer l'abonnement lors du démontage du composant
    return () => unsubscribe();
  }, [userId]);

  // Calculer la note moyenne et le nombre total d'avis
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews
    : 0;

  return {
    reviews,
    averageRating: parseFloat(averageRating.toFixed(1)),
    totalReviews,
    loading,
    error
  };
};

export default useReviews;
