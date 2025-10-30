import { Stack, useRouter } from 'expo-router';
import { collection, onSnapshot, query } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Linking, Switch, StyleSheet, Text, View } from 'react-native';
import NotificationItem from '../components/NotificationItem';
import { auth, db } from '../firebaseConfig';

export default function NotificationsScreen() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const router = useRouter();

  // Vérifier les permissions au chargement
  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionsGranted(status === 'granted');
    };
    checkPermissions();
  }, []);

  // Gérer le basculement des permissions
  const handleToggleSwitch = async () => {
    if (permissionsGranted) {
      // Ouvrir les paramètres de l'application
      Linking.openSettings();
    } else {
      // Demander la permission
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionsGranted(status === 'granted');
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
          collection(db, 'users', user.uid, 'notifications'),
        );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setNotifications(items);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Image 
          source={require('../assets/images/empty-state.png')} 
          style={styles.emptyImage}
          resizeMode="contain"
        />
        <Text style={styles.emptyText}>Vous n'avez aucune notification pour le moment.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Notifications' }} />
      
      {/* Section de contrôle des notifications */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>Autoriser les notifications</Text>
        <Switch
          trackColor={{ false: "#E9E9EA", true: "#007AFF" }}
          thumbColor={"#FFFFFF"}
          ios_backgroundColor="#E9E9EA"
          onValueChange={handleToggleSwitch}
          value={permissionsGranted}
        />
      </View>

      {/* Contenu des notifications */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image 
            source={require('../assets/images/empty-state.png')} 
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>Vous n'avez aucune notification pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItem item={item} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    padding: 10,
  },
});
