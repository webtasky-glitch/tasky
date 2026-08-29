import { Task, RecurringType } from '../types';

export const getNextSequentialDate = (currentDueDate: string, recurring: RecurringType, stepIndex: number = 1): string => {
  if (!recurring || recurring === 'None') return currentDueDate;

  let baseDate: Date;
  if (currentDueDate && !isNaN(Date.parse(currentDueDate))) {
    const parts = currentDueDate.split('-');
    if (parts.length === 3) {
      baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      baseDate = new Date(currentDueDate);
    }
  } else {
    baseDate = new Date();
  }

  const nextDate = new Date(baseDate);

  if (recurring === 'Daily') {
    nextDate.setDate(nextDate.getDate() + stepIndex);
  } else if (recurring === 'Weekly') {
    nextDate.setDate(nextDate.getDate() + (7 * stepIndex));
  } else if (recurring === 'Monthly') {
    nextDate.setMonth(nextDate.getMonth() + stepIndex);
  }

  const yyyy = nextDate.getFullYear();
  const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
  const dd = String(nextDate.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

export const getNextDueDate = (currentDueDate: string, recurring: RecurringType): string => {
  if (!recurring || recurring === 'None') return currentDueDate;

  let baseDate: Date;
  if (currentDueDate && !isNaN(Date.parse(currentDueDate))) {
    const parts = currentDueDate.split('-');
    if (parts.length === 3) {
      baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      baseDate = new Date(currentDueDate);
    }
  } else {
    baseDate = new Date();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextDate = new Date(baseDate);

  if (recurring === 'Daily') {
    do {
      nextDate.setDate(nextDate.getDate() + 1);
    } while (nextDate <= today);
  } else if (recurring === 'Weekly') {
    do {
      nextDate.setDate(nextDate.getDate() + 7);
    } while (nextDate <= today);
  } else if (recurring === 'Monthly') {
    do {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } while (nextDate <= today);
  }

  const yyyy = nextDate.getFullYear();
  const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
  const dd = String(nextDate.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

export const generateFutureRecurringTasks = (baseTask: Task, count: number = 8): Task[] => {
  if (!baseTask.recurring || baseTask.recurring === 'None') return [];
  const groupId = baseTask.recurringGroupId || baseTask.id;

  const futureTasks: Task[] = [];
  for (let i = 1; i <= count; i++) {
    const futureDueDate = getNextSequentialDate(baseTask.dueDate, baseTask.recurring, i);
    futureTasks.push({
      ...baseTask,
      id: `${groupId}-seq-${i}`,
      recurringGroupId: groupId,
      status: 'Todo',
      completedAt: undefined,
      dueDate: futureDueDate,
      checklist: baseTask.checklist ? baseTask.checklist.map(item => ({ ...item, completed: false })) : [],
      attachments: [],
      comments: [],
    });
  }
  return futureTasks;
};
