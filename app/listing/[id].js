import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

const { width } = Dimensions.get('window');

const ListingDetailScreen = () => {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [contactLoading, setContactLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userData, setUserData] = useState(null);
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const fetchUserFavorites = async () => {
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserData(data);
        if (data.favorites?.includes(id)) {
          setIsFavorite(true);
        } else {
          setIsFavorite(false);
        }
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!auth.currentUser) {
      Alert.alert("Connexion requise", "Connectez-vous pour ajouter des favoris.");
      return;
    }

    const userRef = doc(db, 'users', auth.currentUser.uid);

    try {
      if (isFavorite) {
        // Remove from favorites
        await updateDoc(userRef, {
          favorites: arrayRemove(id)
        });
        setIsFavorite(false);
      } else {
        // Add to favorites
        await updateDoc(userRef, {
          favorites: arrayUnion(id)
        }, { merge: true });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des favoris:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour les favoris.");
    }
  };

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setListing({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
        Alert.alert('Error', 'Could not load listing details');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
    if (auth.currentUser) {
      fetchUserFavorites();
    }
  }, [id, auth.currentUser]);

  const onShare = async () => {
    try {
      await Share.share({
        message: `Découvre cette annonce: ${listing?.title} - ${listing?.price}€`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleContactSeller = async () => {
    setContactLoading(true);
    const { currentUser } = auth;

    if (!currentUser) {
      Alert.alert("Connexion requise", "Vous devez être connecté pour contacter un vendeur.");
      setContactLoading(false);
      return;
    }

    // 1. Vérifier si l'utilisateur se contacte lui-même
    if (currentUser.uid === listing.userId) {
      Alert.alert("Action impossible", "Vous ne pouvez pas vous envoyer de message à vous-même.");
      setContactLoading(false);
      return;
    }

    try {
      const buyerId = currentUser.uid;
      const sellerId = listing.userId;

      // 2. Chercher un chat existant entre les deux utilisateurs
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', buyerId));

      const querySnapshot = await getDocs(q);
      let existingChatId = null;

      querySnapshot.forEach(doc => {
        const data = doc.data();
        // Vérifier si l'autre participant est bien le vendeur
        if (data.participants.includes(sellerId)) {
          existingChatId = doc.id;
        }
      });

      // 3. Si un chat existe, y naviguer
      if (existingChatId) {
        router.push(`/chat/${existingChatId}`);
      } else {
        // 4. Sinon, créer un nouveau chat
        console.log("Aucun chat trouvé, création d'un nouveau chat...");

        // Récupérer les infos de l'acheteur et du vendeur pour le chat
        const sellerData = (await getDoc(doc(db, 'users', sellerId))).data();
        const buyerData = (await getDoc(doc(db, 'users', buyerId))).data();

        const newChatData = {
          participants: [buyerId, sellerId],
          participantInfo: {
            [buyerId]: {
              name: buyerData.displayName || buyerData.email,
              avatar: buyerData.photoURL || null,
            },
            [sellerId]: {
              name: sellerData.displayName || sellerData.email,
              avatar: sellerData.photoURL || null,
            }
          },
          lastMessageTimestamp: serverTimestamp(),
          lastMessagePreview: `À propos de : ${listing.title}`,
          listingId: listing.id,
          listingTitle: listing.title,
          listingPrice: listing.price,
          listingImage: listing.images?.[0] || null
        };

        const newChatRef = await addDoc(chatsRef, newChatData);

        // 5. Envoyer un 1er message automatique
        const firstMessage = `Bonjour ! Je suis intéressé(e) par votre annonce : "${listing.title}".`;

        await addDoc(collection(db, 'chats', newChatRef.id, 'messages'), {
          text: firstMessage,
          createdAt: serverTimestamp(),
          userId: buyerId,
        });

        // Mettre à jour le dernier message
        await updateDoc(doc(db, 'chats', newChatRef.id), {
          lastMessagePreview: firstMessage,
          lastMessageTimestamp: serverTimestamp()
        });

        // 6. Naviguer vers le nouveau chat
        router.push(`/chat/${newChatRef.id}`);
      }

    } catch (error) {
      console.error("Erreur lors de la création du chat:", error);
      Alert.alert("Erreur", "Impossible de démarrer la conversation.");
    } finally {
      setContactLoading(false);
    }
  };

  const handleImageScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.floor(event.nativeEvent.contentOffset.x / slideSize);
    setActiveIndex(index);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Annonce non trouvée</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={onShare}
          >
            <Ionicons name="share-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* Carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleImageScroll}
          scrollEventThrottle={200}
          style={styles.carousel}
        >
          {listing.imageUrls?.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.carouselImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {/* Pagination Dots */}
        {listing.imageUrls?.length > 1 && (
          <View style={styles.pagination}>
            {listing.imageUrls.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  { opacity: activeIndex === index ? 1 : 0.5 },
                ]}
              />
            ))}
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title & Price */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{listing.title}</Text>
            <Text style={styles.price}>{listing.price} €</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{listing.description}</Text>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailChip}>
              <Text style={styles.detailLabel}>État</Text>
              <Text style={styles.detailValue}>{listing.condition || 'Non spécifié'}</Text>
            </View>
            <View style={styles.detailChip}>
              <Text style={styles.detailLabel}>Catégorie</Text>
              <Text style={styles.detailValue}>{listing.category || 'Non spécifiée'}</Text>
            </View>
            <View style={styles.detailChip}>
              <Text style={styles.detailLabel}>Lieu</Text>
              <Text style={styles.detailValue}>{listing.postalCode || 'Non spécifié'}</Text>
            </View>
            <View style={styles.detailChip}>
              <Text style={styles.detailLabel}>Marque</Text>
              <Text style={styles.detailValue}>{listing.brand || 'Non spécifiée'}</Text>
            </View>
          </View>

          {/* Seller Info */}
          <TouchableOpacity 
            style={styles.sellerContainer}
            onPress={() => router.push(`/profile/${listing.userId}`)}
          >
            <Image 
              source={{ uri: listing.userAvatar || 'https://via.placeholder.com/50' }} 
              style={styles.avatar} 
            />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{listing.userName || 'Vendeur'}</Text>
              <Text style={styles.rating}>⭐ 4.8 (12 avis)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={handleToggleFavorite}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#EF4444" : "#95ba72"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.buyButton]}
          onPress={() => router.push(`/(checkout)/SummaryScreen?listingId=${id}`)}
        >
          <Text style={styles.buttonText}>Acheter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.contactButton, contactLoading && styles.disabledButton]}
          onPress={handleContactSeller}
          disabled={contactLoading}
        >
          {contactLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Contacter</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carousel: {
    width: '100%',
    height: 350,
  },
  carouselImage: {
    width: width,
    height: 350,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  content: {
    padding: 24,
    paddingBottom: 100, // Pour éviter que le contenu ne soit caché par le footer
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#95ba72',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  detailChip: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EFEFEF',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
  },
  sellerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  sellerName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  rating: {
    color: '#6B7280',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  favoriteButton: {
    borderWidth: 1.5,
    borderColor: '#95ba72',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButton: {
    backgroundColor: '#c59f77',
  },
  buyButton: {
    backgroundColor: '#95ba72',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ListingDetailScreen;
