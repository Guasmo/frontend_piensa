import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HistoryItem } from '../interfaces/speakerInterface';

@Injectable({
  providedIn: 'root'
})
export class SpeakersService {
  private readonly API_URL = 'http://192.168.18.143:3000/api';

  constructor(private http: HttpClient) {}

  // 📊 MÉTODO CORREGIDO: Obtener historial con transformación correcta
  getAllSpeakersHistory(): Observable<HistoryItem[]> {
    return this.http.get<{
      success: boolean;
      data: {
        histories: any[];
        total: number;
        page: number;
        limit: number;
      }
    }>(`${this.API_URL}/speakers/all-history`)
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
        total: number;
        page: number;
        limit: number;
      }
    }>(`${this.API_URL}/speakers/${speakerId}/history?limit=${limit}&page=${page}`)
    .pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error('Error al obtener el historial del parlante');
        }

        return {
          data: {
            histories: response.data.histories.map(item => this.transformHistoryItem(item)),
            total: response.data.total,
            page: response.data.page,
            limit: response.data.limit
          }
        };
      })
    );
  }

  // 🧮 MÉTODO CORREGIDO: Transformar datos del historial para evitar NaN
  private transformHistoryItem(item: any): HistoryItem {
    console.log('🔍 Transformando item del historial:', item);

    // 🔥 FUNCIÓN HELPER: Convertir Decimal a number con validación
    const safeDecimalToNumber = (value: any, defaultValue: number = 0): number => {
      if (value === null || value === undefined) {
        return defaultValue;
      }
      
      // Si es objeto Decimal de Prisma
      if (typeof value === 'object' && value.constructor.name === 'Decimal') {
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
      
      // 🔥 PROMEDIOS CONVERTIDOS CORRECTAMENTE
      avgCurrent_mA: safeDecimalToNumber(item.avgAmpereHours, 0),
      avgVoltage_V: safeDecimalToNumber(item.avgVoltageHours, 0),
      avgPower_mW: safeDecimalToNumber(item.avgWattsHours, 0),
      
      // 🔥 TOTALES CONVERTIDOS CORRECTAMENTE 
      totalCurrent_mA: safeDecimalToNumber(item.totalAmpereHours, 0),
      totalVoltage_V: safeDecimalToNumber(item.totalVoltageHours, 0),
      totalPower_mW: safeDecimalToNumber(item.totalWattsHours, 0),
      
      // 🔥 NUEVO: Calcular consumo total desde los datos del ESP32
      totalConsumed_mAh: this.calculateTotalConsumedFromESP32(item),
      
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

  // 🔥 NUEVO: Calcular consumo total desde datos del ESP32
  private calculateTotalConsumedFromESP32(item: any): number {
    // Priorizar datos del ESP32 si están disponibles
    if (item.esp32Data && typeof item.esp32Data === 'object') {
      const esp32Data = item.esp32Data;
      
      // Usar totalConsumed_mAh del ESP32 si está disponible
      if (esp32Data.totalConsumed_mAh && !isNaN(esp32Data.totalConsumed_mAh)) {
        console.log('📊 Usando totalConsumed_mAh del ESP32:', esp32Data.totalConsumed_mAh);
        return esp32Data.totalConsumed_mAh;
      }
      
      // Calcular desde avgCurrent_mA y duración si está disponible
      if (esp32Data.avgCurrent_mA && item.durationMinutes) {
        const totalConsumed = (esp32Data.avgCurrent_mA * item.durationMinutes) / 60;
        console.log('📊 Calculado desde ESP32 avgCurrent:', totalConsumed);
        return totalConsumed;
      }
    }
    
    // Fallback: usar totalAmpereHours si está disponible
    if (item.totalAmpereHours) {
      const num = Number(item.totalAmpereHours);
      if (!isNaN(num)) {
        console.log('📊 Usando totalAmpereHours como fallback:', num);
        return num;
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

  // Métodos existentes sin cambios
  getAllSpeakers(): Observable<any> {
    return this.http.get(`${this.API_URL}/speakers`);
  }

  getSpeakerById(id: number): Observable<any> {
    return this.http.get(`${this.API_URL}/speakers/${id}`);
  }

  createSpeaker(speaker: any): Observable<any> {
    return this.http.post(`${this.API_URL}/speakers`, speaker);
  }

  updateSpeaker(id: number, speaker: any): Observable<any> {
    return this.http.put(`${this.API_URL}/speakers/${id}`, speaker);
  }

  deleteSpeaker(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/speakers/${id}`);
  }
}