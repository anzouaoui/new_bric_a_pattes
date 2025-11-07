import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
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
const CARD_WIDTH = (width - 48) / 2;

const FavoritesScreen = () => {
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

        const batchSize = 10;
        const batches = [];
        
        for (let i = 0; i < favoriteIds.length; i += batchSize) {
          batches.push(favoriteIds.slice(i, i + batchSize));
        }

        const listingPromises = batches.map(async (batch) => {
          const q = query(
            collection(db, 'listings'),
            where(documentId(), 'in', batch)
          );
          const querySnapshot = await getDocs(q);
          return querySnapshot.docs.map(doc => {
            const data = doc.data();
            const images = Array.isArray(data.images) && data.images.length > 0 
              ? data.images 
              : ['https://via.placeholder.com/300x200?text=No+Image'];
              
            return {
              id: doc.id,
              ...data,
              images,
              title: data.title || 'Sans titre',
              price: data.price || 0,
              isFavorite: true
            };
          });
        });

        const listingsBatches = await Promise.all(listingPromises);
        const allListings = listingsBatches.flat();
        
        const orderedListings = favoriteIds
          .map(id => allListings.find(listing => listing.id === id))
          .filter(Boolean);

        setFavoriteListings(orderedListings);
      } catch (error) {
        console.error('Error fetching favorites:', error);
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

  const renderItem = ({ item, index }) => {
    console.log('Rendering item', index, item?.id, item?.title);
    // Utiliser imageUrls si disponible, sinon utiliser images, sinon tableau vide
    const images = Array.isArray(item?.imageUrls) ? item.imageUrls : 
                  (Array.isArray(item?.images) ? item.images : []);
    console.log('Processed images:', images);
    
    return (
      <View key={`${item.id}-${index}`} style={styles.cardContainer}>
        <ListingCard 
          item={{
            ...item,
            images: images,
            title: item.title || 'Sans titre',
            price: item.price || 0,
            isFavorite: true
          }} 
          onPress={() => router.push(`/listing/${item.id}`)}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes Favoris</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34D399" />
        </View>
      ) : (
        <FlatList
          data={favoriteListings}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => {
            console.log('List header - Items count:', favoriteListings.length);
            console.log('First item:', favoriteListings[0]);
            return null;
          }}
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
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 8,
    flexGrow: 1,
    width: '100%',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 8,
    width: '100%',
  },
  cardContainer: {
    width: '48%',
    marginBottom: 16,
    marginHorizontal: '1%',
    minHeight: 200, // Hauteur minimale pour éviter les chevauchements
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default FavoritesScreen;
