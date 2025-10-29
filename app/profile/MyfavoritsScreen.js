import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  documentId,
  getDocs 
} from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import ListingCard from '../../components/ListingCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 16px padding on each side + 16px gap between cards

const MyFavoritesScreen = () => {
  const router = useRouter();
  const { currentUser } = auth;
  
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      try {
        // Step 1: Get user's favorite IDs
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (!userDoc.exists()) {
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        const favoriteIds = userData.favorites || [];

        if (favoriteIds.length === 0) {
          setFavoriteListings([]);
          setLoading(false);
          return;
        }

        // Step 2: Fetch favorite listings in batches of 10 (Firestore 'in' query limit)
        const batchSize = 10;
        const batches = [];
        
        for (let i = 0; i < favoriteIds.length; i += batchSize) {
          const batch = favoriteIds.slice(i, i + batchSize);
          batches.push(batch);
        }

        const listingPromises = batches.map(async (batch) => {
          const q = query(
            collection(db, 'listings'),
            where(documentId(), 'in', batch)
          );
          const querySnapshot = await getDocs(q);
          return querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Ensure images is always an array and has at least one item
            const images = Array.isArray(data.images) && data.images.length > 0 
              ? data.images 
              : ['https://via.placeholder.com/300x200?text=No+Image'];
              
            return {
              id: doc.id,
              ...data,
              images, // Ensure images is properly formatted
              // Add default values if they don't exist
              title: data.title || 'Sans titre',
              price: data.price || 0,
              isFavorite: true // Since these are favorites
            };
          });
        });

        const listingsBatches = await Promise.all(listingPromises);
        const allListings = listingsBatches.flat();
        
        // Preserve the order of favorites as per the user's favorites array
        const orderedListings = favoriteIds
          .map(id => allListings.find(listing => listing.id === id))
          .filter(Boolean);

        setFavoriteListings(orderedListings);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        Alert.alert('Erreur', 'Impossible de charger les favoris');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [currentUser]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Aucun favori</Text>
      <Text style={styles.emptyText}>
        Les articles que vous aimez apparaîtront ici
      </Text>
    </View>
  );

  const renderItem = ({ item }) => {
    // Ensure item has all required properties
    const listingItem = {
      ...item,
      images: Array.isArray(item.images) ? item.images : [],
      title: item.title || 'Sans titre',
      price: item.price || 0,
      isFavorite: true
    };

    return (
      <View style={styles.cardContainer}>
        <ListingCard 
          item={listingItem} 
          onPress={() => router.push(`/listing/${item.id}`)}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Favoris</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34D399" />
        </View>
      ) : (
        <FlatList
          data={favoriteListings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerPlaceholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardContainer: {
    width: '48%',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default MyFavoritesScreen;
