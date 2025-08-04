import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Button, Card, Surface } from 'react-native-paper';
import { ALTERNATIVE_URLS, API_CONFIG } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';

export default function ServerStatusScreen() {
  const { colors, isDark } = useTheme();
  const [statusResults, setStatusResults] = useState<{ [key: string]: string }>({});
  const [isChecking, setIsChecking] = useState(false);

  const checkServerStatus = async (url: string, name: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return `✅ ${name}: Connected (${data.status || 'OK'})`;
      } else {
        return `❌ ${name}: Server error (${response.status})`;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return `❌ ${name}: Timeout (5s)`;
      }
      return `❌ ${name}: Connection failed`;
    }
  };

  const checkAllServers = async () => {
    setIsChecking(true);
    setStatusResults({});
    
    const checks = [
      { url: ALTERNATIVE_URLS.LOCALHOST, name: 'Localhost' },
      { url: ALTERNATIVE_URLS.ANDROID_EMULATOR, name: 'Android Emulator' },
      { url: ALTERNATIVE_URLS.LOCAL_NETWORK, name: 'Local Network IP' },
    ];

    for (const check of checks) {
      const result = await checkServerStatus(check.url, check.name);
      setStatusResults(prev => ({
        ...prev,
        [check.name]: result,
      }));
    }
    
    setIsChecking(false);
  };

  const testFastAPIHealth = async () => {
    Alert.alert(
      'FastAPI Health Check',
      `Testing connection to: ${API_CONFIG.BASE_URL}/health\n\nMake sure your FastAPI server is running with the /health endpoint.`,
      [
        { text: 'Cancel' },
        { 
          text: 'Test', 
          onPress: async () => {
            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/health`);
              const data = await response.json();
              Alert.alert('Success!', `Server responded: ${JSON.stringify(data, null, 2)}`);
            } catch (error) {
              Alert.alert('Failed', `Error: ${error}`);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.onBackground }]}>
            Server Connection
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Debug network connectivity issues
          </Text>
        </View>

        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              Current Configuration
            </Text>
            <View style={styles.configItem}>
              <Text style={[styles.configLabel, { color: colors.onSurfaceVariant }]}>
                API Base URL:
              </Text>
              <Text style={[styles.configValue, { color: colors.primary }]}>
                {API_CONFIG.BASE_URL}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
              Alternative URLs
            </Text>
            {Object.entries(ALTERNATIVE_URLS).map(([key, url]) => (
              <View key={key} style={styles.urlItem}>
                <Text style={[styles.urlLabel, { color: colors.onSurfaceVariant }]}>
                  {key.replace('_', ' ')}:
                </Text>
                <Text style={[styles.urlValue, { color: colors.onSurface }]}>
                  {url}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={checkAllServers}
          loading={isChecking}
          disabled={isChecking}
          style={[styles.button, { backgroundColor: colors.primary }]}
          textColor={colors.onPrimary}
          icon="wifi"
        >
          {isChecking ? 'Checking...' : 'Check Server Status'}
        </Button>

        {Object.keys(statusResults).length > 0 && (
          <Surface style={[styles.resultsCard, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.resultsTitle, { color: colors.onSurfaceVariant }]}>
              Connection Results
            </Text>
            {Object.entries(statusResults).map(([name, result]) => (
              <Text key={name} style={[styles.resultItem, { color: colors.onSurface }]}>
                {result}
              </Text>
            ))}
          </Surface>
        )}

        <Button
          mode="outlined"
          onPress={testFastAPIHealth}
          style={[styles.button, { borderColor: colors.outline }]}
          textColor={colors.primary}
          icon="heart-pulse"
        >
          Test FastAPI Health Endpoint
        </Button>

        <Surface style={[styles.helpCard, { backgroundColor: colors.errorContainer }]}>
          <Text style={[styles.helpTitle, { color: colors.onErrorContainer }]}>
            Troubleshooting Tips
          </Text>
          <Text style={[styles.helpText, { color: colors.onErrorContainer }]}>
            1. Make sure FastAPI server is running on port 8000
          </Text>
          <Text style={[styles.helpText, { color: colors.onErrorContainer }]}>
            2. For Android emulator, use 10.0.2.2:8000
          </Text>
          <Text style={[styles.helpText, { color: colors.onErrorContainer }]}>
            3. For Android device, use your computer's IP address
          </Text>
          <Text style={[styles.helpText, { color: colors.onErrorContainer }]}>
            4. Check firewall and network settings
          </Text>
          <Text style={[styles.helpText, { color: colors.onErrorContainer }]}>
            5. Try demo login: demo@foodnutrition.app / demo123
          </Text>
        </Surface>
      </ScrollView>
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
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  configItem: {
    marginBottom: 8,
  },
  configLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  configValue: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  urlItem: {
    marginBottom: 8,
  },
  urlLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  urlValue: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  button: {
    marginVertical: 8,
    borderRadius: 8,
  },
  resultsCard: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  resultItem: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  helpCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
});
