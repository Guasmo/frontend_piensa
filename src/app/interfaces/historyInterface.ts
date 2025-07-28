// historyInterface.ts
export interface DisplayHistoryItem {
  id: number;
  usageSessionId: number;
  speakerId: number;
  speakerName: string;
  speakerPosition: string;
  userId: number;
  username: string;
  startDate: string;
  endDate: string;
  durationMinutes: number | null;
  
  // 🔧 CAMPOS NUMÉRICOS ASEGURADOS
  avgCurrent_mA: number;
  avgVoltage_V: number;
  avgPower_mW: number;
  
  totalCurrent_mA: number;
  totalVoltage_V: number;
  totalPower_mW: number;
  totalConsumed_mAh: number;
  
  // Información de batería
  initialBatteryPercentage: number;
  finalBatteryPercentage: number;
  batteryConsumed: number;
  
  createdAt: string;
}

// speakerInterface.ts - Parte del HistoryItem
export interface HistoryItem {
  id: number;
  usageSessionId: number;
  speakerId: number;
  speakerName: string;
  speakerPosition: string;
  userId: number;
  startDate: Date;
  endDate: Date;
  durationMinutes: number | null;
  
  // 🔧 ESTOS CAMPOS PUEDEN VENIR COMO STRING O NUMBER DEL BACKEND
  avgCurrent_mA: string | number;
  avgVoltage_V: string | number;
  avgPower_mW: string | number;
  
  totalCurrent_mA: string | number;
  totalVoltage_V: string | number;
  totalPower_mW: string | number;
  totalConsumed_mAh: string | number;
  
  // Información de batería
  initialBatteryPercentage: string | number;
  finalBatteryPercentage: string | number;
  batteryConsumed: string | number;
  
  createdAt: Date;
  
  // Usuario asociado
  user?: {
    id: number;
    username: string;
    email: string;
  } | null;
}

// 🔧 INTERFAZ ADICIONAL: Para la respuesta del backend
export interface SpeakerHistoryResponse {
  success: boolean;
  data: {
    histories: HistoryItem[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    total?: number;
    page?: number;
    limit?: number;
  };
  timestamp: string;
}