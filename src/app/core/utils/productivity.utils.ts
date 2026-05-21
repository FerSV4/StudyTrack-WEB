import { Task } from '../services/task.service';

export class ProductivityUtils {
  static calculateDailyLoad(tasks: Task[]): { hours: number, status: 'normal' | 'warning' | 'critical' } {
    const today = new Date().toISOString().split('T')[0];
    
    const totalHours = tasks
      .filter(t => t.due_date.startsWith(today) && t.status === 'pending')
      .reduce((acc, t) => acc + (Number(t.estimated_hours) || 0), 0);

    let status: 'normal' | 'warning' | 'critical' = 'normal';
    if (totalHours > 8) status = 'critical';
    else if (totalHours > 5) status = 'warning';

    return { hours: totalHours, status };
  }

  static getTermProgress(subjects: any[]): number {
    let totalTasks = 0;
    let completedTasks = 0;

    subjects.forEach(s => {
      s.tasks?.forEach((t: any) => {
        totalTasks++;
        if (t.status === 'completed') completedTasks++;
      });
    });

    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  }
}