import { Routes } from '@angular/router';
import { DashboardHome } from './dashboard/dashboard-home/dashboard-home';
import { History } from './dashboard/history/history';
import { Login } from './auth/login/login';
import { ControlPanel } from './dashboard/control-panel/control-panel';
import { SplashScreen } from './splash-screen/splash-screen';
import { Register } from './auth/register/register';
import { SelectPanel } from './dashboard/select-panel/select-panel';
import { AuthGuard } from './auth/guards/auth-guard';

export const routes: Routes = [
    { path: '', component: SplashScreen },
    { path: 'dashboard', component: DashboardHome, canActivate: [AuthGuard]},
    { path: 'dashboard/control-panel', component: ControlPanel, canActivate: [AuthGuard] },
    { path: 'dashboard/history', component: History, canActivate: [AuthGuard] },
    { path: 'dashboard/select-panel', component: SelectPanel, canActivate: [AuthGuard] },
    { path: 'auth/login', component: Login },
    { path: 'auth/register', component: Register },
];

