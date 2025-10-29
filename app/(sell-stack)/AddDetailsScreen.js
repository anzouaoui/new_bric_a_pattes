import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const CONDITIONS = ['Neuf', 'Comme neuf', 'Bon état', 'Usé'];

export default function AddDetailsScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('Neuf');
  const [price, setPrice] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const isFormValid = title && description && condition && price && postalCode;

  const handleContinue = () => {
    router.push({
      pathname: 'AddPhotosScreen',
      params: { 
        category,
        title,
        description,
        condition,
        price,
        postalCode 
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Décrivez votre article</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Étape 1 sur 3</Text>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>

        {/* Title Input */}
        <Text style={styles.label}>Titre</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Collier en cuir pour grand chien"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description Input */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Décrivez votre article en détail"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          textAlignVertical="top"
        />

        {/* Condition Selection */}
        <Text style={styles.label}>État</Text>
        <View style={styles.conditionContainer}>
          {CONDITIONS.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.conditionChip,
                {
                  borderColor: condition === item ? '#34D399' : '#E0E0E0',
                  backgroundColor: condition === item ? '#E0F2F1' : 'white',
                },
              ]}
              onPress={() => setCondition(item)}
            >
              <Text style={styles.conditionText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price & Postal Code */}
        <View style={styles.row}>
          {/* Price */}
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Prix</Text>
            <View style={[styles.input, styles.priceContainer]}>
              <TextInput
                style={styles.priceInput}
                placeholder="25"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
              <Text style={styles.euroSymbol}>€</Text>
            </View>
          </View>

          {/* Postal Code */}
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Code postal</Text>
            <TextInput
              style={styles.input}
              placeholder="75001"
              keyboardType="numeric"
              maxLength={5}
              value={postalCode}
              onChangeText={setPostalCode}
            />
          </View>
        </View>

        {/* Spacer for bottom button */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !isFormValid && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!isFormValid}
        >
          <Text style={styles.continueButtonText}>Ajouter les photos</Text>
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
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    color: 'grey',
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '33.3%',
    backgroundColor: '#34D399',
    borderRadius: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    height: 50,
    fontSize: 16,
  },
  descriptionInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  conditionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  conditionChip: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 12,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  halfWidth: {
    width: '48%',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  euroSymbol: {
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  spacer: {
    height: 100,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: 'white',
  },
  continueButton: {
    backgroundColor: '#34D399',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#A7F3D0',
  },
});
