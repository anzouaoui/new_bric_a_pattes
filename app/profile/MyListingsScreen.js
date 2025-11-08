import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';

// Sub-component for status cards
const StatCard = ({ label, count, color = '#95ba72' }) => (
  <View style={styles.statCard}>
    <Text style={styles.statCount}>{count}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// Sub-component for each listing row
const MyListingRow = ({ item, onPress }) => {
  const [showMenu, setShowMenu] = useState(false);
  const isSold = item.status === 'sold';
  const isBoosted = item.isBoosted;

  const handleAction = (action) => {
    setShowMenu(false);
    // Implement actions (Edit, Mark as Sold, Delete)
    Alert.alert(action, `Action: ${action} - ${item.title}`);
  };

  return (
    <TouchableOpacity 
      style={[styles.listingCard, isBoosted && styles.boostedCard]}
      onPress={onPress}
    >
      <Image 
        source={{ uri: item.imageUrls?.[0] || 'https://via.placeholder.com/60' }} 
        style={styles.listingImage} 
      />
      
      <View style={styles.listingInfo}>
        <View style={[styles.statusBadge, { backgroundColor: isSold ? '#F3F4F6' : '#E0F2F1' }]}>
          <Text style={[styles.statusText, { color: isSold ? '#6B7280' : '#95ba72' }]}>
            {isSold ? 'Vendu' : 'Actif'}
          </Text>
        </View>
        
        <Text style={styles.listingTitle} numberOfLines={1}>
          {item.title}
        </Text>
        
        <Text style={styles.listingMeta}>
          {item.price} € - {item.condition}
        </Text>
      </View>

      {isBoosted && (
        <View style={styles.boostedBadge}>
          <Text style={styles.boostedText}>🚀 Boosté</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => setShowMenu(true)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
      </TouchableOpacity>

      {showMenu && (
        <View style={styles.menuOverlay} onTouchEnd={() => setShowMenu(false)}>
          <View style={styles.menu}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleAction('Modifier')}
            >
              <Ionicons name="create-outline" size={18} color="#4B5563" />
              <Text style={styles.menuText}>Modifier</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleAction('Marquer comme vendu')}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#4B5563" />
              <Text style={styles.menuText}>
                {isSold ? 'Marquer comme disponible' : 'Marquer comme vendu'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.deleteItem]}
              onPress={() => handleAction('Supprimer')}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={[styles.menuText, styles.deleteText]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const MyListingsScreen = () => {
  const router = useRouter();
  const { currentUser } = auth;
  
  const [userListings, setUserListings] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [soldCount, setSoldCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'listings'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listings = [];
      let active = 0;
      let sold = 0;

      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        listings.push(data);
        
        if (data.status === 'sold' || data.status === 'vendu') {
          sold++;
        } else {
          active++;
        }
      });

      setUserListings(listings);
      setActiveCount(active);
      setSoldCount(sold);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching listings:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleListingPress = (listing) => {
    // Navigate to listing detail screen
    router.push(`/listing/${listing.id}`);
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Annonces</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard 
            label="Annonces Actives" 
            count={activeCount} 
            color="#95ba72" 
          />
          <StatCard 
            label="Annonces Vendues" 
            count={soldCount} 
            color="#9CA3AF" 
          />
        </View>

        {/* Listings Section */}
        <Text style={styles.sectionTitle}>Toutes les annonces</Text>
        
        {userListings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucune annonce trouvée</Text>
            <Text style={styles.emptySubtext}>Créez votre première annonce</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/SelectCategoryScreen')}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Nouvelle annonce</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={userListings}
            renderItem={({ item }) => (
              <MyListingRow 
                item={item} 
                onPress={() => handleListingPress(item)} 
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
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
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  listingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  boostedCard: {
    borderWidth: 2,
    borderColor: '#95ba72',
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  listingInfo: {
    flex: 1,
    marginLeft: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  listingMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  boostedBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#95ba72',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  boostedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  menuButton: {
    padding: 8,
    marginLeft: 8,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  menu: {
    position: 'absolute',
    right: 16,
    top: 60,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    width: 220,
    zIndex: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  deleteItem: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  deleteText: {
    color: '#EF4444',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#95ba72',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});

export default MyListingsScreen;
