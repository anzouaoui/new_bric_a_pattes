import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function AddPhotosScreen() {
  const router = useRouter();
  const localSearchParams = useLocalSearchParams();
  const { category } = useLocalSearchParams();
  const [images, setImages] = useState([]);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasGalleryPermission(galleryStatus.status === 'granted');
      
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');
    })();
  }, []);

  const pickImage = async () => {
    if (images.length >= 10) {
      Alert.alert('Limite atteinte', 'Vous ne pouvez ajouter que 10 photos maximum.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 10 - images.length,
        quality: 0.7,
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages(prev => [...prev, ...newImages].slice(0, 10));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner des images.');
    }
  };

  const takePhoto = async () => {
    if (images.length >= 10) {
      Alert.alert('Limite atteinte', 'Vous ne pouvez ajouter que 10 photos maximum.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setImages(prev => [...prev, result.assets[0].uri].slice(0, 10));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre une photo.');
    }
  };

  const removeImage = (uri) => {
    setImages(prev => prev.filter(img => img !== uri));
  };

  const handleNext = () => {
    if (images.length === 0) return;
    
    router.push({
      pathname: 'ReviewListingScreen',
      params: { 
        ...localSearchParams,
        images: JSON.stringify(images)
      }
    });
  };

  const renderItem = ({ item, index }) => {
    if (item.type === 'add') {
      return (
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={pickImage}
          disabled={images.length >= 10}
        >
          <Feather name="plus" size={24} color="#95ba72" />
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <Image source={{ uri: item }} style={styles.image} />
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeImage(item)}
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const data = images.length < 10 ? [{ id: 'add', type: 'add' }, ...images] : [...images];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajoutez des photos</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.content}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Étape 2 sur 3</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '66.6%' }]} />
          </View>
        </View>

        <Text style={styles.description}>
          Montrez votre accessoire sous tous les angles (max. 10 photos).
        </Text>

        <Text style={styles.photoCounter}>
          {images.length}/10 photos
        </Text>

        {/* Image Grid */}
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id || item}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="image" size={48} color="#E0E0E0" />
              <Text style={styles.emptyText}>Aucune photo ajoutée</Text>
            </View>
          }
        />
      </View>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, styles.cameraButton]}
          onPress={takePhoto}
          disabled={!hasCameraPermission}
        >
          <Feather name="camera" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Prendre une photo</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.galleryButton]}
          onPress={pickImage}
          disabled={!hasGalleryPermission || images.length >= 10}
        >
          <Feather name="image" size={20} color="black" style={styles.buttonIcon} />
          <Text style={[styles.buttonText, { color: 'black' }]}>Choisir depuis la galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.nextButton, images.length === 0 && styles.disabledButton]}
          onPress={handleNext}
          disabled={images.length === 0}
        >
          <Text style={styles.buttonText}>Suivant</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  headerPlaceholder: {
    width: 28,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  progressText: {
    color: 'grey',
    marginBottom: 4,
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#95ba72',
    borderRadius: 4,
  },
  description: {
    fontSize: 16,
    color: 'grey',
    marginTop: 16,
    marginBottom: 8,
  },
  photoCounter: {
    fontSize: 14,
    color: '#95ba72',
    fontWeight: '600',
    marginVertical: 12,
  },
  gridContainer: {
    paddingBottom: 24,
  },
  addButton: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1%',
    borderWidth: 1.5,
    borderColor: '#D1FAE5',
  },
  imageContainer: {
    width: '31%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    color: '#9CA3AF',
    fontSize: 16,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    backgroundColor: 'white',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cameraButton: {
    backgroundColor: '#374151',
  },
  galleryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  nextButton: {
    backgroundColor: '#95ba72',
    marginTop: 12,
  },
  disabledButton: {
    backgroundColor: '#A7F3D0',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
});
