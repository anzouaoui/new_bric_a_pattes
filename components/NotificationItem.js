import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { firebase } from '../firebaseConfig';

const NotificationItem = ({ item }) => {
  const router = useRouter();

  const getIconName = (type) => {
    switch (type) {
      case 'offer':
        return 'pricetag-outline';
      case 'order':
        return 'cart-outline';
      case 'message':
        return 'chatbubble-outline';
      case 'system':
      default:
        return 'notifications-outline';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `Aujourd'hui, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48) {
      return `Hier, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handlePress = async () => {
    try {
      const user = firebase.auth().currentUser;
      if (user && !item.read) {
        await firebase
          .firestore()
          .collection('users')
          .doc(user.uid)
          .collection('notifications')
          .doc(item.id)
          .update({ read: true });
      }

      if (item.link) {
        router.push(item.link);
      } else if (item.resourceId) {
        if (item.type === 'order') {
          router.push(`/order-detail/${item.resourceId}`);
        } else if (item.type === 'message') {
          router.push(`/chat/${item.resourceId}`);
        }
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, !item.read && styles.unreadContainer]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getIconName(item.type)} 
          size={24} 
          color={item.read ? '#666' : '#007AFF'} 
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.read && styles.unreadTitle]}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.date}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadContainer: {
    backgroundColor: '#f0f8ff',
  },
  iconContainer: {
    marginRight: 15,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#000',
  },
  body: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    alignSelf: 'center',
    marginLeft: 10,
  },
});

export default NotificationItem;
