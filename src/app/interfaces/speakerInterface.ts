export interface User {
  id: number;
  username: string;
  email: string;
}

export interface HistoryItem {
  id: number;
  usageSessionId: number;
  speakerId: number;
  speakerName: string;
  speakerPosition: string;
  userId: number;
  startDate: Date | string;
  endDate: Date | string;
  durationMinutes: number | null;
  
  // Promedios de mediciones
  avgCurrent_mA: number | string; // Decimal se recibe como string desde la API
  avgVoltage_V: number | string;
  avgPower_mW: number | string;
  
  // Totales
  totalCurrent_mA: number | string;
  totalVoltage_V: number | string;
  totalPower_mW: number | string;
  totalConsumed_mAh: number | string;
  
  // Información de batería
  initialBatteryPercentage: number | string;
  finalBatteryPercentage: number | string;
  batteryConsumed: number | string;
  
  createdAt: Date | string;
  
  // Relaciones opcionales
  user?: {
    id: number;
    username: string;
    email: string;
  };
  speaker?: {
    id: number;
    name: string;
    position: string;
    state: boolean;
    batteryPercentage: number;
  };
}

export interface HistoryResponse {
  success: boolean;
  data: {
    histories: HistoryItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  timestamp: string;
}

export interface Speaker {
  id: number;
  name: string;
  position: string;
  state: boolean;
  batteryPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpeakersResponse {
  success: boolean;
  count: number;
  data: Speaker[];
  timestamp: string;
}
