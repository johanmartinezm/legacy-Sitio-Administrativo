import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { ContentAdminService, ContentCategory, CustomContent } from '../../../../core/services/content_admin.service';

@Component({
    selector: 'app-content-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatCheckboxModule,
        MatIconModule
    ],
    templateUrl: './content-form-dialog.component.html',
    styleUrls: ['./content-form-dialog.component.scss']
})
export class ContentFormDialogComponent implements OnInit {
    contentForm: FormGroup;
    categories: ContentCategory[] = [];
    isEdit = false;

    constructor(
        private fb: FormBuilder,
        private contentService: ContentAdminService,
        private dialogRef: MatDialogRef<ContentFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: CustomContent | null
    ) {
        this.isEdit = !!data;
        this.contentForm = this.fb.group({
            type: ['text', Validators.required],
            category_id: [null, Validators.required],
            title: ['', Validators.required],
            excerpt: ['', Validators.required],
            body_text: [''],
            video_url: [''],
            thumbnail_url: [''],
            is_published: [false]
        });
    }

    ngOnInit(): void {
        this.loadCategories();
        if (this.data) {
            this.contentForm.patchValue(this.data);
        }

        // Toggle fields based on type
        this.contentForm.get('type')?.valueChanges.subscribe(type => {
            this.updateValidators(type);
        });
        this.updateValidators(this.contentForm.get('type')?.value);
    }

    updateValidators(type: 'text' | 'video'): void {
        const bodyCtrl = this.contentForm.get('body_text');
        const videoCtrl = this.contentForm.get('video_url');

        if (type === 'text') {
            bodyCtrl?.setValidators([Validators.required]);
            videoCtrl?.clearValidators();
        } else {
            videoCtrl?.setValidators([Validators.required]);
            bodyCtrl?.clearValidators();
        }
        bodyCtrl?.updateValueAndValidity();
        videoCtrl?.updateValueAndValidity();
    }

    loadCategories(): void {
        this.contentService.getCategories().subscribe(cats => this.categories = cats);
    }

    onSave(): void {
        if (this.contentForm.valid) {
            const result = this.contentForm.value;
            const action = this.isEdit
                ? this.contentService.updateContentItem(this.data!.id!, result)
                : this.contentService.createContentItem(result);

            action.subscribe({
                next: () => this.dialogRef.close(true),
                error: (err) => console.error('Error saving content', err)
            });
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
