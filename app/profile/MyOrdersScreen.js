import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

// Composant pour afficher une ligne de commande
const OrderRow = ({ item, onPress }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date inconnue';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return `Acheté le ${date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })}`;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending_shipment':
        return styles.statusPending;
      case 'shipped':
        return styles.statusShipped;
      case 'delivered':
      case 'completed':
        return styles.statusDelivered;
      case 'cancelled':
        return styles.statusCancelled;
      default:
        return styles.statusDefault;
    }
  };

  const formatStatus = (status) => {
    const statusMap = {
      'pending_shipment': 'En attente',
      'shipped': 'Expédié',
      'delivered': 'Livré',
      'completed': 'Terminé',
      'cancelled': 'Annulé',
    };
    return statusMap[status] || status;
  };

  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress}>
      <Image 
        source={{ uri: item.listingImage || 'https://via.placeholder.com/60' }} 
        style={styles.orderImage}
      />
      <View style={styles.orderInfo}>
        <Text style={styles.orderTitle} numberOfLines={1}>
          {item.listingTitle || 'Produit sans nom'}
        </Text>
        <Text style={styles.orderDate}>
          {formatDate(item.createdAt)}
          {item.sellerName && ` auprès de ${item.sellerName}`}
        </Text>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
};

export default function MyOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedTab, setSelectedTab] = useState('En cours');
  const [loading, setLoading] = useState(true);
  const { currentUser } = auth;

  // Filtrer les commandes en fonction de l'onglet sélectionné
  const filterOrders = (tab) => {
    let filtered = [...orders];
    
    if (tab === 'En cours') {
      filtered = orders.filter(o => 
        o.status === 'pending_shipment' || 
        o.status === 'shipped' ||
        o.status === 'processing'
      );
    } else if (tab === 'Terminées') {
      filtered = orders.filter(o => 
        o.status === 'delivered' || 
        o.status === 'completed' || 
        o.status === 'cancelled' ||
        o.status === 'refunded'
      );
    }
    // 'Tout' n'a pas besoin de filtre supplémentaire
    
    setFilteredOrders(filtered);
  };

  // Charger les commandes de l'utilisateur
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'orders'), 
      where('buyerId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = [];
      snapshot.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() });
      });
      
      setOrders(ordersList);
      filterOrders(selectedTab);
      setLoading(false);
    }, (error) => {
      console.error('Erreur lors du chargement des commandes:', error);
      setLoading(false);
    });

    // Nettoyer l'abonnement lors du démontage du composant
    return () => unsubscribe();
  }, [currentUser]);

  // Mettre à jour les commandes filtrées lorsque l'onglet change
  useEffect(() => {
    filterOrders(selectedTab);
  }, [selectedTab, orders]);

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34D399" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Achats</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs de filtrage */}
      <View style={styles.tabsContainer}>
        {['En cours', 'Terminées', 'Tout'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              selectedTab === tab && styles.tabButtonActive
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text 
              style={[
                styles.tabText,
                selectedTab === tab && styles.tabTextActive
              ]}
            >
              {tab}
            </Text>
            {selectedTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste des commandes */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderRow 
            item={item} 
            onPress={() => router.push(`/order-detail/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.ordersList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Vous n'avez pas encore effectué d'achats</Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.replace('/(tabs)/')}
            >
              <Text style={styles.browseButtonText}>Parcourir les annonces</Text>
            </TouchableOpacity>
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  tabButtonActive: {
    backgroundColor: 'white',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '100%',
    backgroundColor: '#34D399',
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusShipped: {
    backgroundColor: '#DBEAFE',
  },
  statusDelivered: {
    backgroundColor: '#D1FAE5',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusDefault: {
    backgroundColor: '#F3F4F6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#34D399',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
