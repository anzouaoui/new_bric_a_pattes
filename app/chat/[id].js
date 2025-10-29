import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

const MessageBubble = ({ item, currentUserId }) => {
  const isSentByMe = item.userId === currentUserId;

  return (
    <View style={[styles.messageContainer, isSentByMe ? styles.sentContainer : styles.receivedContainer]}>
      <View 
        style={[
          styles.bubble,
          isSentByMe ? styles.sentBubble : styles.receivedBubble
        ]}
      >
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.messageImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={isSentByMe ? styles.sentText : styles.receivedText}>
            {item.text}
          </Text>
        )}
        {isSentByMe && (
          <View style={styles.statusContainer}>
            <Ionicons 
              name="checkmark-done" 
              size={16} 
              color="white" 
              style={styles.statusIcon}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const flatListRef = useRef(null);
  const router = useRouter();
  const { id: chatId } = useLocalSearchParams();
  const currentUser = auth.currentUser;

  // Charger les messages
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = [];
      snapshot.forEach((doc) => {
        messagesData.push({
          id: doc.id,
          ...doc.data(),
          // Convertir le timestamp Firestore en objet Date si nécessaire
          createdAt: doc.data().createdAt?.toDate() || new Date()
        });
      });
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    if (newMessageText.trim() === '') return;
    
    const textToSend = newMessageText.trim();
    setNewMessageText('');

    try {
      // Ajouter le nouveau message à la sous-collection messages
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: textToSend,
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Utilisateur anonyme'
      });

      // Mettre à jour le document parent chat pour la prévisualisation
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessagePreview: textToSend,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageUserId: currentUser.uid
      });

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      // Optionnel: Afficher une alerte à l'utilisateur
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Image 
          source={{ uri: 'https://via.placeholder.com/40' }} // Remplacer par l'URL de l'avatar de l'utilisateur
          style={styles.avatar}
        />
        
        <Text style={styles.contactName}>Camille</Text>
        
        <View style={styles.headerSpacer} />
        
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Liste des messages */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble item={item} currentUserId={currentUser?.uid} />
          )}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          onContentSizeChange={() => {
            if (flatListRef.current && messages.length > 0) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }}
        />

        {/* Zone de saisie */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.plusButton}>
            <Ionicons name="add-circle-outline" size={32} color="#34D399" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Écrivez votre message..."
            value={newMessageText}
            onChangeText={setNewMessageText}
            multiline
          />
          
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={handleSend}
            disabled={!newMessageText.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={newMessageText.trim() ? "#34D399" : "#9CA3AF"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 12,
    backgroundColor: '#E5E7EB',
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#111827',
  },
  headerSpacer: {
    flex: 1,
  },
  menuButton: {
    padding: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  sentContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
  },
  sentBubble: {
    backgroundColor: '#34D399',
    borderBottomRightRadius: 0,
  },
  receivedBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 0,
  },
  sentText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  receivedText: {
    color: '#111827',
    fontSize: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  statusIcon: {
    marginLeft: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  plusButton: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 120,
    fontSize: 16,
    color: '#111827',
  },
  sendButton: {
    marginLeft: 12,
    padding: 8,
  },
});
