import React from 'react';
import { useQuery } from '@tanstack/react-query';
import GoalTodoSection from './GoalTodoSection';
import AISalesCoachChat from './AISalesCoachChat';
import { campaignGoalsAPI } from '../lib/api';

interface AISalesCoachWithTodoProps {
  goalId: string;
  goalName: string;
  goalDescription?: string;
}

const AISalesCoachWithTodo: React.FC<AISalesCoachWithTodoProps> = ({
  goalId,
  goalName,
  goalDescription
}) => {
  // Fetch todo items to pass as context to chat
  const { data: todoData } = useQuery({
    queryKey: ['goal-todo-items', goalId],
    queryFn: async () => {
      const response = await campaignGoalsAPI.getGoalTodoItems(goalId);
      return response.data; // Extract data from axios response
    },
    enabled: !!goalId,
    retry: 1,
    staleTime: 5 * 60 * 1000 // Consider data fresh for 5 minutes
  });

  return (
    <div className="space-y-6">
      {/* To-Do Section */}
      <GoalTodoSection
        goalId={goalId}
        goalName={goalName}
        goalDescription={goalDescription}
      />

      {/* Atlas Chat with context from todo items */}
      <AISalesCoachChat
        goalId={goalId}
        goalName={goalName}
        goalDescription={goalDescription}
        context={{
          todo_items: todoData?.todo_items || [],
          summary: todoData?.summary
        }}
      />
    </div>
  );
};

export default AISalesCoachWithTodo;
