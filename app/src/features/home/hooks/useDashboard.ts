import { useQuery } from '@tanstack/react-query';
import { calendarService } from '../../calendar/services/calendarService';
import { todoService } from '../../todo/services/todoService';

export function useDashboard() {
  const weekEvents = useQuery({
    queryKey: ['events', 'week'],
    queryFn: calendarService.getWeekEvents,
  });

  const todos = useQuery({
    queryKey: ['todos', 'personal'],
    queryFn: () => todoService.getTodos(),
  });

  return {
    weekEvents,
    todos,
    isLoading: weekEvents.isLoading || todos.isLoading,
  };
}
