import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Navbar } from '../../components/navbar/navbar';
import { Subscription, timer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth';

// Interfaces para tipar los datos
interface EnergyMetrics {
  voltage_V: number;
  current_mA: number;
  power_mW: number;
  battery_remaining_percent: number;
  timestamp: number;
  total_consumed_mAh: number;
  sample_index: number;
}

// ✅ NUEVA: Interface para estadísticas en tiempo real
interface RealtimeStats {
  avgCurrent: number;
  avgVoltage: number;
  avgPower: number;
  totalConsumed: number;
  measurementCount: number;
  durationSeconds: number;
}

// ✅ ACTUALIZADA: Interface para datos de sesión en tiempo real
interface SessionData {
  id: number;
  speakerId: number;
  userId: number;
  startTime: string;
  endTime?: string;
  initialBatteryPercentage: number;
  finalBatteryPercentage?: number;
  measurements: EnergyMetrics[]; // ✅ Cambiado de energyMeasurements a measurements
  currentStats: RealtimeStats;    // ✅ NUEVO: Estadísticas actuales
  measurementCount: number;       // ✅ NUEVO: Contador de mediciones
  speaker: {
    id: number;
    name: string;
    position: string;
  };
  user: {
    id: number;
    username: string;
    email: string;
  };
}

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, FormsModule, HttpClientModule],
  templateUrl: './control-panel.html',
  styleUrls: ['./control-panel.css'],
})
export class ControlPanel implements OnInit, OnDestroy {
  // Inyección de dependencias moderna
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  // Estado del componente
  showEnergy = false;
  isConnected = false;
  isLoading = true;
  errorMessage: string | null = null;
  
  // Datos del parlante y sesión
  private speakerId!: number;
  activeSessionId: number | null = null;
  private pollingSubscription?: Subscription;
  
  // Datos para mostrar en la UI
  speakerInfo = { name: 'Cargando...', position: 'Cargando...' };
  latestMetrics: EnergyMetrics | null = null;
  sessionStartTime: string | null = null;
  
  // ✅ NUEVO: Estadísticas en tiempo real
  currentStats: RealtimeStats | null = null;
  measurementCount = 0;
  
  // Estadísticas calculadas (mantenidas para compatibilidad)
  averagePower = 0;
  peakPower = 0;
  sessionDuration = '00:00:00';
  
  // Propiedades para el navbar
  username$ = this.authService.currentUser$;
  showLogoutButton: boolean = true;
  
  // URL de la API
  private readonly API_URL = 'http://192.168.18.142:3000/esp32-data';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('ID obtenido de la URL:', id);
    
    if (!id) {
      this.errorMessage = "No se encontró el ID del parlante en la URL.";
      this.isLoading = false;
      return;
    }
    
    const parsedId = parseInt(id, 10);
    console.log('ID parseado:', parsedId);
    
    // Validar que el ID sea un número válido y mayor que 0
    if (isNaN(parsedId) || parsedId < 1) {
      this.errorMessage = `ID de parlante inválido: ${id}. Debe ser un número entero mayor que 0.`;
      this.isLoading = false;
      return;
    }
    
