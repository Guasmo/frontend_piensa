import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HistoryItem } from '../interfaces/speakerInterface';

@Injectable({
  providedIn: 'root'
})
export class SpeakersService {
  private readonly API_URL = 'https://backendpiensa-production.up.railway.app';

  constructor(private http: HttpClient) {}

  // 🔐 MÉTODO PARA OBTENER HEADERS CON AUTENTICACIÓN
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    
    if (!token) {
      console.warn('⚠️ No auth token found in localStorage or sessionStorage');
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // 🔐 MÉTODO PARA OBTENER OPCIONES HTTP CON AUTENTICACIÓN
  private getHttpOptions() {
    return {
      headers: this.getAuthHeaders()
    };
  }

  // 📊 MÉTODO CORREGIDO: Obtener historial de todos los parlantes
  getAllSpeakersHistory(): Observable<HistoryItem[]> {
    return this.http.get<{
      success: boolean;
      data: {
        histories: any[];
        total: number;
        page: number;
        limit: number;
      }
    }>(`${this.API_URL}/speakers/all-history`, this.getHttpOptions())
    .pipe(
      map(response => {
        if (!response.success || !response.data || !response.data.histories) {
          console.error('❌ Formato de respuesta inválido:', response);
          return [];
        }

        return response.data.histories.map(item => this.transformHistoryItem(item));
      })
    );
  }

  // 📊 MÉTODO CORREGIDO: Obtener historial de parlante específico
  getSpeakerHistory(speakerId: number, limit: number = 20, page: number = 1): Observable<{
    data: {
      histories: HistoryItem[];
      total: number;
      page: number;
      limit: number;
    }
  }> {
    return this.http.get<{
      success: boolean;
      data: {
        histories: any[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        }
      }
    }>(`${this.API_URL}/speakers/${speakerId}/history?limit=${limit}&page=${page}`, this.getHttpOptions())
    .pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error('Error al obtener el historial del parlante');
        }

        return {
          data: {
            histories: response.data.histories.map(item => this.transformHistoryItem(item)),
            total: response.data.pagination.total,
            page: response.data.pagination.page,
            limit: response.data.pagination.limit
          }
        };
      })
    );
  }

  // 🧮 MÉTODO CORREGIDO: Transformar datos del historial con nombres de campos correctos
  private transformHistoryItem(item: any): HistoryItem {
    console.log('🔍 Transformando item del historial:', item);

    // 🔥 FUNCIÓN HELPER: Convertir Decimal a number con validación
    const safeDecimalToNumber = (value: any, defaultValue: number = 0): number => {
      if (value === null || value === undefined) {
        return defaultValue;
      }
      
      // Si es objeto Decimal de Prisma
      if (typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
        const num = Number(value.toString());
        return isNaN(num) ? defaultValue : num;
      }
      
      // Si es string o number
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    };

    // 🔥 CONVERSIÓN SEGURA DE TODOS LOS CAMPOS NUMÉRICOS
    const transformedItem: HistoryItem = {
      id: item.id,
      usageSessionId: item.usageSessionId,
      speakerId: item.speakerId,
      speakerName: item.speakerName || 'Desconocido',
      speakerPosition: item.speakerPosition || 'Desconocida',
      userId: item.userId,
      startDate: new Date(item.startDate),
      endDate: new Date(item.endDate),
      durationMinutes: item.durationMinutes || 0,
      
      // 🔥 RETORNAR NÚMEROS DIRECTAMENTE (NO STRING | NUMBER)
      avgCurrent_mA: safeDecimalToNumber(item.avgAmpereHours, 0),
      avgVoltage_V: safeDecimalToNumber(item.avgVoltageHours, 0),
      avgPower_mW: safeDecimalToNumber(item.avgWattsHours, 0),
      
      // 🔥 TOTALES CONVERTIDOS CORRECTAMENTE 
      totalCurrent_mA: safeDecimalToNumber(item.totalAmpereHours, 0),
      totalVoltage_V: safeDecimalToNumber(item.totalVoltageHours, 0),
      totalPower_mW: safeDecimalToNumber(item.totalWattsHours, 0),
      
      // 🔥 CALCULAR CONSUMO TOTAL
      totalConsumed_mAh: this.calculateTotalConsumedFromData(item),
      
      // Información de batería
      initialBatteryPercentage: safeDecimalToNumber(item.initialBatteryPercentage, 100),
      finalBatteryPercentage: safeDecimalToNumber(item.finalBatteryPercentage, 100),
      batteryConsumed: safeDecimalToNumber(item.batteryConsumed, 0),
      
      createdAt: new Date(item.createdAt),
      
      // Información del usuario
      user: item.user || null
    };

    console.log('✅ Item transformado:', {
      id: transformedItem.id,
      avgCurrent: transformedItem.avgCurrent_mA,
      avgVoltage: transformedItem.avgVoltage_V,
      avgPower: transformedItem.avgPower_mW,
      totalConsumed: transformedItem.totalConsumed_mAh,
      battery: `${transformedItem.initialBatteryPercentage}% -> ${transformedItem.finalBatteryPercentage}%`
    });

    return transformedItem;
  }

  // 🔥 CALCULAR CONSUMO TOTAL DESDE LOS DATOS DISPONIBLES
  private calculateTotalConsumedFromData(item: any): number {
    // Priorizar totalAmpereHours si está disponible
    if (item.totalAmpereHours) {
      const num = Number(item.totalAmpereHours);
      if (!isNaN(num)) {
        console.log('📊 Usando totalAmpereHours:', num);
        return num;
      }
    }
    
    // Calcular desde avgAmpereHours y duración si está disponible
    if (item.avgAmpereHours && item.durationMinutes) {
      const avgCurrent = Number(item.avgAmpereHours);
      const duration = Number(item.durationMinutes);
      if (!isNaN(avgCurrent) && !isNaN(duration)) {
        const totalConsumed = (avgCurrent * duration) / 60;
        console.log('📊 Calculado desde promedio y duración:', totalConsumed);
        return totalConsumed;
      }
    }
    
    // Último fallback: calcular desde batería consumida (estimación)
    const batteryConsumed = Number(item.batteryConsumed) || 0;
    if (batteryConsumed > 0) {
      // Asumir capacidad de 5800mAh (del código Arduino)
      const estimatedConsumed = (batteryConsumed / 100) * 5800;
      console.log('📊 Estimado desde batería consumida:', estimatedConsumed);
      return estimatedConsumed;
    }
    
    console.log('⚠️ No se pudo calcular totalConsumed_mAh, usando 0');
    return 0;
  }

  // 🔐 MÉTODOS CON AUTENTICACIÓN - ACTUALIZADOS
  getAllSpeakers(): Observable<any> {
    return this.http.get(`${this.API_URL}/speakers`, this.getHttpOptions());
  }

  getSpeakerById(id: number): Observable<any> {
    return this.http.get(`${this.API_URL}/speakers/${id}`, this.getHttpOptions());
  }

  // 🔐 CREATE SPEAKER - CON AUTENTICACIÓN
  createSpeaker(speaker: any): Observable<any> {
    console.log('🔐 Creating speaker with auth headers:', this.getAuthHeaders());
    console.log('📝 Speaker data:', speaker);
    
    return this.http.post(`${this.API_URL}/speakers`, speaker, this.getHttpOptions());
  }

  // 🔐 UPDATE SPEAKER - CON AUTENTICACIÓN
  updateSpeaker(id: number, speaker: any): Observable<any> {
    console.log('🔐 Updating speaker with auth headers:', this.getAuthHeaders());
    console.log('📝 Update data:', speaker);
    
    return this.http.put(`${this.API_URL}/speakers/${id}`, speaker, this.getHttpOptions());
  }

  // 🔐 DELETE SPEAKER - CON AUTENTICACIÓN
  deleteSpeaker(id: number): Observable<any> {
    console.log('🔐 Deleting speaker with auth headers:', this.getAuthHeaders());
    
    return this.http.delete(`${this.API_URL}/speakers/${id}`, this.getHttpOptions());
  }

  // 🔐 MÉTODOS ADICIONALES CON AUTENTICACIÓN
  getSpeakerStatus(id: number): Observable<any> {
    return this.http.get(`${this.API_URL}/speakers/${id}/status`, this.getHttpOptions());
  }

  getSpeakerActiveSession(id: number): Observable<any> {
    return this.http.get(`${this.API_URL}/speakers/${id}/active-session`, this.getHttpOptions());
  }

  forceShutdownSpeaker(id: number): Observable<any> {
    return this.http.post(`${this.API_URL}/speakers/${id}/force-shutdown`, {}, this.getHttpOptions());
  }

  getBatteryStats(): Observable<any> {
    return this.http.get(`${this.API_URL}/speakers/battery/stats`, this.getHttpOptions());
  }

  // 🔧 MÉTODO PARA VERIFICAR SI HAY TOKEN
  hasaccessToken(): boolean {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    return !!token;
  }

  // 🔧 MÉTODO PARA LIMPIAR TOKEN (ÚTIL PARA LOGOUT)
  clearaccessToken(): void {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
  }
}