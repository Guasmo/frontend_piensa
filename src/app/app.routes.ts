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
    { path: 'auth/register', component: Register },
    { path: 'auth/login', component: Login },
    { path: 'home', component: DashboardHome, canActivate: [AuthGuard] },
    
    // ✅ CORRECCIÓN: Ruta con parámetro para el control panel
    { path: 'dashboard/control-panel/:id', component: ControlPanel, canActivate: [AuthGuard] },
    
    // Mantener la ruta sin parámetro para compatibilidad (redirige al select-panel)
    { path: 'dashboard/control-panel', redirectTo: '/dashboard/select-panel', pathMatch: 'full'},
    
    { path: 'dashboard/history', component: History, canActivate: [AuthGuard] },
    { path: 'dashboard/select-panel', component: SelectPanel, canActivate: [AuthGuard] },
    
    // Ruta wildcard - debe ir al final
    { path: '**', redirectTo: '/' }
];