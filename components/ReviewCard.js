import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReviewCard = ({ review }) => {
  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= rating ? 'star' : 'star-outline'}
        size={16}
        color={star <= rating ? '#FFD700' : '#CCCCCC'}
        style={styles.starIcon}
      />
    ));
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '';
    return new Date(timestamp.toDate()).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.userName}>
            {review.sourceName || 'Utilisateur anonyme'}
          </Text>
          <View style={styles.ratingContainer}>
            {renderStars(review.rating)}
            <Text style={styles.dateText}>{formatDate(review.createdAt)}</Text>
          </View>
        </View>
        {review.itemTitle && (
          <Text style={styles.itemText} numberOfLines={1}>
            {review.itemTitle}
          </Text>
        )}
      </View>
      
      {review.comment && (
        <Text style={styles.commentText}>
          {review.comment}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  itemText: {
    fontSize: 12,
    color: '#4B5563',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 150,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginTop: 8,
  },
});

export default ReviewCard;
