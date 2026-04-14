import { useState, useCallback } from 'react';
import { Platform, ActionSheetIOS, Alert, AccessibilityInfo } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSubmitCourtDamage } from '../../hooks/useForms';
import { appendFileToFormData } from '../../utils/createFileFormData';
import { Urgency } from '@tennis-club/shared';

export function useCourtDamageForm() {
  const mutation = useSubmitCourtDamage();

  const [courtNumber, setCourtNumber] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<Urgency>(Urgency.LOW);
  const [submitted, setSubmitted] = useState(false);

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const pickImage = useCallback(() => {
    const options = ['Kamera', 'Galerie', 'Abbrechen'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex }, (buttonIndex) => {
        if (buttonIndex === 0) pickFromCamera();
        if (buttonIndex === 1) pickFromGallery();
      });
    } else {
      Alert.alert('Foto hinzufuegen', '', [
        { text: 'Kamera', onPress: pickFromCamera },
        { text: 'Galerie', onPress: pickFromGallery },
        { text: 'Abbrechen', style: 'cancel' },
      ]);
    }
  }, []);

  const handleSubmit = () => {
    if (!courtNumber || !description || !photoUri) return;

    const formData = new FormData();
    formData.append('courtNumber', courtNumber);
    formData.append('description', description);
    formData.append('urgency', urgency);
    appendFileToFormData(formData, 'photo', photoUri, 'court-damage.jpg', 'image/jpeg');

    mutation.mutate(formData, {
      onSuccess: () => {
        setSubmitted(true);
        AccessibilityInfo.announceForAccessibility('Schadensmeldung erfolgreich eingereicht');
      },
    });
  };

  const isValid = courtNumber !== '' && description.trim().length > 0 && photoUri !== null;

  return {
    courtNumber,
    setCourtNumber,
    description,
    setDescription,
    photoUri,
    setPhotoUri,
    urgency,
    setUrgency,
    submitted,
    isValid,
    isPending: mutation.isPending,
    pickImage,
    handleSubmit,
  };
}
