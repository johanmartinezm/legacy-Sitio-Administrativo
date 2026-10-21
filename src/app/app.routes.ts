import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: 'verify-email', loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent) },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
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
      { path: 'admin/paginas', loadComponent: () => import('./features/admin/paginas/pagina-list/pagina-list.component').then(m => m.PaginaListComponent) },
      { path: 'admin/inicio', data: { pantalla: 'inicio' }, loadComponent: () => import('./features/admin/inicio/seccion-inicio-list/seccion-inicio-list.component').then(m => m.SeccionInicioListComponent) },
      { path: 'admin/asesoria/unidades', loadComponent: () => import('./features/admin/asesoria/unidad-list/unidad-list.component').then(m => m.UnidadListComponent) },
      // Sección Beneficios de la app: beneficios y alianzas, en páginas separadas
      // sobre el mismo componente (data.tipo).
      { path: 'admin/beneficios', data: { tipo: 'beneficio' }, loadComponent: () => import('./features/admin/beneficios/beneficio-list/beneficio-list.component').then(m => m.BeneficioListComponent) },
      { path: 'admin/alianzas', data: { tipo: 'alianza' }, loadComponent: () => import('./features/admin/beneficios/beneficio-list/beneficio-list.component').then(m => m.BeneficioListComponent) },
      // Legacy+: textos fijos (mismo componente que admin/inicio) y puntos con check.
      { path: 'admin/legacy-plus/textos', data: { pantalla: 'legacy-plus' }, loadComponent: () => import('./features/admin/inicio/seccion-inicio-list/seccion-inicio-list.component').then(m => m.SeccionInicioListComponent) },
      { path: 'admin/legacy-plus/puntos', loadComponent: () => import('./features/admin/legacy-plus/item-list/item-list.component').then(m => m.ItemListComponent) },
      // Mismo componente que admin/inicio, filtrado a las filas de LSO · Escuela.
      { path: 'admin/lso', data: { pantalla: 'lso' }, loadComponent: () => import('./features/admin/inicio/seccion-inicio-list/seccion-inicio-list.component').then(m => m.SeccionInicioListComponent) },
      { path: 'admin/statistics', loadComponent: () => import('./features/admin/statistics/statistics.component').then(m => m.StatisticsComponent) },
      { path: 'admin/notifications', loadComponent: () => import('./features/admin/push-notifications/push-notifications.component').then(m => m.PushNotificationsComponent) },
      { path: 'admin/groups', loadComponent: () => import('./features/admin/groups/groups.component').then(m => m.GroupsComponent) },
      { path: 'admin/forums', loadComponent: () => import('./features/admin/forums/forums.component').then(m => m.ForumsComponent) },
      { path: 'admin/forums/flagged', loadComponent: () => import('./features/admin/forum-flagged-posts/forum-flagged-posts.component').then(m => m.ForumFlaggedPostsComponent) },
      { path: 'admin/forums/:id/posts', loadComponent: () => import('./features/admin/forums/forum-tree/forum-tree.component').then(m => m.ForumTreeComponent) },
      // Reportes de personas, distintos de los de publicaciones de foro
      // (admin/forums/flagged): éstos denuncian a alguien, normalmente por un
      // chat privado.
      { path: 'admin/user-reports', loadComponent: () => import('./features/admin/user-reports/user-reports.component').then(m => m.UserReportsComponent) },
      { path: 'admin/contacto', loadComponent: () => import('./features/admin/contacto/contacto.component').then(m => m.ContactoComponent) },
      { path: 'admin/payment-callback', loadComponent: () => import('./features/payment-callback/payment-callback.component').then(m => m.PaymentCallbackComponent) }
    ]
  }
];
