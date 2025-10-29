import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ListingCard from '../../components/ListingCard';
import { auth, db } from '../../firebaseConfig';

const ProfileScreen = () => {
  const router = useRouter();
  const { id: profileId } = useLocalSearchParams();
  
  const [userProfile, setUserProfile] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!profileId) return;
      
      try {
        // Fetch user profile
        const userDoc = await getDoc(doc(db, 'users', profileId));
        if (userDoc.exists()) {
          setUserProfile({ id: userDoc.id, ...userDoc.data() });
        }

        // Fetch user listings
        const listingsQuery = query(
          collection(db, 'listings'),
          where('userId', '==', profileId)
        );
        const listingsSnapshot = await getDocs(listingsQuery);
        const listings = listingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserListings(listings);

        // TODO: Fetch user reviews (placeholder for now)
        setUserReviews([
          { id: '1', rating: 5, comment: 'Excellent vendeur !', userName: 'Jean D.', date: '2023-10-20' },
          { id: '2', rating: 4, comment: 'Produit comme décrit, merci !', userName: 'Marie L.', date: '2023-09-15' },
        ]);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profileId]);

  const handleContactSeller = async () => {
    if (!auth.currentUser || !userProfile) return;
    
    try {
      // Check if chat already exists
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', auth.currentUser.uid),
        where('participants', 'array-contains', profileId)
      );
      
      const querySnapshot = await getDocs(q);
      let chatId;
      
      if (!querySnapshot.empty) {
        // Existing chat found
        chatId = querySnapshot.docs[0].id;
      } else {
        // Create new chat
        const newChat = {
          participants: [auth.currentUser.uid, profileId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: '',
          lastMessageAt: serverTimestamp(),
          userNames: {
            [auth.currentUser.uid]: auth.currentUser.displayName || 'Utilisateur',
            [profileId]: userProfile.displayName || 'Vendeur'
          },
          userAvatars: {
            [auth.currentUser.uid]: auth.currentUser.photoURL || '',
            [profileId]: userProfile.avatarUrl || ''
          }
        };
        
        const docRef = await addDoc(chatsRef, newChat);
        chatId = docRef.id;
      }
      
      // Navigate to chat
      router.push(`/chat/${chatId}`);
      
    } catch (error) {
      console.error('Error handling chat:', error);
    }
  };

  const handleToggleFollow = () => {
    setIsFollowing(!isFollowing);
    // TODO: Implement follow/unfollow functionality
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={24} color="#6B7280" />
        </View>
        <View>
          <Text style={styles.reviewerName}>{item.userName}</Text>
          <View style={styles.ratingContainer}>
            {[...Array(5)].map((_, i) => (
              <Ionicons 
                key={i} 
                name={i < item.rating ? 'star' : 'star-outline'} 
                size={16} 
                color="#F59E0B" 
              />
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.reviewText}>{item.comment}</Text>
      <Text style={styles.reviewDate}>{item.date}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <Text>Profil non trouvé</Text>
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
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity onPress={handleContactSeller} style={styles.chatButton}>
          <Ionicons name="chatbubble-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {userProfile.avatarUrl ? (
              <Image 
                source={{ uri: userProfile.avatarUrl }} 
                style={styles.avatar} 
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color="#6B7280" />
              </View>
            )}
            <View style={styles.onlineBadge} />
          </View>
          
          <Text style={styles.userName}>{userProfile.displayName || 'Utilisateur'}</Text>
          <Text style={styles.location}>📍 Paris, France</Text>
          <Text style={styles.memberSince}>
            Membre depuis {userProfile.createdAt?.toDate?.().toLocaleDateString('fr-FR') || 'quelque temps'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.button, isFollowing ? styles.buttonSecondary : styles.buttonOutline]}
            onPress={handleToggleFollow}
          >
            <Text style={isFollowing ? styles.buttonSecondaryText : styles.buttonOutlineText}>
              {isFollowing ? 'Suivi(e)' : 'Suivre'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.buttonPrimary]} 
            onPress={handleContactSeller}
          >
            <Text style={styles.buttonPrimaryText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Ratings Section */}
        <View style={styles.ratingsCard}>
          <View style={styles.ratingsHeader}>
            <Text style={styles.sectionTitle}>Avis et évaluations</Text>
            <View style={styles.ratingOverview}>
              <Text style={styles.ratingScore}>4.8</Text>
              <View style={styles.starsContainer}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons key={i} name="star" size={20} color="#F59E0B" />
                ))}
              </View>
            </View>
          </View>
          
          {/* Rating Distribution */}
          <View style={styles.ratingDistribution}>
            {[5, 4, 3, 2, 1].map((rating) => (
              <View key={rating} style={styles.ratingBarContainer}>
                <Text style={styles.ratingLabel}>{rating}</Text>
                <View style={styles.ratingBarBackground}>
                  <View 
                    style={[
                      styles.ratingBarFill, 
                      { width: `${(rating / 5) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
          
          <TouchableOpacity style={[styles.button, styles.buttonSecondary, styles.leaveReviewButton]}>
            <Text style={styles.buttonSecondaryText}>Laisser un avis</Text>
          </TouchableOpacity>
        </View>

        {/* Reviews Preview */}
        {userReviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Avis récents</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={userReviews.slice(0, 2)}
              renderItem={renderReviewItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* User Listings */}
        {userListings.length > 0 && (
          <View style={styles.listingsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Annonces de {userProfile.displayName || 'cet utilisateur'}
              </Text>
              {userListings.length > 3 && (
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>Tout voir</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <FlatList
              data={userListings}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => router.push(`/listing/${item.id}`)}
                  style={styles.listingCard}
                >
                  <ListingCard item={item} />
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listingsContainer}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  chatButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  onlineBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  memberSince: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonPrimary: {
    backgroundColor: '#10B981',
    marginLeft: 12,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  buttonSecondaryText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  buttonOutlineText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  ratingsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  ratingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingOverview: {
    alignItems: 'center',
  },
  ratingScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  ratingDistribution: {
    marginBottom: 16,
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    width: 24,
    fontSize: 14,
    color: '#4B5563',
  },
  ratingBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginLeft: 8,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  leaveReviewButton: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllText: {
    color: '#10B981',
    fontWeight: '500',
    fontSize: 14,
  },
  reviewsSection: {
    marginBottom: 24,
  },
  reviewItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  reviewText: {
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  listingsSection: {
    marginBottom: 32,
  },
  listingsContainer: {
    paddingHorizontal: 20,
  },
  listingCard: {
    width: 200,
    marginRight: 16,
  },
});

export default ProfileScreen;
