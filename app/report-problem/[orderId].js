import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db, storage } from '../../firebaseConfig';

const REASONS = [
  'Article non reçu',
  'Article endommagé',
  'Ne correspond pas à la description',
  'Autre'
];

export default function ReportProblemScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { currentUser } = auth;
  
  const [order, setOrder] = useState(null);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Charger les détails de la commande
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) return;
      
      try {
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (orderDoc.exists()) {
          setOrder({ id: orderDoc.id, ...orderDoc.data() });
        } else {
          Alert.alert('Erreur', 'Commande introuvable');
          router.back();
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la commande:', error);
        Alert.alert('Erreur', 'Impossible de charger les détails de la commande');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  // Sélectionner une image
  const handleImagePick = async () => {
    if (photos.length >= 5) {
      Alert.alert('Limite atteinte', 'Vous ne pouvez ajouter que 5 photos maximum');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  // Supprimer une photo
  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  // Soumettre le litige
  const handleSubmitDispute = async () => {
    if (!reason || !description) {
      Alert.alert('Champs manquants', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitLoading(true);

    try {
      // 1. Upload des photos
      const photoUrls = [];
      
      for (const uri of photos) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileName = uri.split('/').pop();
        const storageRef = ref(storage, `dispute-evidence/${orderId}/${fileName}`);
        
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        photoUrls.push(downloadURL);
      }

      // 2. Créer le document de litige
      await addDoc(collection(db, 'disputes'), {
        orderId: orderId,
        listingId: order.listingId,
        buyerId: currentUser.uid,
        sellerId: order.sellerId,
        reason: reason,
        description: description,
        photoUrls: photoUrls,
        status: 'open',
        createdAt: serverTimestamp(),
      });

      // 3. Mettre à jour le statut de la commande
      await updateDoc(doc(db, 'orders', orderId), { 
        status: 'disputed',
        updatedAt: serverTimestamp()
      });

      Alert.alert(
        'Litige soumis', 
        'Votre signalement a bien été enregistré. Notre équipe va examiner votre demande sous 48h.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur lors de la soumission du litige:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la soumission du litige');
    } finally {
      setSubmitLoading(false);
    }
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
      {/* En-tête */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Signaler un problème</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Carte Récapitulative */}
          <View style={styles.orderCard}>
            {order.listingImage && (
              <Image 
                source={{ uri: order.listingImage }} 
                style={styles.orderImage} 
                resizeMode="cover"
              />
            )}
            <Text style={styles.orderId}>Commande #{orderId}</Text>
            <Text style={styles.orderTitle} numberOfLines={2}>{order.listingTitle}</Text>
            <Text style={styles.sellerText}>
              Vendu par {order.sellerName ? `@${order.sellerName}` : 'un vendeur'}
            </Text>
          </View>

          {/* Formulaire de litige */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Motif du litige *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={reason}
                onValueChange={(itemValue) => setReason(itemValue)}
                style={styles.picker}
                dropdownIconColor="#6B7280"
              >
                <Picker.Item label="Sélectionner un motif" value="" />
                {REASONS.map((item, index) => (
                  <Picker.Item key={index} label={item} value={item} />
                ))}
              </Picker>
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Description *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Veuillez fournir un maximum de détails sur le problème rencontré..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={8}
              value={description}
              onChangeText={setDescription}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Ajouter des preuves</Text>
            <FlatList
              horizontal
              data={[...photos, { type: 'add' }]}
              keyExtractor={(item, index) => (item.type === 'add' ? 'add' : index.toString())}
              renderItem={({ item, index }) => (
                item.type === 'add' ? (
                  photos.length < 5 && (
                    <TouchableOpacity 
                      style={styles.addPhotoButton}
                      onPress={handleImagePick}
                    >
                      <Ionicons name="add" size={24} color="#6B7280" />
                    </TouchableOpacity>
                  )
                ) : (
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: item }} style={styles.photo} />
                    <TouchableOpacity 
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                )
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosList}
            />
            <Text style={styles.photoLimitText}>
              {photos.length}/5 photos (optionnel)
            </Text>

            <Text style={styles.infoText}>
              Notre équipe examinera votre demande sous 48h. Vous serez notifié par email de l'avancement de votre réclamation.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Pied de page avec bouton de soumission */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            (submitLoading || !reason || !description) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmitDispute}
          disabled={submitLoading || !reason || !description}
        >
          {submitLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Soumettre le litige</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  orderImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sellerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  formSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#111827',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 150,
    marginBottom: 16,
    fontSize: 14,
    color: '#111827',
  },
  photosList: {
    flexGrow: 0,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 8,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoLimitText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#95ba72',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
