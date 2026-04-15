import { Stack, Redirect } from 'expo-router';
import { FEATURES } from '../../src/config/features';

export default function RankingLayout() {
  if (!FEATURES.ranking) {
    return <Redirect href="/(tabs)/home" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
