import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  public taskService = inject(TaskService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.taskService.loadUserTasks();
  }

  public async onLogout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}