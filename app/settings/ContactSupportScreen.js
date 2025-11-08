import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db, storage } from '../../firebaseConfig';

export default function ContactSupportScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setAttachment({
          uri: result.uri,
          name: result.name,
          type: result.mimeType
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    const { currentUser } = auth;

    try {
      let attachmentUrl = null;

      // Upload de la pièce jointe si elle existe
      if (attachment) {
        try {
          const response = await fetch(attachment.uri);
          const blob = await response.blob();
          const storageRef = ref(storage, `support-tickets/${currentUser.uid}/${Date.now()}_${attachment.name}`);
          await uploadBytes(storageRef, blob);
          attachmentUrl = await getDownloadURL(storageRef);
        } catch (error) {
          console.error('Erreur lors de l\'upload du fichier:', error);
          Alert.alert('Erreur', 'Impossible de téléverser la pièce jointe');
          setLoading(false);
          return;
        }
      }

      // Création du ticket dans Firestore
      await addDoc(collection(db, 'supportTickets'), {
        subject: subject.trim(),
        message: message.trim(),
        attachmentUrl: attachmentUrl,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        status: 'open',
        createdAt: serverTimestamp(),
      });

      setLoading(false);
      Alert.alert(
        'Message envoyé',
        'Notre équipe vous répondra sous 24h.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setLoading(false);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'envoi du message');
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
        <Text style={styles.headerTitle}>Nous Contacter</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <Text style={styles.description}>
          Décrivez votre problème, notre équipe vous répondra dans les plus brefs délais.
        </Text>

        {/* Formulaire */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Sujet</Text>
          <TextInput
            style={styles.input}
            placeholder="Entrez l'objet de votre message"
            value={subject}
            onChangeText={setSubject}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Votre message</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Rédigez votre message ici..."
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Pièce jointe */}
        <View style={styles.attachmentContainer}>
          <View style={styles.attachmentHeader}>
            <View style={styles.attachmentIconContainer}>
              <Ionicons name="attach" size={20} color="#4B5563" />
            </View>
            <Text style={styles.attachmentLabel}>Pièce jointe (optionnel)</Text>
            <TouchableOpacity onPress={handleFilePick} style={styles.attachButton}>
              <Text style={styles.attachButtonText}>Joindre un fichier</Text>
            </TouchableOpacity>
          </View>
          
          {attachment && (
            <View style={styles.attachmentPreview}>
              <Ionicons name="document-text-outline" size={20} color="#4B5563" />
              <Text style={styles.attachmentName} numberOfLines={1}>
                {attachment.name}
              </Text>
              <TouchableOpacity 
                onPress={() => setAttachment(null)}
                style={styles.removeAttachmentButton}
              >
                <Ionicons name="close" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pied de page avec bouton d'envoi */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Envoyer le message</Text>
          )}
        </TouchableOpacity>
      </View>
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
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 24,
    paddingBottom: 100,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageInput: {
    height: 150,
    textAlignVertical: 'top',
  },
  attachmentContainer: {
    marginTop: 8,
  },
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  attachmentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentLabel: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
  },
  attachButton: {
    padding: 8,
  },
  attachButtonText: {
    color: '#95ba72',
    fontWeight: '600',
    fontSize: 14,
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  attachmentName: {
    flex: 1,
    marginLeft: 12,
    color: '#4B5563',
  },
  removeAttachmentButton: {
    padding: 4,
    marginLeft: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#95ba72',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
