import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';

const ProfileRow = ({ icon, label, badge, onPress }) => (
  <TouchableOpacity style={styles.profileRow} onPress={onPress}>
    <View style={styles.rowContent}>
      <View style={styles.rowIcon}>
        {icon}
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {badge !== undefined && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.chevron} />
    </View>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const [userProfile, setUserProfile] = useState(null);
  const [listingCount, setListingCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const router = useRouter();
  const { currentUser } = auth;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        // Fetch user profile
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
          setFavoriteCount(userDoc.data()?.favorites?.length || 0);
        }

        // Fetch user's listings count
        const listingsQuery = query(
          collection(db, 'listings'),
          where('userId', '==', currentUser.uid)
        );
        const listingsSnapshot = await getDocs(listingsQuery);
        setListingCount(listingsSnapshot.size);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // The root _layout.js will handle the redirection to the auth flow
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: userProfile.avatarUrl || 'https://via.placeholder.com/90' }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{userProfile.displayName || 'Utilisateur'}</Text>
          <Text style={styles.location}>📍 {userProfile.location || 'Paris, France'}</Text>

          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push('/profile/EditProfilScreen')}
          >
            <Text style={styles.editButtonText}>Modifier le profil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <ProfileRow
            icon={<Ionicons name="pricetag-outline" size={22} color="#4B5563" />}
            label="Mes Annonces"
            badge={listingCount}
            onPress={() => router.push('/profile/MyListingsScreen')}
          />
          <View style={styles.divider} />
          <ProfileRow
            icon={<Ionicons name="heart-outline" size={22} color="#4B5563" />}
            label="Mes Favoris"
            badge={favoriteCount}
            onPress={() => router.push('/profile/MyfavoritsScreen')}
          />
          <View style={styles.divider} />
          <ProfileRow
            icon={<Ionicons name="bag-handle-outline" size={22} color="#4B5563" />}
            label="Mes Achats"
            onPress={() => router.push('/profile/MyOrdersScreen')}
          />
          <View style={styles.divider} />
          <ProfileRow
            icon={<Ionicons name="bag-handle-outline" size={22} color="#4B5563" />}
            label="Mes Ventes"
            onPress={() => router.push('/profile/MySalesScreen')}
          />
          <View style={styles.divider} />
          <ProfileRow
            icon={<Ionicons name="settings-outline" size={22} color="#4B5563" />}
            label="Paramètres"
            onPress={() => router.push('SettingsScreen')}
          />
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
          <ProfileRow
            icon={<Ionicons name="help-circle-outline" size={22} color="#4B5563" />}
            label="Aide & Support"
            onPress={() => router.push('/profile/support')}
          />
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <View style={styles.logoutContent}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  settingsButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E5E7EB',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#111827',
  },
  location: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  editButton: {
    backgroundColor: '#E0F2F1',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginTop: 24,
  },
  editButtonText: {
    color: '#0D9488',
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  profileRow: {
    paddingVertical: 12,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    width: 24,
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  badge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    marginLeft: 'auto',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  logoutContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 8,
  },
});
