import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarService } from '../services/calendarService';
import type { CreateEventInput } from '@tennis-club/shared';

export function useEvents(type?: string, from?: string, to?: string, teamId?: string) {
  return useQuery({
    queryKey: ['events', type, from, to, teamId],
    queryFn: () => calendarService.getEvents(type, from, to, teamId),
  });
}

export function useWeekEvents() {
  return useQuery({
    queryKey: ['events', 'week'],
    queryFn: calendarService.getWeekEvents,
  });
}

export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId],
    queryFn: () => calendarService.getEvent(eventId),
    enabled: !!eventId,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) => calendarService.createEvent(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
}
