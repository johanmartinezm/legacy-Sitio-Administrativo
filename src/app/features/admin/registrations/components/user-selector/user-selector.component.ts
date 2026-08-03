import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { User } from '../../../../../core/models/user.model';
import { UserService } from '../../../../../core/services/user.service';
import { Observable, startWith, map } from 'rxjs';

@Component({
    selector: 'app-user-selector',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatInputModule,
        MatFormFieldModule
    ],
    template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Buscar Usuario</mat-label>
      <input type="text"
             matInput
             [formControl]="myControl"
             [matAutocomplete]="auto">
      <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayFn" (optionSelected)="onSelectionChange($event)">
        <mat-option *ngFor="let user of filteredUsers | async" [value]="user">
          {{user.firstName}} {{user.lastName}} ({{user.email}})
        </mat-option>
      </mat-autocomplete>
    </mat-form-field>
  `,
    styles: ['.full-width { width: 100%; }']
})
export class UserSelectorComponent implements OnInit {
    myControl = new FormControl<string | User>('');
    users: User[] = [];
    filteredUsers: Observable<User[]> | undefined;

    @Output() userSelected = new EventEmitter<User>();

    constructor(private userService: UserService) { }

    ngOnInit() {
        this.userService.getUsers().subscribe(users => {
            this.users = users;
            this.filteredUsers = this.myControl.valueChanges.pipe(
                startWith(''),
                map(value => {
                    const name = typeof value === 'string' ? value : value?.firstName;
                    return name ? this._filter(name as string) : this.users.slice();
                }),
            );
        });
    }

    displayFn(user: User): string {
        return user && user.firstName ? `${user.firstName} ${user.lastName}` : '';
    }

    private _filter(name: string): User[] {
        const filterValue = name.toLowerCase();
        return this.users.filter(user =>
            user.firstName.toLowerCase().includes(filterValue) ||
            user.lastName.toLowerCase().includes(filterValue) ||
            user.email.toLowerCase().includes(filterValue)
        );
    }

    onSelectionChange(event: any) {
        this.userSelected.emit(event.option.value);
    }
}
