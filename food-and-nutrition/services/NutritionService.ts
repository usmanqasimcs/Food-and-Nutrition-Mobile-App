import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_CONFIG } from '../config/api';

export interface NutritionData {
  name: string;
  calories: number;
  serving_size_g: number;
  fat_total_g: number;
  fat_saturated_g: number;
  protein_g: number;
  sodium_mg: number;
  potassium_mg: number;
  cholesterol_mg: number;
  carbohydrates_total_g: number;
  fiber_g: number;
  sugar_g: number;
  confidence?: number;
}

export interface FoodAnalysisResult {
  predicted_class: string;
  confidence: number;
  nutrition: NutritionData;
  processing_time: number;
  timestamp: string;
}

export interface SavedAnalysis extends FoodAnalysisResult {
  id: string;
  savedAt: string;
  userNotes?: string;
}

class NutritionService {
  private baseUrl = API_CONFIG.BASE_URL;
  private cacheKey = 'nutrition_history';

  async analyzeImage(imageUri: string): Promise<FoodAnalysisResult | null> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'food_image.jpg',
      } as any);

      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

      const response = await fetch(`${this.baseUrl}/analyze-food/`, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData, let the browser set it
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error analyzing image:', error);
      
      // Show more specific error messages
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          Alert.alert(
            'Request Timeout',
            'The analysis is taking too long. Please try again with a smaller image or check your connection.'
          );
        } else if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
          Alert.alert(
            'Connection Error',
            'Cannot connect to the analysis server. Make sure your FastAPI server is running and accessible.',
            [
              { text: 'OK' },
              { 
                text: 'Check Server', 
                onPress: () => {
                  Alert.alert(
                    'Server Setup',
                    `Trying to connect to: ${this.baseUrl}\n\nFor Android:\n- Use 10.0.2.2:8000 for emulator\n- Use your computer's IP for device\n\nMake sure FastAPI server is running!`
                  );
                }
              }
            ]
          );
        } else if (error.message.includes('404')) {
          Alert.alert(
            'Endpoint Not Found',
            'The /analyze-food/ endpoint was not found. Please check your FastAPI server.'
          );
        } else {
          Alert.alert(
            'Analysis Error',
            `Failed to analyze the image: ${error.message}`
          );
        }
      }
      
      return null;
    }
  }

  async saveAnalysis(analysis: FoodAnalysisResult, userNotes?: string): Promise<string> {
    try {
      const savedAnalysis: SavedAnalysis = {
        ...analysis,
        id: Date.now().toString(),
        savedAt: new Date().toISOString(),
        userNotes,
      };

      const existingHistory = await this.getAnalysisHistory();
      const updatedHistory = [savedAnalysis, ...existingHistory];
      
      // Keep only last 100 analyses
      if (updatedHistory.length > 100) {
        updatedHistory.splice(100);
      }

      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(updatedHistory));
      return savedAnalysis.id;
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw new Error('Failed to save analysis');
    }
  }

  async getAnalysisHistory(): Promise<SavedAnalysis[]> {
    try {
      const historyJson = await AsyncStorage.getItem(this.cacheKey);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Error loading analysis history:', error);
      return [];
    }
  }

  async deleteAnalysis(id: string): Promise<void> {
    try {
      const history = await this.getAnalysisHistory();
      const updatedHistory = history.filter(item => item.id !== id);
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error deleting analysis:', error);
      throw new Error('Failed to delete analysis');
    }
  }

  async updateAnalysisNotes(id: string, notes: string): Promise<void> {
    try {
      const history = await this.getAnalysisHistory();
      const updatedHistory = history.map(item => 
        item.id === id ? { ...item, userNotes: notes } : item
      );
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error updating analysis notes:', error);
      throw new Error('Failed to update notes');
    }
  }

  async exportHistory(): Promise<string> {
    try {
      const history = await this.getAnalysisHistory();
      return JSON.stringify(history, null, 2);
    } catch (error) {
      console.error('Error exporting history:', error);
      throw new Error('Failed to export history');
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.error('Error clearing history:', error);
      throw new Error('Failed to clear history');
    }
  }

  async getHealthStats(): Promise<{
    totalAnalyses: number;
    averageCalories: number;
    totalCalories: number;
    averageConfidence: number;
    mostAnalyzedFood: string;
    healthScore: number;
  }> {
    try {
      const history = await this.getAnalysisHistory();
      
      if (history.length === 0) {
        return {
          totalAnalyses: 0,
          averageCalories: 0,
          totalCalories: 0,
          averageConfidence: 0,
          mostAnalyzedFood: 'N/A',
          healthScore: 0,
        };
      }

      const totalCalories = history.reduce((sum, analysis) => sum + analysis.nutrition.calories, 0);
      const averageCalories = totalCalories / history.length;
      const averageConfidence = history.reduce((sum, analysis) => sum + analysis.confidence, 0) / history.length;
      
      // Find most analyzed food
      const foodCounts: { [key: string]: number } = {};
      history.forEach(analysis => {
        foodCounts[analysis.predicted_class] = (foodCounts[analysis.predicted_class] || 0) + 1;
      });
      
      const mostAnalyzedFood = Object.entries(foodCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

      // Calculate simple health score based on nutrition balance
      const avgProtein = history.reduce((sum, analysis) => sum + analysis.nutrition.protein_g, 0) / history.length;
      const avgFiber = history.reduce((sum, analysis) => sum + analysis.nutrition.fiber_g, 0) / history.length;
      const avgSugar = history.reduce((sum, analysis) => sum + analysis.nutrition.sugar_g, 0) / history.length;
      const avgSodium = history.reduce((sum, analysis) => sum + analysis.nutrition.sodium_mg, 0) / history.length;
      
      // Simple health score calculation (0-100)
      let healthScore = 50; // Base score
      healthScore += Math.min(avgProtein * 2, 20); // Protein bonus
      healthScore += Math.min(avgFiber * 5, 15); // Fiber bonus
      healthScore -= Math.min(avgSugar * 0.5, 15); // Sugar penalty
      healthScore -= Math.min(avgSodium * 0.01, 10); // Sodium penalty
      healthScore = Math.max(0, Math.min(100, healthScore));

      return {
        totalAnalyses: history.length,
        averageCalories: Math.round(averageCalories),
        totalCalories: Math.round(totalCalories),
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        mostAnalyzedFood,
        healthScore: Math.round(healthScore),
      };
    } catch (error) {
      console.error('Error calculating health stats:', error);
      throw new Error('Failed to calculate health statistics');
    }
  }

  formatNutritionValue(value: number, unit: string): string {
    if (value < 1 && value > 0) {
      return `${(value * 1000).toFixed(0)}m${unit}`;
    }
    return `${value.toFixed(1)}${unit}`;
  }

  getNutritionGrade(nutrition: NutritionData): 'A' | 'B' | 'C' | 'D' | 'F' {
    let score = 0;
    
    // Positive factors
    if (nutrition.protein_g > 10) score += 2;
    if (nutrition.fiber_g > 3) score += 2;
    if (nutrition.calories < 200) score += 1;
    
    // Negative factors
    if (nutrition.sugar_g > 10) score -= 2;
    if (nutrition.sodium_mg > 400) score -= 2;
    if (nutrition.fat_saturated_g > 5) score -= 1;
    
    if (score >= 4) return 'A';
    if (score >= 2) return 'B';
    if (score >= 0) return 'C';
    if (score >= -2) return 'D';
    return 'F';
  }
}

export const nutritionService = new NutritionService();
