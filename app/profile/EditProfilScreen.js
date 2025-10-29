import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  ScrollView, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';

const EditProfileScreen = () => {
  const router = useRouter();
  const { currentUser } = auth;
  const storage = getStorage();

  // State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUserData(userData);
          setDisplayName(userData.displayName || '');
          setPostalCode(userData.postalCode || '');
          setEmail(currentUser.email || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Erreur', 'Impossible de charger les données du profil');
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Handle image picker
  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de la permission d\'accéder à votre galerie pour changer votre photo de profil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sélection de l\'image');
    }
  };

  // Save profile changes
  const handleSave = async () => {
    if (!currentUser) return;
    if (!displayName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom d\'utilisateur');
      return;
    }

    setIsLoading(true);
    let newAvatarUrl = currentUserData?.avatarUrl || null;

    try {
      // Upload new avatar if one was selected
      if (avatarUri) {
        setIsUploading(true);
        const response = await fetch(avatarUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `avatars/${currentUser.uid}`);
        await uploadBytes(storageRef, blob);
        newAvatarUrl = await getDownloadURL(storageRef);
      }

      // Update Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { 
        displayName: displayName.trim(),
        postalCode: postalCode.trim(),
        ...(newAvatarUrl && { avatarUrl: newAvatarUrl })
      });

      // Update Auth profile
      await updateProfile(currentUser, {
        displayName: displayName.trim(),
        ...(newAvatarUrl && { photoURL: newAvatarUrl })
      });

      Alert.alert('Succès', 'Profil mis à jour avec succès');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: avatarUri || currentUserData?.avatarUrl || 'https://via.placeholder.com/120' }}
              style={styles.avatar}
            />
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={handleImagePick}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nom d'utilisateur</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Votre nom d'utilisateur"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Adresse e-mail</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={email}
            editable={false}
            selectTextOnFocus={false}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Code postal</Text>
          <TextInput
            style={styles.input}
            value={postalCode}
            onChangeText={setPostalCode}
            placeholder="Votre code postal"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            maxLength={5}
          />
        </View>
      </ScrollView>

      {/* Footer with Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, (isLoading || isUploading) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading || isUploading}
        >
          {isLoading || isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
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
  scrollContent: {
    paddingBottom: 120, // Space for the sticky footer
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 2,
  },
  formGroup: {
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  saveButton: {
    backgroundColor: '#10B981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
