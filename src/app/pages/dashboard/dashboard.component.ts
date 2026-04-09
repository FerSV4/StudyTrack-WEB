import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { startOfWeek, addDays, format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface DayCard {
  date: Date;
  dayName: string;
  dayNumber: string;
  hasTasks: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  public taskService = inject(TaskService);
  private authService = inject(AuthService);
  private router = inject(Router);

  public weeklyCalendar: DayCard[] = [];
  public selectedDate: Date = new Date();

  public pendingCount = 0;
  public completedCount = 0;
  public highPriorityCount = 0;

  ngOnInit(): void {
    this.taskService.loadUserTasks();

    this.generateWeeklyCalendar();

    this.taskService.tasks$.subscribe((tasks) => {
      this.calculateMetrics(tasks);
      this.checkTasksInCalendar(tasks);
    });
  }

  //Semanario
  private generateWeeklyCalendar(): void {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });

    this.weeklyCalendar = Array.from({ length: 7 }).map((_, i) => {
      const currentDate = addDays(start, i);
      return {
        date: currentDate,
        dayName: format(currentDate, 'EEE', { locale: es }),
        dayNumber: format(currentDate, 'dd'),
        hasTasks: false,
        isToday: isSameDay(currentDate, today),
      };
    });
  }

  private checkTasksInCalendar(tasks: any[]): void {
    this.weeklyCalendar.forEach((day) => {
      day.hasTasks = tasks.some((task) => {
        if (!task.due_date || task.status === 'Completada') return false;
        const taskDate = parseISO(task.due_date);
        return isSameDay(taskDate, day.date);
      });
    });
  }

  public selectDay(date: Date): void {
    this.selectedDate = date;
    this.router.navigate(['/agenda']);
  }

  private calculateMetrics(tasks: any[]): void {
    this.pendingCount = tasks.filter((t) => t.status === 'Pendiente').length;
    this.completedCount = tasks.filter((t) => t.status === 'Completada').length;
    this.highPriorityCount = tasks.filter(
      (t) => t.status === 'Pendiente' && t.priority === 'Alta',
    ).length;
  }

  public async onLogout(): Promise<void> {
    this.taskService.clearCache();
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}
