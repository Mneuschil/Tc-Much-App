import React from 'react';
import { Redirect } from 'expo-router';
import { FEATURES, type FeatureKey } from '../config/features';

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: string;
}

export function FeatureGate({ feature, children, fallback = '/(tabs)/home' }: FeatureGateProps) {
  if (!FEATURES[feature]) {
    return <Redirect href={fallback as never} />;
  }
  return <>{children}</>;
}
