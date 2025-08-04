import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HistoryItem } from '../interfaces/speakerInterface';
import { apiURL } from './api';
import { createSpeakerApi, deleteSpeakerApi, forceShutdownApi, getActiveSessionApi, getAllHistoryApi, getBatteryLevelApi, getSpeakerByIdApi, getSpeakersApi, getSpeakerStatusApi, speakersApi, updateSpeakerApi } from '../constants/endPoints';

@Injectable({
  providedIn: 'root'
})
export class SpeakersService {
  private readonly API_URL = apiURL;

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

  // 🔥 MÉTODO DE DEBUGGING PARA VER LOS NOMBRES REALES DE LOS CAMPOS
  debugHistoryItemFields(item: any): void {
    console.log('🔍 === DEBUGGING CAMPOS DEL HISTORIAL ===');
    console.log('Campos disponibles:', Object.keys(item));
    console.log('Valores de campos relevantes:');
    
    // Buscar campos que contengan 'current', 'voltage', 'power', 'battery', etc.
    Object.keys(item).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('current') || 
          lowerKey.includes('voltage') || 
          lowerKey.includes('power') || 
          lowerKey.includes('battery') || 
          lowerKey.includes('consumed') || 
          lowerKey.includes('avg') || 
          lowerKey.includes('total')) {
        console.log(`  ${key}: ${item[key]} (type: ${typeof item[key]})`);
      }
    });
    console.log('======================================');
  }

  // 🔥 MÉTODO CORREGIDO: Transformar datos del historial
  private transformHistoryItem(item: any): HistoryItem {
    console.log('🔍 RAW item del backend:', item);

    // 🔥 FUNCIÓN HELPER: Convertir valores a número de forma segura
    const safeToNumber = (value: any, defaultValue: number = 0): number => {
      if (value === null || value === undefined || value === '') {
        return defaultValue;
      }
      
      // Si es objeto Decimal de Prisma/PostgreSQL
      if (typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
        const num = Number(value.toString());
        return isNaN(num) ? defaultValue : num;
      }
      
      // Si es string o number
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    };

    // 🔥 MAPEO CORRECTO DE CAMPOS DEL BACKEND
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
      
      // 🔥 CAMPOS NUMÉRICOS CORREGIDOS - MÚLTIPLES OPCIONES DE NOMBRES
      avgCurrent_mA: safeToNumber(
        item.avgCurrent_mA || 
        item.avgAmpereHours || 
        item.averageCurrentMA || 
        item.average_current_mA || 
        item.avgCurrentMA
      ),
      avgVoltage_V: safeToNumber(
        item.avgVoltage_V || 
        item.avgVoltageHours || 
        item.averageVoltageV || 
        item.average_voltage_V || 
        item.avgVoltageV
      ),
      avgPower_mW: safeToNumber(
        item.avgPower_mW || 
        item.avgWattsHours || 
        item.averagePowerMW || 
        item.average_power_mW || 
        item.avgPowerMW
      ),
      
      totalCurrent_mA: safeToNumber(
        item.totalCurrent_mA || 
        item.totalAmpereHours || 
        item.totalCurrentMA || 
        item.total_current_mA || 
        item.totalCurrentmA
      ),
      totalVoltage_V: safeToNumber(
        item.totalVoltage_V || 
        item.totalVoltageHours || 
        item.totalVoltageV || 
        item.total_voltage_V || 
        item.totalVoltagemV
      ),
      totalPower_mW: safeToNumber(
        item.totalPower_mW || 
        item.totalWattsHours || 
        item.totalPowerMW || 
        item.total_power_mW || 
        item.totalPowermW
      ),
      totalConsumed_mAh: safeToNumber(
        item.totalConsumed_mAh || 
        item.totalConsumption || 
        item.totalConsumedMAh || 
        item.total_consumed_mAh || 
        item.totalConsumedmAh
      ),
      
      // Información de batería
      initialBatteryPercentage: safeToNumber(item.initialBatteryPercentage, 100),
      finalBatteryPercentage: safeToNumber(item.finalBatteryPercentage, 100),
      batteryConsumed: safeToNumber(item.batteryConsumed, 0),
      
      createdAt: new Date(item.createdAt),
      
      // Información del usuario
      user: item.user || null
    };

    console.log('✅ Item transformado exitosamente:', {
      id: transformedItem.id,
      speakerName: transformedItem.speakerName,
      avgCurrent_mA: transformedItem.avgCurrent_mA,
      avgVoltage_V: transformedItem.avgVoltage_V,
      avgPower_mW: transformedItem.avgPower_mW,
      totalConsumed_mAh: transformedItem.totalConsumed_mAh,
      batteryInfo: `${transformedItem.initialBatteryPercentage}% -> ${transformedItem.finalBatteryPercentage}%`
    });

    return transformedItem;
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
    }>(`${this.API_URL}${getAllHistoryApi}`, this.getHttpOptions())
    .pipe(
      map(response => {
        if (!response.success || !response.data || !response.data.histories) {
          console.error('❌ Formato de respuesta inválido:', response);
          return [];
        }

        console.log('📊 Total historiales recibidos:', response.data.histories.length);
        
        // Debugging del primer item para ver los campos reales
        if (response.data.histories.length > 0) {
          this.debugHistoryItemFields(response.data.histories[0]);
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
    }>(`${this.API_URL}${getSpeakerByIdApi}${speakerId}/history?limit=${limit}&page=${page}`, this.getHttpOptions())
    .pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error('Error al obtener el historial del parlante');
        }

        console.log('📊 Historial del parlante recibido:', response.data.histories.length, 'registros');
        
        // Debugging del primer item si existe
        if (response.data.histories.length > 0) {
          this.debugHistoryItemFields(response.data.histories[0]);
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

  // 🔐 MÉTODOS CON AUTENTICACIÓN - ACTUALIZADOS
  getAllSpeakers(): Observable<any> {
    return this.http.get(`${this.API_URL}${getSpeakersApi}`, this.getHttpOptions());
  }

  getSpeakerById(id: number): Observable<any> {
    return this.http.get(`${this.API_URL}${getSpeakerByIdApi}${id}`, this.getHttpOptions());
  }

  // 🔐 CREATE SPEAKER - CON AUTENTICACIÓN
  createSpeaker(speaker: any): Observable<any> {
    console.log('🔐 Creating speaker with auth headers:', this.getAuthHeaders());
    console.log('📝 Speaker data:', speaker);
    
    return this.http.post(`${this.API_URL}${createSpeakerApi}`, speaker, this.getHttpOptions());
  }

  // 🔐 UPDATE SPEAKER - CON AUTENTICACIÓN
  updateSpeaker(id: number, speaker: any): Observable<any> {
    console.log('🔐 Updating speaker with auth headers:', this.getAuthHeaders());
    console.log('📝 Update data:', speaker);
    
    return this.http.put(`${this.API_URL}${updateSpeakerApi}${id}`, speaker, this.getHttpOptions());
  }

  // 🔐 DELETE SPEAKER - CON AUTENTICACIÓN
  deleteSpeaker(id: number): Observable<any> {
    console.log('🔐 Deleting speaker with auth headers:', this.getAuthHeaders());
    
    return this.http.delete(`${this.API_URL}${deleteSpeakerApi}${id}`, this.getHttpOptions());
  }

  // 🔐 MÉTODOS ADICIONALES CON AUTENTICACIÓN
  getSpeakerStatus(id: number): Observable<any> {
    return this.http.get(`${this.API_URL}${speakersApi}/${id}${getSpeakerStatusApi}`, this.getHttpOptions());
  }

  getSpeakerActiveSession(id: number): Observable<any> {
    return this.http.get(`${this.API_URL}${speakersApi}/${id}${getActiveSessionApi}`, this.getHttpOptions());
  }

  forceShutdownSpeaker(id: number): Observable<any> {
    return this.http.post(`${this.API_URL}${speakersApi}/${id}${forceShutdownApi}`, {}, this.getHttpOptions());
  }

  getBatteryStats(): Observable<any> {
    return this.http.get(`${this.API_URL}${speakersApi}${getBatteryLevelApi}`, this.getHttpOptions());
  }

  // 🔧 MÉTODO PARA VERIFICAR SI HAY TOKEN
  hasAccessToken(): boolean {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    return !!token;
  }

  // 🔧 MÉTODO PARA LIMPIAR TOKEN (ÚTIL PARA LOGOUT)
  clearAccessToken(): void {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
  }


  // Obtener nivel actual de batería de un speaker
getSpeakerBatteryLevel(speakerId: number): Observable<{
  success: boolean;
  speakerId: number;
  currentBatteryLevel: number;
  lastUpdated: string;
}> {
  return this.http.get<any>(`${this.API_URL}${speakersApi}/${speakerId}${getBatteryLevelApi}`, this.getHttpOptions());
}

// Actualizar nivel de batería de un speaker
updateSpeakerBatteryLevel(speakerId: number, batteryLevel: number): Observable<any> {
  return this.http.put(`${this.API_URL}${speakersApi}/${speakerId}${getBatteryLevelApi}`, 
    { batteryLevel }, 
    this.getHttpOptions()
  );
}


}