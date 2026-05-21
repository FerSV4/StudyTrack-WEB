import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { TermService } from '../../core/services/term.service';
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
  public termService = inject(TermService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  public taskForm: FormGroup;
  public isCreating = false;
  public editingTaskId: string | null = null;
  public isModalOpen = false;
  private initialFormState: string | null = null;

  public statusFilter = new BehaviorSubject<string>('Todas');
  public timeFilter = new BehaviorSubject<string>('Proximas');

  public filteredTasks$: Observable<any[]>;

  constructor() {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      subjectId: ['', Validators.required],
      description: [''],
      dueDate: [''],
      priority: ['medium', Validators.required],
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
      })
    );
  }

  ngOnInit(): void {
    this.taskService.loadUserTasks();
    this.termService.loadActiveTree();
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
    this.taskForm.reset({ priority: 'medium' });
    this.initialFormState = null;
    this.isModalOpen = true;
  }

  public onEditTask(task: any): void {
    this.editingTaskId = task.id;
    this.taskForm.patchValue({
      title: task.title,
      subjectId: task.subject_id,
      description: task.description || '',
      dueDate: task.due_date ? task.due_date.split('T')[0] : '',
      priority: task.priority,
    });
    
    this.initialFormState = JSON.stringify(this.taskForm.value);
    
    this.isModalOpen = true;
  }

  public closeModal(): void {
    this.isModalOpen = false;
    this.editingTaskId = null;
    this.taskForm.reset({ priority: 'medium' });
  }

  public async onSaveTask(): Promise<void> {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const formValues = this.taskForm.value;

    if (this.editingTaskId && this.initialFormState) {
      const currentState = JSON.stringify(formValues);
      if (this.initialFormState === currentState) {
        console.log('No se detectaron cambios. Cancelando petición HTTP.');
        this.closeModal();
        return;
      }
    }

    this.isCreating = true;

    try {
      if (this.editingTaskId) {
        const updatePayload = {
          ...formValues,
          subjectId: String(formValues.subjectId) 
        };
        await this.taskService.updateTaskDetails(this.editingTaskId, updatePayload);
        
      } else {
        const createPayload = {
          ...formValues,
          subjectId: Number(formValues.subjectId) 
        };
        await this.taskService.createTask(createPayload);
      }
      
      this.closeModal();
    } catch (e) {
      console.warn('Errores de conexión o guardado');
    } finally {
      this.isCreating = false;
    }
  }

  public async onToggleStatus(id: string, status: string): Promise<void> {
    await this.taskService.toggleTaskStatus(id, status);
  }

  public async onDeleteTask(id: string): Promise<void> {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      await this.taskService.deleteTask(id);
    }
  }

  public onLogout(): void {
    this.authService.logout();
    this.taskService.clearCache();
    this.router.navigate(['/login']);
  }
}