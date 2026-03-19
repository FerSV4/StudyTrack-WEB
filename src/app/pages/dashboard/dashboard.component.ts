import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  public taskService = inject(TaskService);
  private authService = inject(AuthService);
  private router = inject(Router);

  public newTaskTitle = '';
  public newTaskSubject = '';
  public isCreating = false;

  ngOnInit(): void {
    this.taskService.loadUserTasks();
  }

  public async onLogout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }

  public async onAddTask(): Promise<void> {
    if (!this.newTaskTitle.trim() || !this.newTaskSubject.trim()) return;

    this.isCreating = true;
    try {
      await this.taskService.createTask(this.newTaskTitle, this.newTaskSubject);
      this.newTaskTitle = '';
      this.newTaskSubject = '';
    } catch {
      alert('Error');
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
}
