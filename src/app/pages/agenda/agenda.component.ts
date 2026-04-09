import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { isBefore, isToday, parseISO, startOfDay } from 'date-fns';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.css'],
})
export class AgendaComponent implements OnInit {
  public taskService = inject(TaskService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  public taskForm: FormGroup;
  public isCreating = false;
  public editingTaskId: number | null = null;
  public isModalOpen = false;

  public statusFilter = new BehaviorSubject<string>('Todas');
  public timeFilter = new BehaviorSubject<string>('Proximas');

  public filteredTasks$: Observable<any[]>;

  constructor() {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      subject: ['', Validators.required],
      description: [''],
      due_date: [''],
      priority: ['Media', Validators.required],
    });

    this.filteredTasks$ = combineLatest([
      this.taskService.tasks$,
      this.statusFilter,
      this.timeFilter,
    ]).pipe(
      map(([tasks, status, time]) => {
        const today = startOfDay(new Date());

        return tasks
          .filter((task) => {
            const matchStatus = status === 'Todas' || task.status === status;

            let matchTime = true;
            if (time !== 'Todas' && task.due_date) {
              const taskDate = startOfDay(parseISO(task.due_date));
              if (time === 'Hoy') matchTime = isToday(taskDate);
              if (time === 'Proximas') matchTime = !isBefore(taskDate, today) || isToday(taskDate);
              if (time === 'Vencidas') matchTime = isBefore(taskDate, today) && !isToday(taskDate);
            } else if (time !== 'Todas' && !task.due_date) {
              matchTime = time === 'Proximas';
            }

            return matchStatus && matchTime;
          })
          .sort((a, b) => {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;

            return parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime();
          });
      }),
    );
  }

  ngOnInit(): void {
    this.taskService.loadUserTasks();
  }

  public changeStatusFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.statusFilter.next(value);
  }

  public changeTimeFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.timeFilter.next(value);
  }

  public openModalForCreate(): void {
    this.editingTaskId = null;
    this.taskForm.reset({ priority: 'Media' });
    this.isModalOpen = true;
  }

  public onEditTask(task: any): void {
    this.editingTaskId = task.id;
    this.taskForm.patchValue({
      title: task.title,
      subject: task.subject,
      description: task.description || '',
      due_date: task.due_date || '',
      priority: task.priority,
    });
    this.isModalOpen = true;
  }

  public closeModal(): void {
    this.isModalOpen = false;
    this.editingTaskId = null;
    this.taskForm.reset({ priority: 'Media' });
  }

  public async onSaveTask(): Promise<void> {
    if (this.taskForm.invalid) return;

    this.isCreating = true;
    try {
      if (this.editingTaskId) {
        await this.taskService.updateTaskDetails(this.editingTaskId, this.taskForm.value);
      } else {
        await this.taskService.createTask(this.taskForm.value);
      }
      this.closeModal();
    } catch (e) {
      console.warn('Errores de conexion');
    } finally {
      this.isCreating = false;
    }
  }

  public async onToggleStatus(id: number, status: string): Promise<void> {
    await this.taskService.toggleTaskStatus(id, status);
  }

  public async onDeleteTask(id: number): Promise<void> {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      await this.taskService.deleteTask(id);
    }
  }

  public async onLogout(): Promise<void> {
    this.taskService.clearCache();
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}
