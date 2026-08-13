import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { Banner } from '../../../../core/models/banner.model';
import { BannerAdminService } from '../../../../core/services/banner_admin.service';
import { ImageUploadComponent } from '../../../../core/components/image-upload/image-upload.component';

@Component({
    selector: 'app-banner-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatSlideToggleModule,
        MatIconModule,
        ImageUploadComponent
    ],
    templateUrl: './banner-form-dialog.component.html',
    styleUrls: ['./banner-form-dialog.component.scss']
})
export class BannerFormDialogComponent implements OnInit {
    bannerForm: FormGroup;
    isEditMode: boolean;

    constructor(
        private fb: FormBuilder,
        private bannerService: BannerAdminService,
        private dialogRef: MatDialogRef<BannerFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Banner | null
    ) {
        this.isEditMode = !!data;
        this.bannerForm = this.fb.group({
            title: [data?.title || '', [Validators.required]],
            subtitle: [data?.subtitle || ''],
            category: [data?.category || 'home', [Validators.required]],
            image_url: [data?.image_url || '', [Validators.required]],
            action_type: [data?.action_type || 'none', [Validators.required]],
            action_target: [data?.action_target || ''],
            is_active: [data?.is_active ?? true],
            sort_order: [data?.sort_order || 0]
        });
    }

    ngOnInit(): void { }

    onSubmit(): void {
        if (this.bannerForm.valid) {
            const bannerData = this.bannerForm.value;

            if (this.isEditMode) {
                this.bannerService.update(this.data!.id!, bannerData).subscribe({
                    next: () => this.dialogRef.close(true),
                    error: (err) => console.error('Error updating banner', err)
                });
            } else {
                this.bannerService.create(bannerData).subscribe({
                    next: () => this.dialogRef.close(true),
                    error: (err) => console.error('Error creating banner', err)
                });
            }
        }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
