import React, { Component, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Appearance } from 'react-native';
import { lightColors, darkColors } from '../theme/colors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const isDark = Appearance.getColorScheme() === 'dark';
      const colors = isDark ? darkColors : lightColors;

      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Etwas ist schiefgelaufen
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            Die App ist auf einen unerwarteten Fehler gestossen.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.buttonPrimary }]}
            onPress={this.handleRetry}
            accessibilityLabel="Erneut versuchen"
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, { color: colors.buttonPrimaryText }]}>
              Erneut versuchen
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
