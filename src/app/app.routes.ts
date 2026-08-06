import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: 'verify-email', loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent) },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'admin/events', loadComponent: () => import('./features/admin/manage-events/manage-events.component').then(m => m.ManageEventsComponent) },
      { path: 'admin/events/:id/registrations', loadComponent: () => import('./features/admin/event-registrants/event-registrants.component').then(m => m.EventRegistrantsComponent) },
      { path: 'admin/users', loadComponent: () => import('./features/admin/users/users-list/users-list.component').then(m => m.UsersListComponent) },
      { path: 'admin/administrators', loadComponent: () => import('./features/admin/administrators/admin-list/admin-list.component').then(m => m.AdminListComponent) },
      { path: 'admin/enroll-users', loadComponent: () => import('./features/admin/registrations/registration-wizard/registration-wizard.component').then(m => m.RegistrationWizardComponent) },
      { path: 'admin/check-in', loadComponent: () => import('./features/admin/attendance-scanner/attendance-scanner.component').then(m => m.AttendanceScannerComponent) },
      { path: 'admin/banners', loadComponent: () => import('./features/admin/banners/banner-list/banner-list.component').then(m => m.BannerListComponent) },
      { path: 'admin/content', loadComponent: () => import('./features/admin/custom-content/content-list/content-list.component').then(m => m.ContentListComponent) },
      { path: 'admin/statistics', loadComponent: () => import('./features/admin/statistics/statistics.component').then(m => m.StatisticsComponent) },
      { path: 'admin/notifications', loadComponent: () => import('./features/admin/push-notifications/push-notifications.component').then(m => m.PushNotificationsComponent) },
      { path: 'admin/groups', loadComponent: () => import('./features/admin/groups/groups.component').then(m => m.GroupsComponent) },
      { path: 'admin/forums', loadComponent: () => import('./features/admin/forums/forums.component').then(m => m.ForumsComponent) },
      { path: 'admin/forums/flagged', loadComponent: () => import('./features/admin/forum-flagged-posts/forum-flagged-posts.component').then(m => m.ForumFlaggedPostsComponent) },
      { path: 'admin/forums/:id/posts', loadComponent: () => import('./features/admin/forums/forum-tree/forum-tree.component').then(m => m.ForumTreeComponent) },
      { path: 'admin/payment-callback', loadComponent: () => import('./features/payment-callback/payment-callback.component').then(m => m.PaymentCallbackComponent) }
    ]
  }
];
