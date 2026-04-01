import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../lib/socket';
import { useAuthStore } from '../stores/authStore';

interface ChannelPayload {
  channelId: string;
}

interface EventPayload {
  eventId: string;
}

export function useSocketEvents(): void {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    const onMessageCreated = (data: ChannelPayload) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.channelId] });
    };

    const onMessageDeleted = (data: ChannelPayload) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.channelId] });
    };

    const onMessageReaction = () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    };

    const onEventCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    };

    const onEventUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    };

    const onAvailabilityUpdated = (data: EventPayload) => {
      queryClient.invalidateQueries({ queryKey: ['availability', data.eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    };

    const onResultSubmitted = () => {
      queryClient.invalidateQueries({ queryKey: ['matchResults'] });
    };

    const onResultConfirmed = () => {
      queryClient.invalidateQueries({ queryKey: ['matchResults'] });
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
    };

    const onResultDisputed = () => {
      queryClient.invalidateQueries({ queryKey: ['matchResults'] });
    };

    const onMatchLineup = (data: EventPayload) => {
      queryClient.invalidateQueries({ queryKey: ['lineup', data.eventId] });
    };

    socket.on('message:created', onMessageCreated);
    socket.on('message:deleted', onMessageDeleted);
    socket.on('message:reaction', onMessageReaction);
    socket.on('event:created', onEventCreated);
    socket.on('event:updated', onEventUpdated);
    socket.on('availability:updated', onAvailabilityUpdated);
    socket.on('result:submitted', onResultSubmitted);
    socket.on('result:confirmed', onResultConfirmed);
    socket.on('result:disputed', onResultDisputed);
    socket.on('match:lineup', onMatchLineup);

    return () => {
      socket.off('message:created', onMessageCreated);
      socket.off('message:deleted', onMessageDeleted);
      socket.off('message:reaction', onMessageReaction);
      socket.off('event:created', onEventCreated);
      socket.off('event:updated', onEventUpdated);
      socket.off('availability:updated', onAvailabilityUpdated);
      socket.off('result:submitted', onResultSubmitted);
      socket.off('result:confirmed', onResultConfirmed);
      socket.off('result:disputed', onResultDisputed);
      socket.off('match:lineup', onMatchLineup);
    };
  }, [queryClient, isAuthenticated]);
}
