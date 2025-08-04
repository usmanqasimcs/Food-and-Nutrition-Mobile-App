import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button, Card, Chip, Surface } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FoodAnalysisResult, nutritionService } from '../../services/NutritionService';

const { width: screenWidth } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const requestPermissions = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access to analyze food images.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };
  const takePicture = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setShowCamera(true);
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        if (photo) {
          setSelectedImage(photo.uri);
          setShowCamera(false);
          setAnalysisResult(null);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const closeCameraView = () => {
    setShowCamera(false);
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable photo library access to select images.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setAnalysisResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      const result = await nutritionService.analyzeImage(selectedImage);
      if (result) {
        setAnalysisResult(result);
        Toast.show({
          type: 'success',
          text1: 'Analysis Complete!',
          text2: `Detected: ${result.predicted_class}`,
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Toast.show({
        type: 'error',
        text1: 'Analysis Failed',
        text2: 'Please try again with a clearer image',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveAnalysis = async () => {
    if (!analysisResult) return;

    try {
      await nutritionService.saveAnalysis(analysisResult);
      Toast.show({
        type: 'success',
        text1: 'Saved!',
        text2: 'Analysis saved to your history',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Unable to save analysis',
      });
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
  };

  const NutritionCard = ({ nutrition }: { nutrition: any }) => (
    <Card style={[styles.nutritionCard, { backgroundColor: colors.surface }]}>
      <Card.Content>
        <Text style={[styles.nutritionTitle, { color: colors.onSurface }]}>
          Nutrition Facts
        </Text>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.primary }]}>
              {nutrition.calories}
            </Text>
            <Text style={[styles.nutritionLabel, { color: colors.onSurfaceVariant }]}>
              Calories
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.primary }]}>
              {nutrition.protein_g}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: colors.onSurfaceVariant }]}>
              Protein
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.primary }]}>
              {nutrition.carbohydrates_total_g}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: colors.onSurfaceVariant }]}>
              Carbs
            </Text>
          </View>
          <View style={styles.nutritionItem}>
            <Text style={[styles.nutritionValue, { color: colors.primary }]}>
              {nutrition.fat_total_g}g
            </Text>
            <Text style={[styles.nutritionLabel, { color: colors.onSurfaceVariant }]}>
              Fat
            </Text>
          </View>
        </View>
        
        <View style={styles.nutritionDetails}>
          <View style={styles.nutritionRow}>
            <Text style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
              Fiber
            </Text>
            <Text style={[styles.detailValue, { color: colors.onSurface }]}>
              {nutrition.fiber_g}g
            </Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
              Sugar
            </Text>
            <Text style={[styles.detailValue, { color: colors.onSurface }]}>
              {nutrition.sugar_g}g
            </Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>
              Sodium
            </Text>
            <Text style={[styles.detailValue, { color: colors.onSurface }]}>
              {nutrition.sodium_mg}mg
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {showCamera ? (
        <View style={styles.cameraContainer}>
          <CameraView 
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          >
            <View style={styles.cameraControls}>
              <TouchableOpacity 
                style={[styles.cameraButton, styles.closeButton, { backgroundColor: colors.surface }]}
                onPress={closeCameraView}
              >
                <Ionicons name="close" size={24} color={colors.onSurface} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.captureButton, { backgroundColor: colors.primary }]}
                onPress={capturePhoto}
              >
                <Ionicons name="camera" size={32} color={colors.onPrimary} />
              </TouchableOpacity>
              
              <View style={styles.spacer} />
            </View>
          </CameraView>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.onBackground }]}>
            Food Analyzer
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Take a photo or select from gallery to analyze
          </Text>
        </View>

        {!selectedImage ? (
          <Surface style={[styles.cameraPlaceholder, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons 
              name="camera" 
              size={64} 
              color={colors.onSurfaceVariant} 
            />
            <Text style={[styles.placeholderText, { color: colors.onSurfaceVariant }]}>
              No image selected
            </Text>
          </Surface>
        ) : (
          <Surface style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            {analysisResult && (
              <View style={styles.resultOverlay}>
                <Chip 
                  mode="flat" 
                  style={[styles.confidenceChip, { backgroundColor: colors.primaryContainer }]}
                  textStyle={{ color: colors.onPrimaryContainer }}
                >
                  {Math.round(analysisResult.confidence * 100)}% confidence
                </Chip>
              </View>
            )}
          </Surface>
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={takePicture}
            icon="camera"
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            textColor={colors.onPrimary}
          >
            Take Photo
          </Button>
          
          <Button
            mode="outlined"
            onPress={pickImageFromGallery}
            icon="image"
            style={[styles.actionButton, { borderColor: colors.outline }]}
            textColor={colors.primary}
          >
            Gallery
          </Button>
        </View>

        {selectedImage && (
          <View style={styles.analyzeContainer}>
            <Button
              mode="contained"
              onPress={analyzeImage}
              loading={isAnalyzing}
              disabled={isAnalyzing}
              style={[styles.analyzeButton, { backgroundColor: colors.secondary }]}
              textColor={colors.onSecondary}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Food'}
            </Button>
          </View>
        )}

        {analysisResult && (
          <>
            <Card style={[styles.resultCard, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <Text style={[styles.foodName, { color: colors.onSurface }]}>
                  {analysisResult.predicted_class.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={[styles.processingTime, { color: colors.onSurfaceVariant }]}>
                  Analysis completed in {analysisResult.processing_time.toFixed(2)}s
                </Text>
              </Card.Content>
            </Card>

            <NutritionCard nutrition={analysisResult.nutrition} />

            <View style={styles.actionContainer}>
              <Button
                mode="contained"
                onPress={saveAnalysis}
                icon="content-save"
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                textColor={colors.onPrimary}
              >
                Save Analysis
              </Button>
              
              <Button
                mode="outlined"
                onPress={resetAnalysis}
                icon="refresh"
                style={[styles.resetButton, { borderColor: colors.outline }]}
                textColor={colors.onSurface}
              >
                New Analysis
              </Button>
            </View>
          </>
        )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  cameraPlaceholder: {
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  resultOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  confidenceChip: {
    opacity: 0.9,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  analyzeContainer: {
    marginBottom: 20,
  },
  analyzeButton: {
    borderRadius: 12,
    paddingVertical: 4,
  },
  resultCard: {
    marginBottom: 16,
    borderRadius: 16,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  processingTime: {
    fontSize: 14,
    textAlign: 'center',
  },
  nutritionCard: {
    marginBottom: 20,
    borderRadius: 16,
  },
  nutritionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  nutritionLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  nutritionDetails: {
    gap: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
  },
  resetButton: {
    flex: 1,
    borderRadius: 12,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 30,
    paddingBottom: 50,
  },
  cameraButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -350,
    left: 0,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    width: 50,
  },
});
