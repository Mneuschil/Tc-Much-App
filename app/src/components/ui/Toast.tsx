import React, { createContext, useCallback, useContext, useState } from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

type ToastVariant = 'success' | 'error';

interface ToastMessage {
  id: number;
  text: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (text: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const showToast = useCallback((text: string, variant: ToastVariant = 'success') => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, text, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => {
        const isError = toast.variant === 'error';
        return (
          <Animated.View
            key={toast.id}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            accessibilityRole="alert"
            accessibilityLiveRegion={isError ? 'assertive' : 'polite'}
            accessibilityLabel={toast.text}
            style={[
              styles.toast,
              {
                top: insets.top + (Platform.OS === 'ios' ? 8 : 16),
                backgroundColor: isError ? colors.danger : colors.success,
              },
            ]}
          >
            <Text style={styles.text}>{toast.text}</Text>
          </Animated.View>
        );
      })}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
