import { Routes } from '@angular/router';
import { DashboardHome } from './dashboard/dashboard-home/dashboard-home';
import { History } from './dashboard/history/history';
import { Login } from './auth/login/login';
import { ControlPanel} from './dashboard/control-panel/control-panel';

export const routes: Routes = [
  { path: '', component: DashboardHome },
  { path: 'dashboard', component: DashboardHome },
  { path: 'dashboard/control-panel', component: ControlPanel },
  { path: 'dashboard/history', component: History },
  { path: 'auth/login', component: Login },
  { path: '**', redirectTo: '' }
];
