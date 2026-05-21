import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TermService } from '../../core/services/term.service';
import { SubjectService } from '../../core/services/subject.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css']
})
export class ConfiguracionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private termService = inject(TermService);
  private router = inject(Router);

  public configForm!: FormGroup;
  public isSubmitting = false;

  ngOnInit(): void {
    const today = new Date();
    const endSemester = new Date();
    endSemester.setMonth(today.getMonth() + 5);

    this.configForm = this.fb.group({
      termName: ['', Validators.required],
      startDate: [today.toISOString().split('T')[0], Validators.required],
      endDate: [endSemester.toISOString().split('T')[0], Validators.required],
      subjects: this.fb.array([], Validators.minLength(1))
    });

    this.addSubject();
  }

  get subjects(): FormArray {
    return this.configForm.get('subjects') as FormArray;
  }

  public addSubject(): void {
    const subjectForm = this.fb.group({
      name: ['', Validators.required],
      colorCode: ['#2563eb', Validators.required]
    });
    this.subjects.push(subjectForm);
  }

  public removeSubject(index: number): void {
    if (this.subjects.length > 1) {
      this.subjects.removeAt(index);
    }
  }

  public async onSubmit(): Promise<void> {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValues = this.configForm.value;

    try {
      const termResponse: any = await firstValueFrom(
        this.termService.createTerm({
          name: formValues.termName,
          startDate: formValues.startDate,
          endDate: formValues.endDate
        })
      );

      const newTermId = termResponse.id;
      console.log('Semestre creado, ID extraído:', newTermId);

      if (!newTermId) {
        throw new Error('El backend no devolvió el ID del semestre.');
      }

      const subjectPromises = formValues.subjects.map((sub: any) => 
        firstValueFrom(this.termService.addSubject(newTermId, {
          name: sub.name,
          colorCode: sub.colorCode
        }))
      );

      await Promise.all(subjectPromises);

      await this.termService.loadActiveTree();
      this.router.navigate(['/dashboard']);

    } catch (error) {
      console.error('Error al configurar el semestre', error);
      alert('Hubo un error al guardar la configuración. Verifica tu conexión.');
    } finally {
      this.isSubmitting = false;
    }
  }
}