// Interfaces para tipar los datos
export interface EnergyMetrics {
  voltage_V: number;
  current_mA: number;
  power_mW: number;
  battery_remaining_percent: number;
  timestamp: number;
  total_consumed_mAh: number;
  sample_index: number;
}

export interface SessionData {
  id: number;
  speakerId: number;
  userId: number;
  startTime: string;
  endTime?: string;
  initialBatteryPercentage: number;
  finalBatteryPercentage?: number;
  energyMeasurements: EnergyMetrics[];
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

// ✅ NUEVA: Interface para estadísticas en tiempo real
export interface RealtimeStats {
  averageVoltage: number;
  averageCurrent: number;
  averagePower: number;
  totalConsumed: number;
  measurementCount: number;
  durationSeconds: number;
}
