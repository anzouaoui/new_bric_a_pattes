import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import ReviewCard from '../../components/ReviewCard';

const TabButton = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.tabButton, active && styles.tabButtonActive]}
    onPress={onPress}
  >
    <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const StatsHeader = ({ averageRating, totalReviews }) => {
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => {
          if (star <= fullStars) {
            return (
              <Ionicons
                key={star}
                name="star"
                size={24}
                color="#FFD700"
                style={styles.starIcon}
              />
            );
          } else if (star === fullStars + 1 && hasHalfStar) {
            return (
              <Ionicons
                key={star}
                name="star-half"
                size={24}
                color="#FFD700"
                style={styles.starIcon}
              />
            );
          } else {
            return (
              <Ionicons
                key={star}
                name="star-outline"
                size={24}
                color="#D1D5DB"
                style={styles.starIcon}
              />
            );
          }
        })}
      </View>
    );
  };

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Note moyenne</Text>
      <View style={styles.ratingContainer}>
        <Text style={styles.averageRating}>
          {averageRating.toFixed(1).replace('.', ',')}
        </Text>
        <Text style={styles.outOfFive}>/5</Text>
      </View>
      {renderStars(averageRating)}
      <Text style={styles.reviewCount}>
        {totalReviews} {totalReviews > 1 ? 'avis' : 'avis'}
      </Text>
    </View>
  );
};

export default function MyReviewsScreen() {
  const [loading, setLoading] = useState(true);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [sentReviews, setSentReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [selectedTab, setSelectedTab] = useState('received');
  const router = useRouter();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Récupérer les avis reçus
    const receivedQuery = query(
      collection(db, 'reviews'),
      where('targetId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeReceived = onSnapshot(receivedQuery, (snapshot) => {
      const reviews = [];
      let totalRating = 0;
      
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        reviews.push(data);
        totalRating += data.rating;
      });
      
      setReceivedReviews(reviews);
      
      // Calculer la moyenne des notes
      const avg = reviews.length > 0 ? totalRating / reviews.length : 0;
      setAverageRating(avg);
      setTotalReviews(reviews.length);
      
      if (loading) setLoading(false);
    });

    // Récupérer les avis laissés
    const sentQuery = query(
      collection(db, 'reviews'),
      where('sourceId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
      const reviews = [];
      snapshot.forEach((doc) => {
        reviews.push({ id: doc.id, ...doc.data() });
      });
      setSentReviews(reviews);
    });

    return () => {
      unsubscribeReceived();
      unsubscribeSent();
    };
  }, [currentUser]);

  const renderReviewItem = ({ item }) => (
    <ReviewCard review={item} />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const currentData = selectedTab === 'received' ? receivedReviews : sentReviews;
  const emptyMessage = selectedTab === 'received' 
    ? "Vous n'avez pas encore reçu d'avis."
    : "Vous n'avez pas encore laissé d'avis.";

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Mes Évaluations',
          headerBackTitle: 'Retour',
        }}
      />

      <StatsHeader 
        averageRating={averageRating} 
        totalReviews={totalReviews} 
      />

      <View style={styles.tabContainer}>
        <TabButton
          label="Avis Reçus"
          active={selectedTab === 'received'}
          onPress={() => setSelectedTab('received')}
        />
        <TabButton
          label="Avis Laissés"
          active={selectedTab === 'sent'}
          onPress={() => setSelectedTab('sent')}
        />
      </View>

      <FlatList
        data={currentData}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        }
      />
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
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  averageRating: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
  },
  outOfFive: {
    fontSize: 20,
    color: '#6B7280',
    marginBottom: 4,
    marginLeft: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starIcon: {
    marginHorizontal: 2,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#007AFF',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },
});
