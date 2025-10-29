import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const ListingCard = ({ item, onPress }) => {
  if (!item) return null;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/listing/${item.id}`);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image 
            source={{ uri: item.images[0] }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image" size={32} color="#9CA3AF" />
          </View>
        )}
        
        {item.isFavorite && (
          <View style={styles.favoriteBadge}>
            <Ionicons name="heart" size={16} color="#FFFFFF" />
          </View>
        )}
      </View>
      
      <View style={styles.details}>
        <Text style={styles.price} numberOfLines={1}>
          {item.price ? `${item.price} €` : 'Prix sur demande'}
        </Text>
        
        <Text style={styles.title} numberOfLines={1}>
          {item.title || 'Sans titre'}
        </Text>
        
        <View style={styles.footer}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.location} numberOfLines={1}>
              {item.location || 'Localisation non précisée'}
            </Text>
          </View>
          
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.rating}>
              {item.rating || 'N/A'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    padding: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 2,
    fontWeight: '600',
  },
});

export default ListingCard;
