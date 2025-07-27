import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subscription, timer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth';

// Interfaces optimizadas para el nuevo sistema
interface RealtimeSessionData {
  sessionId: number;
  speakerId: number;
  speakerName: string;
  userId: number;
  status: string;
  startTime: string;
  durationMinutes: number;
  initialBatteryPercentage: number;
  
  latestData: {
    timestamp: number;
    current_mA: number;
    voltage_V: number;
    power_mW: number;
    battery_remaining_percent: number;
    total_consumed_mAh: number;
    sample_index: number;
  };
  
  statistics: {
    avgCurrent_mA: number;
    avgVoltage_V: number;
    avgPower_mW: number;
    peakPower_mW: number;
    measurementCount: number;
    totalConsumed_mAh: number;
    durationSeconds: number;
  };
  
  hasRealtimeData: boolean;
  lastUpdated: string;
}

interface SessionData {
  id: number;
  speakerId: number;
  startTime: string;
  status: string;
  speaker?: {
    name: string;
    position: string;
  };
}

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
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
  
  // ⚡ MODO OPTIMIZADO - Fetching cada 2 segundos
  optimizedMode = true;
  
  // Datos del parlante y sesión
  private speakerId!: number;
  private userId = 1;
  activeSessionId: number | null = null;
  private pollingSubscription?: Subscription;
  
  // Datos para mostrar en la UI
  speakerInfo = { name: 'Cargando...', position: 'Cargando...' };
  realtimeData: RealtimeSessionData | null = null;
  sessionStartTime: string | null = null;
  
  // Estadísticas calculadas para mostrar
  sessionDuration = '00:00:00';
  
  // Propiedades para el navbar
  username$ = this.authService.currentUser$;
  showLogoutButton: boolean = true;
  
  // URLs del backend
  private readonly ESP32_API_URL = 'http://192.168.18.143:3000/api/energy';
  private readonly SPEAKERS_API_URL = 'http://192.168.18.143:3000/api/speakers';
  
  // ⚡ CONFIGURACIÓN OPTIMIZADA - Fetching cada 2 segundos
  private readonly POLLING_INTERVAL = 2000; // 2 segundos

  ngOnInit(): void {
    console.log('⚡ Iniciando Control Panel ULTRA OPTIMIZADO');
    console.log('🖥️ Frontend: Fetching cada 2 segundos desde endpoint único');
    console.log('🔋 Backend: Caché temporal en memoria + BD cada 30s');
    console.log('💾 Arduino: Datos cada 2s para frontend + batería cada 30s');
    
    const id = this.route.snapshot.paramMap.get('id');
    console.log('ID obtenido de la URL:', id);
    
    if (!id) {
      this.errorMessage = "No se encontró el ID del parlante en la URL.";
      this.isLoading = false;
      return;
    }
    
    const parsedId = parseInt(id, 10);
    console.log('ID parseado:', parsedId);
    
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
    
    if (!this.speakerId || this.speakerId < 1) {
      this.errorMessage = "ID de parlante inválido para verificar estado.";
      this.isLoading = false;
      return;
    }
    
    this.http.get<{ 
      success: boolean; 
      hasActiveSession: boolean; 
      session: SessionData | null;
      timestamp?: string;
    }>(`${this.ESP32_API_URL}/active-session/speaker/${this.speakerId}`)
      .pipe(
        catchError(err => {
          console.error('Error checking status:', err);
          return of({ success: false, hasActiveSession: false, session: null });
        })
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Respuesta del servidor (estado inicial):', response);
          
          if (response.success && response.hasActiveSession && response.session) {
            this.isConnected = true;
            this.activeSessionId = response.session.id;
            this.speakerInfo.name = response.session.speaker?.name || 'Desconocido';
            this.speakerInfo.position = response.session.speaker?.position || 'Desconocida';
            this.sessionStartTime = response.session.startTime;
            
            console.log(`🔄 Sesión activa encontrada (ID: ${this.activeSessionId})`);
            console.log(`📊 Iniciando fetching ULTRA OPTIMIZADO cada ${this.POLLING_INTERVAL/1000} segundos`);
            
            if (this.activeSessionId !== null) {
              this.startOptimizedPolling(this.activeSessionId);
            }
          } else {
            this.isConnected = false;
            this.getSpeakerDetails();
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || "Error al verificar el estado del parlante.";
          console.error('❌ Error en checkInitialStatus:', err);
          this.isLoading = false;
        }
      });
  }
  
  getSpeakerDetails(): void {
    console.log('Obteniendo detalles del parlante para speakerId:', this.speakerId);
    
    if (!this.speakerId || this.speakerId < 1) {
      this.speakerInfo = { name: 'ID Inválido', position: 'ID Inválido' };
      return;
    }
    
    this.http.get<{ 
      success: boolean; 
      data: { name: string; position: string } 
    }>(`${this.SPEAKERS_API_URL}/${this.speakerId}`)
      .subscribe({
        next: (res) => {
          console.log('✅ Detalles del parlante obtenidos:', res);
          if (res.success && res.data) {
            this.speakerInfo = {
              name: res.data.name,
              position: res.data.position
            };
          }
        },
        error: (err) => {
          console.error('❌ Error obteniendo detalles del parlante:', err);
          this.speakerInfo = { name: 'Desconocido', position: 'Desconocida' };
        }
      });
  }

  toggleStatus(): void {
    if (this.isConnected) {
      this.turnOffSpeaker();
    } else {
      this.turnOnSpeaker();
    }
  }

  turnOnSpeaker(): void {
    console.log('⚡ Encendiendo parlante en MODO ULTRA OPTIMIZADO:', this.speakerId);
    
    const payload = {
      speakerId: this.speakerId,
      userId: this.userId,
      initialBatteryPercentage: 100,
      mode: "ultra_optimized"
    };

    this.http.post<{ 
      success: boolean; 
      data: { id: number; startTime: string };
      message: string;
    }>(`${this.ESP32_API_URL}/start-session`, payload)
      .subscribe({
        next: (response) => {
          console.log('✅ Parlante encendido exitosamente en modo ultra optimizado:', response);
          if (response.success && response.data) {
            this.isConnected = true;
            this.activeSessionId = response.data.id;
            this.errorMessage = null;
            this.sessionStartTime = response.data.startTime;
            this.resetData();
            this.startOptimizedPolling(this.activeSessionId);
            console.log(`⚡ MODO ULTRA OPTIMIZADO activado - Sesión ID: ${this.activeSessionId}`);
            console.log('🖥️ Frontend: Fetching cada 2s desde endpoint único');
          }
        },
        error: (err) => {
          console.error('❌ Error al encender parlante:', err);
          this.errorMessage = err.error?.message || "No se pudo encender el parlante.";
          this.isConnected = false;
        }
      });
  }

  turnOffSpeaker(): void {
    if (!this.activeSessionId || !this.realtimeData) return;

    console.log('🔇 Apagando parlante y guardando historial:', this.speakerId);

    const payload = {
      finalBatteryPercentage: this.realtimeData.latestData.battery_remaining_percent,
      totalMeasurementsSent: this.realtimeData.statistics.measurementCount,
      totalConsumed_mAh: this.realtimeData.statistics.totalConsumed_mAh,
      sessionDurationSeconds: this.realtimeData.statistics.durationSeconds,
      avgCurrent_mA: this.realtimeData.statistics.avgCurrent_mA,
      avgVoltage_V: this.realtimeData.statistics.avgVoltage_V,
      avgPower_mW: this.realtimeData.statistics.avgPower_mW,
      peakPower_mW: this.realtimeData.statistics.peakPower_mW,
      mode: "ultra_optimized"
    };

    this.http.post<{ 
      success: boolean; 
      data: any;
      message: string;
    }>(`${this.ESP32_API_URL}/end-session/${this.activeSessionId}`, payload)
      .subscribe({
        next: (response) => {
          console.log('✅ Parlante apagado y historial guardado:', response);
          if (response.success) {
            this.isConnected = false;
            this.activeSessionId = null;
            this.errorMessage = null;
            this.resetData();
            this.stopPolling();
            console.log('✅ Sesión finalizada - Historial guardado en BD');
          }
        },
        error: (err) => {
          console.error('❌ Error al apagar parlante:', err);
          this.errorMessage = err.error?.message || "No se pudo apagar el parlante.";
          this.isConnected = true;
        }
      });
  }
  
  // ⚡ Polling optimizado cada 2 segundos usando UN SOLO ENDPOINT
  startOptimizedPolling(sessionId: number): void {
    this.stopPolling();
    
    console.log(`⚡ Iniciando fetching ULTRA OPTIMIZADO para sesión ${sessionId}`);
    console.log(`📊 Endpoint único cada ${this.POLLING_INTERVAL/1000} segundos`);
    
    this.pollingSubscription = timer(500, this.POLLING_INTERVAL).pipe(
      switchMap(() => this.http.get<{ 
        success: boolean; 
        data: RealtimeSessionData;
        timestamp?: string;
      }>(`${this.ESP32_API_URL}/realtime-data/${sessionId}`)),
      catchError(err => {
        console.error('❌ Error en fetching ultra optimizado:', err);
        // No mostrar error inmediatamente, permitir reconexión
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        if (response?.success && response.data) {
          // Limpiar error previo si los datos llegan correctamente
          this.errorMessage = null;
          
          console.log('⚡ Datos ULTRA OPTIMIZADOS recibidos:', {
            sessionId: response.data.sessionId,
            hasRealtimeData: response.data.hasRealtimeData,
            mediciones: response.data.statistics.measurementCount,
            bateria: response.data.latestData.battery_remaining_percent,
            potencia: response.data.latestData.power_mW,
            voltaje: response.data.latestData.voltage_V,
            corriente: response.data.latestData.current_mA
          });
          
          this.realtimeData = response.data;
          this.updateSessionDuration();
          this.animateDataUpdate();
        } else if (response?.success === false) {
          console.warn('⚠️ Backend responde pero sin datos válidos');
        }
      },
      error: (err) => {
        console.error('❌ Error durante el fetching ultra optimizado:', err);
        this.errorMessage = 'Se perdió la conexión con el servidor. Reintentando...';
        // No detener el polling, permitir reconexión automática
      }
    });
  }

  // ⚡ Animación visual para actualizaciones
  private animateDataUpdate(): void {
    if (!this.realtimeData?.hasRealtimeData) return;
    
    const metricBoxes = document.querySelectorAll('.metric-box');
    metricBoxes.forEach(box => {
      box.classList.add('updated');
      setTimeout(() => box.classList.remove('updated'), 600);
    });
    
    // Animar contenedor de energía
    const energyContent = document.querySelector('.energy-content');
    if (energyContent) {
      energyContent.classList.add('updating');
      setTimeout(() => energyContent.classList.remove('updating'), 1000);
    }
  }

  // ✅ Guardar datos de sesión con historial completo
  saveSessionData(): void {
    if (!this.activeSessionId || !this.realtimeData) {
      console.error('❌ No hay datos suficientes para guardar');
      this.errorMessage = 'No hay datos suficientes para guardar la sesión.';
      return;
    }

    console.log('⚡ Guardando sesión ULTRA OPTIMIZADA con historial completo...');

    const payload = {
      finalBatteryPercentage: this.realtimeData.latestData.battery_remaining_percent,
      totalMeasurementsSent: this.realtimeData.statistics.measurementCount,
      totalConsumed_mAh: this.realtimeData.statistics.totalConsumed_mAh,
      sessionDurationSeconds: this.realtimeData.statistics.durationSeconds,
      avgCurrent_mA: this.realtimeData.statistics.avgCurrent_mA,
      avgVoltage_V: this.realtimeData.statistics.avgVoltage_V,
      avgPower_mW: this.realtimeData.statistics.avgPower_mW,
      peakPower_mW: this.realtimeData.statistics.peakPower_mW,
      mode: "ultra_optimized"
    };

    this.http.post<{ 
      success: boolean; 
      data: any; 
      message?: string;
    }>(`${this.ESP32_API_URL}/end-session/${this.activeSessionId}`, payload)
      .subscribe({
        next: (response) => {
          console.log('✅ Sesión ULTRA OPTIMIZADA guardada exitosamente:', response);
          if (response.success) {
            this.isConnected = false;
            this.activeSessionId = null;
            this.errorMessage = null;
            this.resetData();
            this.stopPolling();
            
            const measurementCount = this.realtimeData?.statistics.measurementCount || 0;
            const totalConsumed = this.realtimeData?.statistics.totalConsumed_mAh || 0;
            const duration = Math.floor((this.realtimeData?.statistics.durationSeconds || 0) / 60);
            
            alert(`✅ Sesión guardada exitosamente en modo ULTRA OPTIMIZADO

📊 Estadísticas finales:
• ${measurementCount} mediciones procesadas
• ${totalConsumed.toFixed(1)} mAh consumidos
• ${duration} minutos de duración
💾 Historial completo guardado en BD`);
            
            this.router.navigate(['/dashboard/select-panel']);
          } else {
            this.errorMessage = response.message || 'Error desconocido al guardar la sesión';
          }
        },
        error: (err) => {
          console.error('❌ Error al guardar sesión ultra optimizada:', err);
          this.errorMessage = err.error?.message || 'No se pudieron guardar los datos de la sesión';
        }
      });
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

  private resetData(): void {
    this.realtimeData = null;
    this.sessionDuration = '00:00:00';
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
      console.log('⏹️ Fetching ULTRA OPTIMIZADO detenido');
    }
  }

  toggleEnergy(): void {
    this.showEnergy = !this.showEnergy;
  }

  handleLogout(): void {
    this.authService.logout();
  }

  // ⚡ Métodos helper mejorados para el template
  getMeasurementCount(): number {
    return this.realtimeData?.statistics.measurementCount || 0;
  }

  getLatestVoltage(): string {
    if (!this.realtimeData?.hasRealtimeData) return '0.00';
    return this.realtimeData.latestData.voltage_V.toFixed(2);
  }

  getLatestCurrent(): string {
    if (!this.realtimeData?.hasRealtimeData) return '0.0';
    return this.realtimeData.latestData.current_mA.toFixed(1);
  }

  getLatestPower(): string {
    if (!this.realtimeData?.hasRealtimeData) return '0.0';
    return this.realtimeData.latestData.power_mW.toFixed(1);
  }

  getLatestBattery(): string {
    if (!this.realtimeData?.hasRealtimeData) return '0.0';
    return this.realtimeData.latestData.battery_remaining_percent.toFixed(1);
  }

  getTotalConsumed(): string {
    if (!this.realtimeData?.hasRealtimeData) return '0.0';
    return this.realtimeData.latestData.total_consumed_mAh.toFixed(1);
  }

  getAverageVoltage(): string {
    if (!this.realtimeData?.hasRealtimeData) return '0.00';
    return this.realtimeData.statistics.avgVoltage_V.toFixed(2);
  }

  getAverageCurrent(): string {
    if (!this.realtimeData?.hasRealtimeData) return '0.0';
    return this.realtimeData.statistics.avgCurrent_mA.toFixed(1);
  }

  getAveragePower(): string {
    if (!this.realtimeData?.hasRealtimeData) return '0.0';
    return this.realtimeData.statistics.avgPower_mW.toFixed(1);
  }

  getPeakPower(): string {
    if (!this.realtimeData?.hasRealtimeData) return '0.0';
    return this.realtimeData.statistics.peakPower_mW.toFixed(1);
  }

  formatNumber(value: number | undefined, decimals: number = 2): string {
    return value ? value.toFixed(decimals) : '0.00';
  }

  getBatteryStatus(): string {
    if (!this.realtimeData?.hasRealtimeData) return 'Desconocido';
    const battery = this.realtimeData.latestData.battery_remaining_percent;
    if (battery > 80) return 'Excelente';
    if (battery > 50) return 'Bueno';
    if (battery > 20) return 'Bajo';
    return 'Crítico';
  }

  getBatteryColor(): string {
    if (!this.realtimeData?.hasRealtimeData) return '#666';
    const battery = this.realtimeData.latestData.battery_remaining_percent;
    if (battery > 50) return '#28a745';
    if (battery > 20) return '#ffc107';
    return '#dc3545';
  }

  hasRealtimeData(): boolean {
    return this.realtimeData?.hasRealtimeData || false;
  }

  // ⚡ Métodos adicionales para mejor debugging
  getConnectionStatus(): string {
    if (!this.isConnected) return 'Desconectado';
    if (!this.realtimeData) return 'Conectado - Sin datos';
    if (!this.realtimeData.hasRealtimeData) return 'Conectado - Esperando datos';
    return 'Conectado - Datos en tiempo real';
  }

  getDataFreshness(): string {
    if (!this.realtimeData?.lastUpdated) return 'Sin datos';
    const lastUpdate = new Date(this.realtimeData.lastUpdated);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
    
    if (diffSeconds < 5) return 'Datos frescos';
    if (diffSeconds < 10) return 'Datos recientes';
    if (diffSeconds < 30) return 'Datos antiguos';
    return 'Datos obsoletos';
  }

  getCurrentSampleIndex(): number {
    return this.realtimeData?.latestData.sample_index || 0;
  }

  getTimestamp(): number {
    return this.realtimeData?.latestData.timestamp || 0;
  }

  getDurationSeconds(): number {
    return this.realtimeData?.statistics.durationSeconds || 0;
  }
}