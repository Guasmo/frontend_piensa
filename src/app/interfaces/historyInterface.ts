export interface DisplayHistoryItem {
  id: number;
  usageSessionId: number;
  speakerId: number;
  speakerName: string;
  speakerPosition: string;
  userId: number;
  username?: string; // Del usuario relacionado
  startDate: string;
  endDate: string;
  durationMinutes: number | null;
  
  // Promedios de mediciones
  avgCurrent_mA: number;
  avgVoltage_V: number;
  avgPower_mW: number;
  
  // Totales
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