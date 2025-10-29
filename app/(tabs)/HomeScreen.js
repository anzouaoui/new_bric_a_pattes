import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // <--- FIX 1: Importer useRouter
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../firebaseConfig';
import FilterModal from '../FilterModal';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - 16 - (CARD_MARGIN * 4)) / 2;

const ListingCard = ({ item, onPress }) => (
  <TouchableOpacity 
    style={styles.cardContainer}
    onPress={() => onPress(item)}
  >
    {item.imageUrls && item.imageUrls.length > 0 ? (
      <Image 
        source={{ uri: item.imageUrls[0] }} 
        style={styles.cardImage} 
        resizeMode="cover"
      />
    ) : (
      <View style={[styles.cardImage, {backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center'}]}>
        <Ionicons name="image-outline" size={40} color="#ccc" />
      </View>
    )}
    <TouchableOpacity style={styles.likeButton}>
      <Ionicons name="heart-outline" size={24} color="#000" />
    </TouchableOpacity>
    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
    <Text style={styles.cardPrice}>{item.price} €</Text>
    <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
  </TouchableOpacity>
);

// <--- FIX 3: 'EmptyState' reçoit 'onSellPress' au lieu de 'navigation'
const EmptyState = ({ onSellPress }) => (
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
      onPress={onSellPress} // <--- FIX 3: Appel de la prop
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

// <--- FIX 2: Retrait de { navigation } des props
export default function HomeScreen() {
  const router = useRouter(); // <--- FIX 2: Utilisation du hook
  
  // États pour les filtres
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    categories: [],
    priceRange: [5, 50],
    postalCode: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);

  // Fonction pour charger les annonces avec filtrage
  const fetchListings = async (filters = {}) => {
    try {
      setIsLoading(true);
      
      // Récupérer toutes les annonces sans filtre initial
      const querySnapshot = await getDocs(collection(db, 'listings'));
      let listingsData = [];
      
      querySnapshot.forEach((doc) => {
        listingsData.push({ id: doc.id, ...doc.data() });
      });
      
      // Trier par date de création (les plus récentes en premier)
      listingsData.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB - dateA;
      });

      // Appliquer les filtres
      let filteredData = [...listingsData];
      
      // Filtrer par catégorie
      if (filters.categories && filters.categories.length > 0) {
        filteredData = filteredData.filter(item => 
          item.category && filters.categories.includes(item.category)
        );
      }
      
      // Filtrer par prix
      filteredData = filteredData.filter(item => {
        const price = parseFloat(item.price) || 0;
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
      
      // Filtrer par code postal si spécifié
      if (filters.postalCode) {
        filteredData = filteredData.filter(item => 
          item.postalCode && item.postalCode.startsWith(filters.postalCode)
        );
      }
      
      setListings(listingsData);
      setFilteredListings(filteredData);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement initial des annonces
  useEffect(() => {
    fetchListings(activeFilters);
  }, []);
  
  // Fonction pour gérer l'application des filtres
  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    fetchListings(filters);
  };

  const handleListingPress = (item) => {
    // Navigation vers l'écran de détail de l'annonce
    router.push(`/listing/${item.id}`);
  };

  if (isLoading) {
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
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setIsFilterModalVisible(true)}
        >
          <Ionicons name="options-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Liste des annonces */}
      {listings.length === 0 ? (
        <EmptyState 
          onSellPress={() => router.push('SelectCategoryScreen')} 
        />
      ) : (
        <FlatList
          data={filteredListings.length > 0 ? filteredListings : listings}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ListingCard 
              item={item} 
              onPress={handleListingPress} 
            />
          )}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<View style={{ height: 16 }} />}
          ListEmptyComponent={
            <View style={styles.emptyResults}>
              <Text style={styles.emptyResultsText}>
                Aucune annonce ne correspond à vos critères de recherche.
              </Text>
            </View>
          }
        />
      )}

      {/* Bouton d'action flottant */}
      <TouchableOpacity 
        style={styles.fab}
        // <--- FIX 4: Utilisation de router.push
        onPress={() => router.push('/(sell-stack)/select-category')}
      >
        <Feather name="plus" size={30} color="#FFF" />
      </TouchableOpacity>
      </View>
      
      {/* Modal de filtrage */}
      <FilterModal
        isVisible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
      />
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
    padding: 8,
    marginLeft: 12,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyResultsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
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
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#f8f8f8',
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