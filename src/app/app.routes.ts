import {Routes} from '@angular/router';
import {DashboardHome} from './dashboard/dashboard-home/dashboard-home';
import {History} from './dashboard/history/history';
import {Login} from './auth/login/login';
import {ControlPanel} from './dashboard/control-panel/control-panel';
import {SplashScreen} from './splash-screen/splash-screen';
import {Register} from './auth/register/register';
import {SelectPanel} from './dashboard/select-panel/select-panel';
import {AuthGuard} from './auth/guards/auth-guard';

export const routes: Routes = [
  // Rutas públicas (no requieren autenticación)
  {path: '', component: SplashScreen},
  {path: 'auth/login', component: Login},

  // Rutas protegidas (requieren autenticación)
  {path: 'auth/register', component: Register, canActivate: [AuthGuard]},
  {path: 'home', component: DashboardHome, canActivate: [AuthGuard]},
  {path: 'dashboard/control-panel/:id', component: ControlPanel, canActivate: [AuthGuard]},
  {path: 'dashboard/history', component: History, canActivate: [AuthGuard]},
  {path: 'dashboard/select-panel', component: SelectPanel, canActivate: [AuthGuard]},

  // Redirección para compatibilidad
  {path: 'dashboard/control-panel', redirectTo: '/dashboard/select-panel', pathMatch: 'full'},



  // Ruta wildcard - debe ir al final
  {path: '**', redirectTo: '/'}
];
