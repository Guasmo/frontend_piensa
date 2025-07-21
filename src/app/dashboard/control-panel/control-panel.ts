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

interface SessionData {
  id: number;
  speakerId: number;
  userId: number;
  startTime: string;
  endTime?: string;
  initialBatteryPercentage: number;
  finalBatteryPercentage?: number;
  energyMeasurements: EnergyMetrics[];
  speaker: {
    name: string;
    position: string;
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
  activeSessionId: number | null = null; // ✅ Cambiado de private a public
  private pollingSubscription?: Subscription;
  
  // Datos para mostrar en la UI
  speakerInfo = { name: 'Cargando...', position: 'Cargando...' };
  latestMetrics: EnergyMetrics | null = null;
  sessionStartTime: string | null = null;
  
  // Estadísticas calculadas
  averagePower = 0;
  peakPower = 0;
  sessionDuration = '00:00:00';
  
  // Propiedades para el navbar
  username$ = this.authService.currentUser$;
  showLogoutButton: boolean = true;
  
  private readonly API_URL = 'http://localhost:3000/esp32-data';

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
    
    this.http.get<{ session: SessionData }>(`${this.API_URL}/active-session/speaker/${this.speakerId}`)
      .pipe(
        catchError(err => {
          console.error('Error checking status:', err);
          console.error('Error details:', err.error);
          return of({ session: null });
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Respuesta del servidor:', response);
          if (response.session) {
            this.isConnected = true;
            this.activeSessionId = response.session.id;
            this.speakerInfo.name = response.session.speaker.name;
            this.speakerInfo.position = response.session.speaker.position;
            this.sessionStartTime = response.session.startTime;
            
            // Procesar métricas existentes
            if (response.session.energyMeasurements?.length > 0) {
              this.processMetrics(response.session.energyMeasurements);
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
    
    this.http.get<{ status: { speaker: { name: string; position: string } } }>(`${this.API_URL}/speaker-status/${this.speakerId}`)
      .subscribe({
        next: (res) => {
          console.log('Detalles del parlante obtenidos:', res);
          this.speakerInfo = res.status.speaker;
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

    this.http.post<{ data: { id: number } }>(`${this.API_URL}/start-session`, payload).subscribe({
      next: (response) => {
        console.log('Sesión iniciada exitosamente:', response);
        this.isConnected = true;
        this.activeSessionId = response.data.id;
        this.errorMessage = null;
        this.sessionStartTime = new Date().toISOString();
        this.resetMetrics();
        this.startPolling(this.activeSessionId);
        console.log(`Sesión iniciada con ID: ${this.activeSessionId}`);
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

    this.http.post(`${this.API_URL}/end-session/${this.activeSessionId}`, payload).subscribe({
      next: () => {
        this.isConnected = false;
        this.activeSessionId = null;
        this.errorMessage = null;
        this.resetMetrics();
        this.stopPolling();
        console.log('Sesión terminada correctamente.');
      },
      error: (err) => {
        this.errorMessage = err.error?.message || "No se pudo terminar la sesión.";
        this.isConnected = true;
      }
    });
  }
  
  startPolling(sessionId: number): void {
    this.stopPolling();
    
    console.log(`🔄 Iniciando polling para sesión ${sessionId}`);
    
    this.pollingSubscription = timer(0, 10000).pipe(
      switchMap(() => this.http.get<{ data: SessionData }>(`${this.API_URL}/current-session/${sessionId}`)),
      catchError(err => {
        console.error('Error en polling:', err);
        this.errorMessage = 'Error obteniendo datos de la sesión.';
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        if (response?.data?.energyMeasurements) {
          this.processMetrics(response.data.energyMeasurements);
          this.updateSessionDuration();
          console.log('📊 Datos actualizados:', this.latestMetrics);
        }
      },
      error: (err) => {
        console.error('Error durante el polling:', err);
        this.errorMessage = 'Se perdió la conexión con la sesión.';
        this.stopPolling();
      }
    });
  }

  private processMetrics(measurements: EnergyMetrics[]): void {
    if (!measurements || measurements.length === 0) return;

    // Ordenar por timestamp descendente para obtener la más reciente
    const sortedMeasurements = measurements.sort((a, b) => b.timestamp - a.timestamp);
    this.latestMetrics = sortedMeasurements[0];

    // Calcular estadísticas
    const powers = measurements.map(m => m.power_mW);
    this.averagePower = powers.reduce((sum, p) => sum + p, 0) / powers.length;
    this.peakPower = Math.max(...powers);
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
}