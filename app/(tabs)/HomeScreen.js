import { Feather, Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 16 - (CARD_MARGIN * 4)) / 2;

const ListingCard = ({ item, onPress }) => (
  <TouchableOpacity 
    style={styles.cardContainer}
    onPress={() => onPress(item)}
  >
    <Image 
      source={{ uri: item.imageUrl }} 
      style={styles.cardImage} 
      resizeMode="cover"
    />
    <TouchableOpacity style={styles.likeButton}>
      <Ionicons name="heart-outline" size={24} color="#000" />
    </TouchableOpacity>
    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
    <Text style={styles.cardPrice}>{item.price} €</Text>
    <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
  </TouchableOpacity>
);

const EmptyState = ({ navigation }) => (
  <View style={styles.emptyContainer}>
    <Image 
      source={require('../../assets/images/empty-state.png')} 
      style={styles.emptyImage}
    />
    <Text style={styles.emptyTitle}>Oh, c'est bien calme ici...</Text>
    <Text style={styles.emptySubtitle}>
      Il n'y a pas encore d'annonces dans votre zone. Soyez le premier à publier une annonce !
    </Text>
    <TouchableOpacity 
      style={styles.primaryButton}
      onPress={() => navigation.navigate('Vendre')}
    >
      <Text style={styles.primaryButtonText}>Vendre un article</Text>
    </TouchableOpacity>
    <TouchableOpacity 
      style={styles.secondaryButton}
      onPress={() => {}}
    >
      <Text style={styles.secondaryButtonText}>Définir mes préférences</Text>
    </TouchableOpacity>
  </View>
);

export default function HomeScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'listings'));
        const listingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setListings(listingsData);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const handleListingPress = (item) => {
    // Navigation vers l'écran de détail de l'annonce
    // navigation.navigate('ListingDetail', { listingId: item.id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34D399" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
      {/* Header avec barre de recherche */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un accessoire..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Liste des annonces */}
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState navigation={navigation} />}
        ListHeaderComponent={<View style={{ height: 16 }} />}
        renderItem={({ item }) => (
          <ListingCard item={item} onPress={handleListingPress} />
        )}
      />

      {/* Bouton d'action flottant */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('Vendre')}
      >
        <Feather name="plus" size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingTop: 8,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    marginLeft: 12,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  cardContainer: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  likeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    color: '#1F2937',
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#111827',
  },
  cardLocation: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '20%',
    paddingHorizontal: 24,
  },
  emptyImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1F2937',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#34D399',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 16,
    padding: 8,
  },
  secondaryButtonText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#34D399',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
