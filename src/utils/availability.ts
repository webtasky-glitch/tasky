import { Task } from '../types';
import { isTaskAssignedToUser } from './taskFilter';

export interface AvailabilityResult {
  isBusy: boolean;
}

/**
 * Checks a person's availability for a given date and time.
 * Strictly privacy-preserving: returns only whether the person is busy,
 * never disclosing task titles, descriptions, plans, or other private details.
 */
export function checkPersonAvailability(
  personId: string,
  date: string,
  startTime?: string,
  endTime?: string,
  allTasks: Task[] = [],
  excludeTaskId?: string
): AvailabilityResult {
  if (!personId || !date) {
    return { isBusy: false };
  }

  // Filter non-completed tasks for this person on the given date
  const personTasksOnDate = allTasks.filter((t) => {
    if (t.id === excludeTaskId) return false;
    if (t.dueDate !== date) return false;
    if (t.status === 'Completed') return false;
    
    // Check if task is assigned to this person
    const isAssigned = 
      t.assignedTo === personId ||
      (Array.isArray(t.assignedToIds) && t.assignedToIds.includes(personId));
      
    return isAssigned;
  });

  if (personTasksOnDate.length === 0) {
    return { isBusy: false };
  }

  // If no time is specified (All-Day task assignment)
  if (!startTime) {
    // If the person already has 3 or more tasks or an all-day commitment on that day, flag as busy
    const hasAllDay = personTasksOnDate.some(t => !t.startTime || t.isAllDay);
    if (hasAllDay || personTasksOnDate.length >= 3) {
      return { isBusy: true };
    }
    return { isBusy: false };
  }

  // Convert time "HH:MM" to minutes from midnight
  const parseTimeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  };

  const newStartMin = parseTimeToMinutes(startTime);
  const newEndMin = endTime ? parseTimeToMinutes(endTime) : newStartMin + 60; // default 1 hour slot

  // Check overlap with each of the person's tasks on this day
  for (const existingTask of personTasksOnDate) {
    if (existingTask.startTime) {
      const existStartMin = parseTimeToMinutes(existingTask.startTime);
      const existEndMin = existingTask.endTime 
        ? parseTimeToMinutes(existingTask.endTime) 
        : existStartMin + 60;

      // Overlap condition: (StartA < EndB) && (EndA > StartB)
      if (newStartMin < existEndMin && newEndMin > existStartMin) {
        return { isBusy: true };
      }
    } else if (existingTask.isAllDay) {
      // An all-day task blocks the user
      return { isBusy: true };
    }
  }

  return { isBusy: false };
}
