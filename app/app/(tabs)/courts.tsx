import React from 'react';
import { ComingSoonScreen } from '../../src/components/ComingSoonScreen';

export default function CourtsScreen() {
  return (
    <ComingSoonScreen
      title="Platzbelegung"
      description="Hier seht ihr bald, welche Plätze durch Training, Mannschaftsspiele und Ranglistenpartien belegt sind. Die freie Buchung folgt mit einem späteren Update."
      icon="tennisball-outline"
    />
  );
}

export { ScreenErrorBoundary as ErrorBoundary } from '../../src/components/ScreenErrorBoundary';
