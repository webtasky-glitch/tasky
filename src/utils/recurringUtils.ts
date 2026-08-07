import { RecurringType } from '../types';

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
