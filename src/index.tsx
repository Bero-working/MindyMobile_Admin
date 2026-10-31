import './global.css';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/config/queryClient';
import { MindyThemeProvider } from '@/components/ui/theme';
import { AuthApp } from '@/modules/auth';
import { createAuthService } from '@/modules/auth/services/authService';
import '@/config/i18n.config';

const authService = createAuthService();
export default function MainIndex() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView className="flex-1">
        <KeyboardProvider
          preload={false}
          statusBarTranslucent
          navigationBarTranslucent
        >
          <QueryClientProvider client={queryClient}>
            <MindyThemeProvider>
              <View className="flex-1">
                <AuthApp
                  service={authService}
                  cache={queryClient}
                />
              </View>
            </MindyThemeProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
