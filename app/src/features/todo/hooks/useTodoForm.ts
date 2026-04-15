import { useState } from 'react';
import { Platform, AccessibilityInfo } from 'react-native';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { CreateTodoInput } from '@tennis-club/shared';
import { useCreateTodo } from './useTodos';
import { useClubMembers } from '../../../hooks/useProfile';

export interface MemberItem {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export function formatDisplayDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

interface UseTodoFormOptions {
  teamId?: string;
  onSuccess: () => void;
}

export function useTodoForm({ teamId, onSuccess }: UseTodoFormOptions) {
  const createTodo = useCreateTodo();
  const { data: membersData } = useClubMembers();
  const members = (membersData ?? []) as MemberItem[];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scope, setScope] = useState<'BOARD' | 'TRAINERS' | 'TEAM'>('BOARD');
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  const selectedMember = members.find((m) => m.id === assigneeId);

  const handleDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) setDueDate(selected);
  };

  const handleCreate = () => {
    if (!title.trim() || !assigneeId) return;
    const input: CreateTodoInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      assigneeId,
      scope: teamId ? 'TEAM' : scope,
      teamId,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
    };
    createTodo.mutate(input, {
      onSuccess: () => {
        AccessibilityInfo.announceForAccessibility('Aufgabe erfolgreich erstellt');
        setTitle('');
        setDescription('');
        setAssigneeId('');
        setDueDate(null);
        onSuccess();
      },
    });
  };

  const canSubmit = title.trim().length > 0 && !!assigneeId && !createTodo.isPending;

  return {
    title,
    setTitle,
    description,
    setDescription,
    assigneeId,
    setAssigneeId,
    dueDate,
    setDueDate,
    showDatePicker,
    setShowDatePicker,
    scope,
    setScope,
    showMemberPicker,
    setShowMemberPicker,
    selectedMember,
    members,
    handleDateChange,
    handleCreate,
    canSubmit,
    isPending: createTodo.isPending,
  };
}
