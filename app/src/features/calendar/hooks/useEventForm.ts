import { useState } from 'react';
import { Platform } from 'react-native';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { CreateEventInput } from '@tennis-club/shared';
import { useCreateEvent } from './useEvents';

export const EVENT_TYPES: { value: CreateEventInput['type']; label: string }[] = [
  { value: 'TRAINING', label: 'Training' },
  { value: 'LEAGUE_MATCH', label: 'Ligaspiel' },
  { value: 'CUP_MATCH', label: 'Pokalspiel' },
  { value: 'CLUB_EVENT', label: 'Vereinsevent' },
  { value: 'CLUB_CHAMPIONSHIP', label: 'Clubmeisterschaft' },
  { value: 'RANKING_MATCH', label: 'Ranglistenspiel' },
  { value: 'TOURNAMENT', label: 'Turnier' },
];

export function formatDisplayDateTime(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

interface UseEventFormOptions {
  preselectedDate?: string | null;
  onSuccess: () => void;
}

export function useEventForm({ preselectedDate, onSuccess }: UseEventFormOptions) {
  const createEvent = useCreateEvent();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CreateEventInput['type']>('CLUB_EVENT');
  const [location, setLocation] = useState('');
  const [court, setCourt] = useState('');
  const [startDate, setStartDate] = useState<Date>(() => {
    if (preselectedDate) {
      const d = new Date(preselectedDate);
      d.setHours(10, 0, 0, 0);
      return d;
    }
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startPickerMode, setStartPickerMode] = useState<'date' | 'time'>('date');

  const handleStartDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
      if (selected && startPickerMode === 'date') {
        setStartDate(selected);
        setStartPickerMode('time');
        setShowStartPicker(true);
        return;
      }
    }
    if (selected) setStartDate(selected);
  };

  const handleEndDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowEndPicker(false);
    if (selected) setEndDate(selected);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('CLUB_EVENT');
    setLocation('');
    setCourt('');
    setEndDate(null);
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    const input: CreateEventInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      location: location.trim() || undefined,
      court: court.trim() || undefined,
      startDate: startDate.toISOString(),
      endDate: endDate ? endDate.toISOString() : undefined,
    };
    createEvent.mutate(input, {
      onSuccess: () => {
        resetForm();
        onSuccess();
      },
    });
  };

  const openStartPicker = () => {
    setStartPickerMode('date');
    setShowStartPicker(true);
  };

  const openEndPicker = () => {
    if (!endDate) setEndDate(new Date(startDate.getTime() + 90 * 60000));
    setShowEndPicker(true);
  };

  const clearEndDate = () => {
    setEndDate(null);
    setShowEndPicker(false);
  };

  const canSubmit = title.trim().length > 0 && !createEvent.isPending;

  return {
    title,
    setTitle,
    description,
    setDescription,
    type,
    setType,
    location,
    setLocation,
    court,
    setCourt,
    startDate,
    endDate,
    showStartPicker,
    setShowStartPicker,
    showEndPicker,
    setShowEndPicker,
    startPickerMode,
    handleStartDateChange,
    handleEndDateChange,
    openStartPicker,
    openEndPicker,
    clearEndDate,
    handleCreate,
    canSubmit,
    isPending: createEvent.isPending,
  };
}
