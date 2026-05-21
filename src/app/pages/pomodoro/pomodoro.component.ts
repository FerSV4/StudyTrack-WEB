import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { StudySessionService } from '../../core/services/study-session.service';
import { AuthService } from '../../core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-pomodoro',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './pomodoro.component.html',
  styleUrls: ['./pomodoro.component.css']
})

export class PomodoroComponent implements OnInit, OnDestroy {
  public taskService = inject(TaskService);
  private sessionService = inject(StudySessionService);
  private authService = inject(AuthService);

  public timeLeft: number = 25 * 60;
  public timer: any = null;
  public isRunning: boolean = false;
  public currentMode: 'work' | 'break' = 'work';
  public tasks$: Observable<any[]> = this.taskService.tasks$;
  public selectedTaskId: string = '';
  public currentSessionId: string | null = null;

  ngOnInit(): void {
    this.taskService.loadUserTasks();
  }

  ngOnDestroy(): void {
    this.stopTimerInterval();
  }

  public toggleTimer(): void {
    if (this.isRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  private startTimer(): void {
    if (!this.selectedTaskId && this.currentMode === 'work') {
      alert('Por favor, selecciona una tarea pendiente antes de empezar a estudiar.');
      return;
    }

    this.isRunning = true;

    if (this.currentMode === 'work' && !this.currentSessionId) {
      this.sessionService.startSession(this.selectedTaskId).subscribe({
        next: (session) => this.currentSessionId = session.id,
        error: (err) => {
          console.error('Error al iniciar sesión:', err);
          alert('Hubo un error al registrar el inicio de la sesión.');
          this.pauseTimer();
        }
      });
    }

    this.timer = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.handleTimeOut();
      }
    }, 1000);
  }

  private pauseTimer(): void {
    this.isRunning = false;
    this.stopTimerInterval();
  }

  public resetTimer(): void {
    this.pauseTimer();
    this.timeLeft = this.currentMode === 'work' ? 25 * 60 : 5 * 60;
  }

  private handleTimeOut(): void {
    this.stopTimerInterval();
    this.isRunning = false;

    if (this.currentMode === 'work') {
      this.completeWorkSession();
    } else {
      this.currentMode = 'work';
      this.timeLeft = 25 * 60;
    }
  }

  public completeWorkSession(): void {
    this.pauseTimer();
    if (this.currentSessionId) {
      this.sessionService.finishSession(this.currentSessionId).subscribe({
        next: () => {
          this.currentSessionId = null;
          this.currentMode = 'break';
          this.timeLeft = 5 * 60;
          alert('¡Buen trabajo! Es momento de un descanso.');
        },
        error: (err) => {
          console.error('Error al finalizar sesión:', err);
          alert('Hubo un error al registrar el fin de la sesión.');
        }
      });
    } else {
      this.currentMode = 'break';
      this.timeLeft = 5 * 60;
    }
  }

  private stopTimerInterval(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public formatTime(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  public onLogout(): void {
    this.authService.logout();
  }
}