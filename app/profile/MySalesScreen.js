import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

const statusConfig = {
  paid_pending_shipment: { text: 'À expédier', color: '#F59E0B', bgColor: '#FEF3C7' },
  shipped: { text: 'Expédié', color: '#3B82F6', bgColor: '#DBEAFE' },
  delivered: { text: 'Livré', color: '#95ba72', bgColor: '#D1FAE5' },
  completed: { text: 'Terminé', color: '#95ba72', bgColor: '#D1FAE5' },
  disputed: { text: 'Litige', color: '#EF4444', bgColor: '#FEE2E2' },
};

const formatDate = (timestamp) => {
  try {
    if (!timestamp) return 'Date inconnue';
    
    let date;
    
    // Si c'est un objet Firestore Timestamp
    if (timestamp && typeof timestamp === 'object' && timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } 
    // Si c'est déjà un objet Date
    else if (timestamp instanceof Date) {
      date = timestamp;
    }
    // Si c'est un timestamp numérique (secondes ou millisecondes)
    else if (typeof timestamp === 'number') {
      // Vérifier si c'est en secondes (10 chiffres) ou millisecondes (13 chiffres)
      date = new Date(timestamp.toString().length === 10 ? timestamp * 1000 : timestamp);
    }
    // Si c'est une chaîne de caractères
    else if (typeof timestamp === 'string') {
      // Essayer de parser la date
      date = new Date(timestamp);
      // Si la date n'est pas valide
      if (isNaN(date.getTime())) {
        return timestamp; // Retourner la chaîne originale si elle ne peut pas être convertie
      }
    }
    
    // Si on a réussi à obtenir une date valide
    if (date && !isNaN(date.getTime())) {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    
    // Si aucun format reconnu, retourner une valeur par défaut
    
    // Si on arrive ici, c'est qu'aucun format n'a été reconnu
    return 'Date inconnue';
  } catch (error) {
    console.error('Erreur de formatage de la date:', error, 'Timestamp reçu:', timestamp);
    return 'Date invalide';
  }
};

const SaleRow = ({ item, onPress }) => {
  const status = statusConfig[item.status] || { text: item.status, color: '#6B7280', bgColor: '#F3F4F6' };
  
  return (
    <TouchableOpacity style={styles.saleCard} onPress={onPress}>
      <Image 
        source={{ uri: item.listingImage || 'https://via.placeholder.com/60' }} 
        style={styles.listingImage} 
      />
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {item.listingTitle}
        </Text>
        <Text style={styles.details}>
          Vendu à {item.buyerName || 'un acheteur'}
        </Text>
        <Text style={styles.date}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
        <Text style={[styles.statusText, { color: status.color }]}>
          {status.text}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
};

const MySales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [selectedTab, setSelectedTab] = useState('Tous');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { currentUser } = auth;

  const tabs = ['Tous', 'À expédier', 'Expédié', 'Livré', 'Litige'];

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('sellerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSales(salesData);
      filterSales(selectedTab, salesData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching sales:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filterSales = (tab, salesData = sales) => {
    let filtered = [...salesData];
    
    switch(tab) {
      case 'À expédier':
        filtered = salesData.filter(o => o.status === 'paid_pending_shipment');
        break;
      case 'Expédié':
        filtered = salesData.filter(o => o.status === 'shipped');
        break;
      case 'Livré':
        filtered = salesData.filter(o => o.status === 'delivered' || o.status === 'completed');
        break;
      case 'Litige':
        filtered = salesData.filter(o => o.status === 'disputed');
        break;
      default:
        // 'Tous' - pas de filtre
        break;
    }
    
    setFilteredSales(filtered);
  };

  const handleTabPress = (tab) => {
    setSelectedTab(tab);
    filterSales(tab);
  };

  const handleSalePress = (saleId) => {
    router.push(`/sale-detail/${saleId}`);
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
        <Text style={styles.title}>Mes Ventes</Text>
        <View style={styles.headerPlaceholder} />
      </View> 

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.tabsContainer}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && styles.selectedTab,
            ]}
            onPress={() => handleTabPress(tab)}
          >
            <Text 
              style={[
                styles.tabText,
                selectedTab === tab && styles.selectedTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sales List */}
      <View style={styles.contentContainer}>
        <FlatList
          data={filteredSales}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SaleRow 
              item={item} 
              onPress={() => handleSalePress(item.id)} 
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {sales.length === 0 
                  ? "Vous n'avez pas encore réalisé de ventes." 
                  : "Aucune vente ne correspond à ce filtre."}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    color: '#1F2937',
  },
  headerPlaceholder: {
    width: 32,
  },
  tabsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
    height: 56,
    width: '100%',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    backgroundColor: '#F3F4F6',
    height: 32,
    justifyContent: 'center',
    width: '15%',
  },
  selectedTab: {
    backgroundColor: '#D1FAE5',
  },
  tabText: {
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 16,
  },
  selectedTabText: {
    color: '#95ba72',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  saleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listingImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  details: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 2,
  },
  date: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
    lineHeight: 24,
  },
});

export default MySales;
