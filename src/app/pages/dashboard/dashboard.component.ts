import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TermService } from '../../core/services/term.service';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductivityUtils } from '../../core/utils/productivity.utils';
import { map } from 'rxjs/operators';
import { addDays, format, isToday, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private termService = inject(TermService);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private router = inject(Router);

  public activeTerm$ = this.termService.activeTerm$;
  public tasks$ = this.taskService.tasks$;

  public progress$ = this.activeTerm$.pipe(
    map(term => term ? ProductivityUtils.getTermProgress(term.subjects) : 0)
  );

  public pendingCount$ = this.tasks$.pipe(map(tasks => tasks.filter(t => t.status === 'pending').length));
  public highPriorityCount$ = this.tasks$.pipe(map(tasks => tasks.filter(t => t.priority === 'high' && t.status === 'pending').length));
  public completedCount$ = this.tasks$.pipe(map(tasks => tasks.filter(t => t.status === 'completed').length));
  
  public dailyLoad$ = this.tasks$.pipe(map(tasks => ProductivityUtils.calculateDailyLoad(tasks)));

  public weeklyCalendar: any[] = [];
  public selectedDate: string = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.termService.loadActiveTree();
    this.taskService.loadUserTasks();
    this.generateWeeklyCalendar();
  }

  private generateWeeklyCalendar() {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    
    this.tasks$.subscribe(tasks => {
      this.weeklyCalendar = Array.from({ length: 7 }).map((_, i) => {
        const date = addDays(start, i);
        const dateString = date.toISOString().split('T')[0];
        const hasTasks = tasks.some(t => t.due_date && t.due_date.startsWith(dateString) && t.status === 'pending');
        
        return {
          date: dateString,
          dayName: format(date, 'EEE', { locale: es }),
          dayNumber: format(date, 'd'),
          isToday: isToday(date),
          hasTasks
        };
      });
    });
  }

  public selectDay(date: string) {
    this.selectedDate = date;
  }

  public getTextColor(hex: string): string {
    if (!hex) return '#ffffff';
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? '#0f172a' : '#ffffff';
  }

  public onLogout(): void {
    this.authService.logout();
    this.taskService.clearCache();
    this.router.navigate(['/login']);
  }
  public isSettingsModalOpen = false;
  public newSubjectName = '';
  public newSubjectColor = '#2563eb';
  public currentTermId = '';

  public openSettingsModal(termId: any) {
  this.currentTermId = String(termId); 
  console.log("Semestre ID capturado:", this.currentTermId);
  
  if (!this.currentTermId || this.currentTermId === 'undefined') {
    alert("Error: No se pudo identificar el semestre. Recarga la página.");
    return;
  }
  
  this.isSettingsModalOpen = true;
}

  public closeSettingsModal() {
    this.isSettingsModalOpen = false;
    this.newSubjectName = '';
    this.newSubjectColor = '#2563eb';
  }

  public onAddSubject() {
  console.log("Debug: currentTermId vale:", this.currentTermId); // <- Esto debe imprimir un número/string
  
  if (!this.newSubjectName.trim()) return;
  
  // Si currentTermId es falsy, no permitas que salga la petición
  if (!this.currentTermId) {
    alert("Error: No se pudo identificar el semestre. Cierra y vuelve a abrir el modal.");
    return;
  }

  this.termService.addSubject(this.currentTermId, { 
    name: this.newSubjectName, 
    colorCode: this.newSubjectColor 
  }).subscribe({
    next: () => {
      this.newSubjectName = '';
      this.newSubjectColor = '#2563eb';
    },
    error: (err) => console.error("Error al guardar:", err)
  });
}

  public onDeleteSubject(subjectId: string) {
    if (confirm('¿Estás seguro de eliminar esta materia? Esto podría fallar si tiene tareas pendientes.')) {
      this.termService.deleteSubject(subjectId).subscribe({
        error: (err) => alert(err.error?.message || 'Error al eliminar materia')
      });
    }
  }

  public onDeleteTerm(termId: string) {
    if (confirm('¿ATENCIÓN: Estás a punto de eliminar todo el semestre. ¿Continuar?')) {
      this.termService.deleteTerm(termId).subscribe({
        next: () => this.closeSettingsModal(),
        error: (err) => alert(err.error?.message || 'Error al eliminar semestre')
      });
    }
  }
}