    this.speakerId = parsedId;
    console.log('SpeakerId establecido:', this.speakerId);
    this.checkInitialStatus();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  checkInitialStatus(): void {
    this.isLoading = true;
    console.log('Verificando estado inicial para speakerId:', this.speakerId);
    
    // Validar que speakerId sea válido antes de hacer la petición
    if (!this.speakerId || this.speakerId < 1) {
      this.errorMessage = "ID de parlante inválido para verificar estado.";
      this.isLoading = false;
      return;
    }
    
    this.http.get<{ success: boolean; hasActiveSession: boolean; session: SessionData | null }>(`${this.API_URL}/active-session/speaker/${this.speakerId}`)
      .pipe(
        catchError(err => {
          console.error('Error checking status:', err);
          console.error('Error details:', err.error);
          return of({ success: false, hasActiveSession: false, session: null });
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          if (response.hasActiveSession && response.session) {
            this.isConnected = true;
            this.activeSessionId = response.session.id;
            this.speakerInfo.name = response.session.speaker.name;
            this.speakerInfo.position = response.session.speaker.position;
            this.sessionStartTime = response.session.startTime;
            
            // ✅ ACTUALIZADO: Procesar métricas y estadísticas nuevas
            if (response.session.measurements?.length > 0) {
              this.processMetrics(response.session.measurements);
            }
            
            // ✅ NUEVO: Procesar estadísticas en tiempo real
            if (response.session.currentStats) {
              this.currentStats = response.session.currentStats;
              this.measurementCount = response.session.measurementCount;
            }
            
            if (this.activeSessionId !== null) {
              this.startPolling(this.activeSessionId);
            }
          } else {
            this.isConnected = false;
            this.getSpeakerDetails();
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || "Error al verificar el estado del parlante.";
          console.error('Error en checkInitialStatus:', err);
          this.isLoading = false;
        }
      });
  }
  
  getSpeakerDetails(): void {
    console.log('Obteniendo detalles del parlante para speakerId:', this.speakerId);
    
    // Validar que speakerId sea válido antes de hacer la petición
    if (!this.speakerId || this.speakerId < 1) {
      this.speakerInfo = { name: 'ID Inválido', position: 'ID Inválido' };
      return;
    }
    
    // Usar endpoint de speakers en lugar de esp32-data
    this.http.get<{ success: boolean; data: { name: string; position: string } }>(`http://192.168.18.142:3000/speakers/${this.speakerId}`)
      .subscribe({
        next: (res) => {
          console.log('Detalles del parlante obtenidos:', res);
          if (res.success && res.data) {
            this.speakerInfo = {
              name: res.data.name,
              position: res.data.position
            };
          }
        },
        error: (err) => {
          console.error('Error obteniendo detalles del parlante:', err);
          this.speakerInfo = { name: 'Desconocido', position: 'Desconocida' };
        }
      });
  }

  toggleStatus(): void {
    if (this.isConnected) {
      this.endSession();
    } else {
      this.startSession();
    }
  }

  startSession(): void {
    console.log('Iniciando sesión para speakerId:', this.speakerId);
    
    // Validar que speakerId sea válido antes de hacer la petición
    if (!this.speakerId || this.speakerId < 1) {
      this.errorMessage = "ID de parlante inválido para iniciar sesión.";
      return;
    }
    
    const payload = {
      speakerId: this.speakerId,
      userId: 1, // Debería venir del AuthService
      initialBatteryPercentage: 100
    };

    console.log('Payload para iniciar sesión:', payload);

    this.http.post<{ success: boolean; data: { id: number; startTime: string } }>(`${this.API_URL}/start-session`, payload).subscribe({
      next: (response) => {
        console.log('Sesión iniciada exitosamente:', response);
        if (response.success && response.data) {
          this.isConnected = true;
          this.activeSessionId = response.data.id;
          this.errorMessage = null;
          this.sessionStartTime = response.data.startTime;
          this.resetMetrics();
          this.startPolling(this.activeSessionId);
          console.log(`Sesión iniciada con ID: ${this.activeSessionId}`);
        }
      },
      error: (err) => {
        console.error('Error al iniciar sesión:', err);
        console.error('Error details:', err.error);
        this.errorMessage = err.error?.message || "No se pudo iniciar la sesión.";
        this.isConnected = false;
      }
    });
  }

  endSession(): void {
    if (!this.activeSessionId) return;

    const finalBattery = this.latestMetrics?.battery_remaining_percent || 0;
    const payload = { finalBatteryPercentage: finalBattery };

    this.http.post<{ success: boolean }>(`${this.API_URL}/end-session/${this.activeSessionId}`, payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.isConnected = false;
          this.activeSessionId = null;
          this.errorMessage = null;
          this.resetMetrics();
          this.stopPolling();
          console.log('Sesión terminada correctamente.');
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || "No se pudo terminar la sesión.";
        this.isConnected = true;
      }
    });
  }
  
  // ✅ ACTUALIZADO: Usar el nuevo endpoint de realtime-data
  startPolling(sessionId: number): void {
    this.stopPolling();
    
    console.log(`🔄 Iniciando polling para sesión ${sessionId}`);
    
    this.pollingSubscription = timer(0, 10000).pipe(
      // ✅ CAMBIADO: Usar el nuevo endpoint realtime-data
      switchMap(() => this.http.get<{ success: boolean; data: SessionData }>(`${this.API_URL}/realtime-data/${sessionId}`)),
      catchError(err => {
        console.error('Error en polling:', err);
        this.errorMessage = 'Error obteniendo datos en tiempo real de la sesión.';
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        if (response?.success && response.data) {
          // ✅ ACTUALIZADO: Procesar las mediciones desde el nuevo formato
          if (response.data.measurements) {
            this.processMetrics(response.data.measurements);
          }
          
          // ✅ NUEVO: Actualizar estadísticas en tiempo real
          if (response.data.currentStats) {
            this.currentStats = response.data.currentStats;
            this.measurementCount = response.data.measurementCount;
            
            // Actualizar los valores calculados usando las estadísticas en tiempo real
            this.averagePower = response.data.currentStats.avgPower;
          }
          
          this.updateSessionDuration();
          console.log('📊 Datos en tiempo real actualizados:', {
            latestMetrics: this.latestMetrics,
            currentStats: this.currentStats,
            measurementCount: this.measurementCount
          });
        }
      },
      error: (err) => {
        console.error('Error durante el polling:', err);
        this.errorMessage = 'Se perdió la conexión con la sesión en tiempo real.';
        this.stopPolling();
      }
    });
  }

  private processMetrics(measurements: EnergyMetrics[]): void {
    if (!measurements || measurements.length === 0) return;

    // Ordenar por timestamp descendente para obtener la más reciente
    const sortedMeasurements = measurements.sort((a, b) => b.timestamp - a.timestamp);
    this.latestMetrics = sortedMeasurements[0];

    // Calcular estadísticas locales (para compatibilidad)
    if (measurements.length > 0) {
      const powers = measurements.map(m => m.power_mW);
      this.peakPower = Math.max(...powers);
    }
  }

  private updateSessionDuration(): void {
    if (!this.sessionStartTime) return;

    const start = new Date(this.sessionStartTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    this.sessionDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  private resetMetrics(): void {
    this.latestMetrics = null;
    this.currentStats = null;
    this.measurementCount = 0;
    this.averagePower = 0;
    this.peakPower = 0;
    this.sessionDuration = '00:00:00';
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
      console.log('⏹️ Polling detenido');
    }
  }

  toggleEnergy(): void {
    this.showEnergy = !this.showEnergy;
  }

  handleLogout(): void {
    this.authService.logout();
  }

  // Métodos helper para el template
  formatNumber(value: number | undefined, decimals: number = 2): string {
    return value ? value.toFixed(decimals) : '0.00';
  }

  getBatteryStatus(): string {
    if (!this.latestMetrics) return 'Desconocido';
    const battery = this.latestMetrics.battery_remaining_percent;
    if (battery > 80) return 'Excelente';
    if (battery > 50) return 'Bueno';
    if (battery > 20) return 'Bajo';
    return 'Crítico';
  }

  getBatteryColor(): string {
    if (!this.latestMetrics) return '#666';
    const battery = this.latestMetrics.battery_remaining_percent;
    if (battery > 50) return '#28a745';
    if (battery > 20) return '#ffc107';
    return '#dc3545';
  }

  // ✅ NUEVOS: Métodos helper para las estadísticas en tiempo real
  getRealtimeAveragePower(): string {
    return this.currentStats ? this.formatNumber(this.currentStats.avgPower, 1) : '0.0';
  }

  getRealtimeAverageCurrent(): string {
    return this.currentStats ? this.formatNumber(this.currentStats.avgCurrent, 1) : '0.0';
  }

  getRealtimeAverageVoltage(): string {
    return this.currentStats ? this.formatNumber(this.currentStats.avgVoltage, 2) : '0.00';
  }

  getTotalConsumed(): string {
    return this.currentStats ? this.formatNumber(this.currentStats.totalConsumed, 1) : '0.0';
  }

  getMeasurementCount(): number {
    return this.measurementCount || 0;
  }
}