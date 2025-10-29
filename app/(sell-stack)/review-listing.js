import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Imports Firebase
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, storage } from '../../firebaseConfig';

const ReviewListingScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentUser } = auth;
  const [isLoading, setIsLoading] = useState(false);

  // Parser les images
  const images = params.images ? JSON.parse(params.images) : [];

  const handlePublish = async () => {
    if (!currentUser) {
      Alert.alert("Connexion requise", "Vous devez être connecté pour publier.");
      return;
    }

    setIsLoading(true);

    try {
      // --- ÉTAPE 1: UPLOAD DES IMAGES (STORAGE) ---
      const uploadedImageUrls = [];

      console.log("Démarrage de l'upload...");

      // Boucler sur chaque image locale
      for (const uri of images) {
        // Convertir l'image locale en fichier "blob"
        const response = await fetch(uri);
        const blob = await response.blob();

        // Créer un nom de fichier unique
        const filename = `${currentUser.uid}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const storageRef = ref(storage, `listings/${filename}`);

        // Uploader le blob
        await uploadBytes(storageRef, blob);

        // Récupérer l'URL de téléchargement publique
        const downloadURL = await getDownloadURL(storageRef);
        uploadedImageUrls.push(downloadURL);
      }

      console.log("Upload terminé. URLs:", uploadedImageUrls);

      // --- ÉTAPE 2: CRÉATION DU DOCUMENT (FIRESTORE) ---
      const listingData = {
        title: params.title,
        description: params.description,
        price: parseFloat(params.price),
        category: params.category,
        condition: params.condition,
        postalCode: params.postalCode,
        imageUrls: uploadedImageUrls,
        userId: currentUser.uid,
        userAvatar: currentUser.photoURL || null,
        createdAt: serverTimestamp(),
        status: 'available',
      };

      // Ajouter le document à la collection "listings"
      await addDoc(collection(db, 'listings'), listingData);
      console.log("Document Firestore créé avec succès.");

      // --- ÉTAPE 3: SUCCÈS ---
      setIsLoading(false);
      Alert.alert(
        "Publication réussie !", 
        "Votre annonce est maintenant en ligne.",
        [
          {
            text: "OK",
            onPress: () => router.replace('/(tabs)/')
          }
        ]
      );

    } catch (e) {
      setIsLoading(false);
      console.error("Erreur lors de la publication : ", e);
      Alert.alert(
        "Erreur de publication", 
        "Un problème est survenu. " + (e.message || "Veuillez réessayer plus tard.")
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Aperçu de votre annonce</Text>
      
      <View style={styles.imageContainer}>
        {images.length > 0 ? (
          <Image 
            source={{ uri: images[0] }} 
            style={styles.mainImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImage}>
            <Text>Aucune image</Text>
          </View>
        )}
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.price}>{parseFloat(params.price).toFixed(2)} €</Text>
        <Text style={styles.titleText}>{params.title}</Text>
        <Text style={styles.category}>{params.category}</Text>
        <Text style={styles.condition}>État: {params.condition}</Text>
        <Text style={styles.description}>{params.description}</Text>
        <Text style={styles.location}>Code postal: {params.postalCode}</Text>
      </View>

      <TouchableOpacity
        style={[styles.publishButton, isLoading && styles.disabledButton]}
        onPress={handlePublish}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.publishButtonText}>Publier l'annonce</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  detailsContainer: {
    marginBottom: 30,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#34D399',
    marginBottom: 10,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  category: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  condition: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: '#333',
  },
  location: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  publishButton: {
    backgroundColor: '#34D399',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  publishButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#A7F3D0',
    opacity: 0.7,
  },
});

export default ReviewListingScreen;
