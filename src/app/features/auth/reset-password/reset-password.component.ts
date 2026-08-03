import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSnackBarModule,
        RouterModule
    ],
    templateUrl: './reset-password.component.html',
    styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
    resetForm: FormGroup;
    email: string | null = null;
    token: string | null = null;
    isLoading = false;

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private snackBar: MatSnackBar
    ) {
        this.resetForm = this.fb.group({
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });
    }

    ngOnInit(): void {
        this.email = this.route.snapshot.queryParamMap.get('email');
        this.token = this.route.snapshot.queryParamMap.get('token');

        if (!this.email || !this.token) {
            this.snackBar.open('Enlace inválido o incompleto.', 'Cerrar', { duration: 5000 });
        }
    }

    passwordMatchValidator(g: FormGroup) {
        return g.get('newPassword')?.value === g.get('confirmPassword')?.value
            ? null : { mismatch: true };
    }

    onSubmit(): void {
        if (this.resetForm.valid && this.email && this.token) {
            this.isLoading = true;
            const newPassword = this.resetForm.get('newPassword')?.value;

            this.authService.resetPassword(this.email, this.token, newPassword).subscribe({
                next: () => {
                    this.snackBar.open('Contraseña restablecida con éxito.', 'Cerrar', { duration: 3000 });
                    this.router.navigate(['/login']);
                },
                error: (err: any) => {
                    this.isLoading = false;
                    this.snackBar.open(err.error?.message || 'Error al restablecer contraseña.', 'Cerrar', { duration: 5000 });
                }
            });
        }
    }
}
