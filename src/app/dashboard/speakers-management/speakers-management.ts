// speakers-management.component.ts - CÓDIGO COMPLETO
import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpeakersService } from '../../services/speaker.service';
import { loginApi } from '../../constants/endPoints';
// IMPORTAR la interfaz HistoryItem existente
import { HistoryItem } from '../../interfaces/speakerInterface';

interface Speaker {
  id: number;
  name: string;
  position: string;
  state: boolean;
  batteryPercentage: number;
  createdAt: string;
  updatedAt: string;
  usageSessions: any[];
  _count: {
    usageSessions: number;
    histories: number;
  };
}

interface ApiResponse {
  success: boolean;
  count: number;
  data: Speaker[];
  timestamp: string;
}

interface CreateSpeakerForm {
  name: string;
  position: string;
  state: boolean;
  batteryPercentage: number;
}

interface UpdateSpeakerForm {
  name: string;
  position: string;
  state: boolean;
  batteryPercentage: number;
}

// Interfaz para el calendario de batería
interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasBatteryData: boolean;
  dataCount: number;
}

interface BatteryDataPoint {
  date: string;
  initialBattery: number;
  finalBattery: number;
  voltage: number;
  timestamp: Date;
  durationMinutes: number;
}

@Component({
  selector: 'app-speakers-management',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './speakers-management.html',
  styleUrl: './speakers-management.css'
})
export class SpeakersManagementComponent implements OnInit {
  speakers: Speaker[] = [];
  loading = true;
  error = '';

  // Control de data view
  activeDataView: string | null = null;
  selectedSpeaker: Speaker | null = null;

  // Form data
  createForm: CreateSpeakerForm = {
    name: '',
    position: '',
    state: false,
    batteryPercentage: 100
  };

  editForm: UpdateSpeakerForm = {
    name: '',
    position: '',
    state: false,
    batteryPercentage: 100
  };

  // Position mapping
  private positionMapping: { [key: string]: string } = {
    'Top Left': 'Top Left',
    'Top Center': 'Top Center', 
    'Top Right': 'Top Right',
    'Center Left': 'Center Left',
    'Center': 'Center',
    'Center Right': 'Center Right',
    'Bottom Left': 'Bottom Left',
    'Bottom Center': 'Bottom Center',
    'Bottom Right': 'Bottom Right'
  };

  availablePositions = [
    'Top Left', 'Top Center', 'Top Right',
    'Center Left', 'Center', 'Center Right',
    'Bottom Left', 'Bottom Center', 'Bottom Right'
  ];

  // Propiedades del calendario para batería
  showBatteryCalendar = false;
  selectedBatteryDate: Date | null = null;
  currentBatteryCalendarDate = new Date();
  batteryCalendarDays: CalendarDay[] = [];
  batteryDateFilter: string | null = null;

  // Calendar navigation
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Battery chart properties
  batteryTimeFilter: string = 'hours';
  voltageLabels: number[] = [7.4, 6.5, 5.6, 4.7, 3.8, 2.9, 2.0, 1.1, 0];
  gridLines: any[] = [];
  batteryChartPath: string = '';
  batteryDataPoints: any[] = [];
  timeLabels: string[] = [];

  // USAR la interfaz HistoryItem importada
  speakerBatteryHistory: HistoryItem[] = [];
  batteryDataByDate: { [key: string]: BatteryDataPoint[] } = {};
  loadingBatteryData = false;
  batteryDataCache: { [speakerId: number]: HistoryItem[] } = {};

  constructor(private speakersService: SpeakersService, private router: Router) {
    this.initializeBatteryChart();
    
    // Listen for escape key to close calendar
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.showBatteryCalendar) {
        this.showBatteryCalendar = false;
      }
    });
  }
  
  ngOnInit() {
    this.loadSpeakers();
  }

  // ==================== LOADING METHODS ====================
  
  loadSpeakers() {
    this.loading = true;
    this.error = '';

    this.speakersService.getAllSpeakers().subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          this.speakers = response.data;
          console.log('✅ Speakers loaded:', this.speakers);
        } else {
          this.error = 'Error loading speakers';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading speakers:', error);
        this.error = 'Connection error with server';
        this.loading = false;
      }
    });
  }

  // MODIFICADO: Manejar fechas correctamente
  async loadSpeakerBatteryData(speakerId: number): Promise<void> {
    // Verificar si ya tenemos los datos en caché
    if (this.batteryDataCache[speakerId]) {
      this.speakerBatteryHistory = this.batteryDataCache[speakerId];
      this.processBatteryData();
      return;
    }

    this.loadingBatteryData = true;
    
    try {
      // Cargar historial del speaker específico (últimos 100 registros para tener suficientes datos)
      const response = await this.speakersService.getSpeakerHistory(speakerId, 100, 1).toPromise();
      
      if (response && response.data && response.data.histories) {
        this.speakerBatteryHistory = response.data.histories;
        // Guardar en caché
        this.batteryDataCache[speakerId] = this.speakerBatteryHistory;
        this.processBatteryData();
        console.log(`✅ Battery data loaded for speaker ${speakerId}:`, this.speakerBatteryHistory.length, 'records');
      } else {
        console.warn(`⚠️ No battery data found for speaker ${speakerId}`);
        this.speakerBatteryHistory = [];
      }
    } catch (error) {
      console.error(`❌ Error loading battery data for speaker ${speakerId}:`, error);
      this.speakerBatteryHistory = [];
      this.error = 'Error loading battery data';
    }
    
    this.loadingBatteryData = false;
  }

  // MODIFICADO: Procesar fechas correctamente según el tipo
  processBatteryData(): void {
    this.batteryDataByDate = {};
    
    this.speakerBatteryHistory.forEach(history => {
      // Manejar startDate como Date o string
      let date: Date;
      if (history.startDate instanceof Date) {
        date = history.startDate;
      } else {
        date = new Date(history.startDate);
      }
      
      const dateStr = this.formatDateForComparison(date);
      
      if (!this.batteryDataByDate[dateStr]) {
        this.batteryDataByDate[dateStr] = [];
      }
      
      // Crear punto de datos de batería
      const dataPoint: BatteryDataPoint = {
        date: dateStr,
        initialBattery: history.initialBatteryPercentage || 0,
        finalBattery: history.finalBatteryPercentage || 0,
        voltage: history.avgVoltage_V || this.percentageToVoltage(history.initialBatteryPercentage || 0),
        timestamp: date,
        durationMinutes: history.durationMinutes || 0
      };
      
      this.batteryDataByDate[dateStr].push(dataPoint);
    });
    
    console.log('📊 Battery data processed by date:', this.batteryDataByDate);
  }

  // ==================== UTILITY METHODS ====================

  private formatDateForComparison(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatDateForDisplay(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return this.formatDateForComparison(date1) === this.formatDateForComparison(date2);
  }

  // Get correct position
  getCorrectPosition(position: string): string {
    return this.positionMapping[position] || position;
  }

  // Get speaker color for border
  getSpeakerColor(index: number): { name: string; color: string } {
    const colors = [
      { name: 'Yellow', color: '#ffc107' },
      { name: 'Red', color: '#dc3545' },
      { name: 'Purple', color: '#8b5cf6' },
      { name: 'Green', color: '#32cd32' },
      { name: 'Blue', color: '#007bff' },
      { name: 'Orange', color: '#fd7e14' },
      { name: 'Pink', color: '#e83e8c' },
      { name: 'Cyan', color: '#17a2b8' }
    ];
    return colors[index % colors.length];
  }

  // ==================== DATA VIEW CONTROL METHODS ====================

  clearDataView() {
    this.activeDataView = null;
    this.selectedSpeaker = null;
    this.error = '';
    // Limpiar también filtros de batería
    this.showBatteryCalendar = false;
    this.selectedBatteryDate = null;
    this.batteryDateFilter = null;
  }

  showCreateForm() {
    this.createForm = {
      name: '',
      position: '',
      state: false,
      batteryPercentage: 100
    };
    this.activeDataView = 'create';
    this.selectedSpeaker = null;
    this.error = '';
    console.log('📝 Showing create form');
  }

  showEditData(speaker: Speaker) {
    this.selectedSpeaker = { ...speaker };
    this.editForm = {
      name: speaker.name,
      position: speaker.position,
      state: Boolean(speaker.state),
      batteryPercentage: Number(speaker.batteryPercentage)
    };
    this.activeDataView = 'edit';
    this.error = '';
    console.log('📝 Showing edit data for speaker:', speaker);
  }

  // MODIFICADO: Cargar datos reales de batería
  async showBatteryData(speaker: Speaker) {
    this.selectedSpeaker = speaker;
    this.activeDataView = 'battery';
    this.error = '';
    
    // Cargar datos reales de batería
    await this.loadSpeakerBatteryData(speaker.id);
    
    // Generar calendario con datos reales
    this.generateBatteryCalendar();
    this.updateBatteryChart();
    
    console.log('🔋 Showing battery data for speaker:', speaker);
  }

  showToggleData(speaker: Speaker) {
    this.selectedSpeaker = speaker;
    this.activeDataView = 'toggle';
    this.error = '';
    console.log('🔒 Showing toggle data for speaker:', speaker);
  }

  showDeleteData(speaker: Speaker) {
    this.selectedSpeaker = speaker;
    this.activeDataView = 'delete';
    this.error = '';
    console.log('🗑️ Showing delete data for speaker:', speaker);
  }

  // ==================== SPEAKER CRUD METHODS ====================

  createSpeaker() {
    if (!this.isCreateFormValid()) {
      this.error = 'Please fill in all required fields';
      return;
    }

    if (!this.speakersService.hasAccessToken()) {
      this.error = 'Authentication required. Please log in again.';
      return;
    }

    console.log('📝 Creating speaker with form data:', this.createForm);

    this.loading = true;
    this.error = '';

    const speakerData = {
      name: this.createForm.name.trim(),
      position: this.createForm.position,
      state: Boolean(this.createForm.state),
      batteryPercentage: Number(this.createForm.batteryPercentage)
    };

    this.speakersService.createSpeaker(speakerData).subscribe({
      next: (response) => {
        console.log('✅ Speaker created successfully:', response);
        this.clearDataView();
        this.loading = false;
        this.loadSpeakers();
      },
      error: (error) => {
        console.error('❌ Error creating speaker:', error);
        
        if (error.status === 401) {
          this.error = 'Authentication expired. Please log in again.';
        } else if (error.status === 403) {
          this.error = 'You do not have permission to create speakers.';
        } else {
          this.error = error.error?.message || error.message || 'Error creating speaker. Please try again.';
        }
        
        this.loading = false;
      }
    });
  }

  isCreateFormValid(): boolean {
    return !!(
      this.createForm.name?.trim() &&
      this.createForm.position &&
      this.createForm.batteryPercentage >= 0 &&
      this.createForm.batteryPercentage <= 100
    );
  }

  updateSpeaker() {
    if (!this.selectedSpeaker || !this.isEditFormValid()) {
      this.error = 'Please fill in all required fields';
      return;
    }

    if (!this.speakersService.hasAccessToken()) {
      this.error = 'Authentication required. Please log in again.';
      return;
    }

    console.log('🔄 Updating speaker with data:', this.editForm);

    this.loading = true;
    this.error = '';

    const updateData: any = {};
    
    if (this.editForm.name?.trim() && this.editForm.name.trim() !== this.selectedSpeaker.name) {
      updateData.name = this.editForm.name.trim();
    }
    
    if (this.editForm.position && this.editForm.position !== this.selectedSpeaker.position) {
      updateData.position = this.editForm.position;
    }
    
    if (this.editForm.state !== this.selectedSpeaker.state) {
      updateData.state = Boolean(this.editForm.state);
    }
    
    if (Number(this.editForm.batteryPercentage) !== Number(this.selectedSpeaker.batteryPercentage)) {
      updateData.batteryPercentage = Number(this.editForm.batteryPercentage);
    }

    console.log('🔄 Final update data:', updateData);

    // If no changes, show message
    if (Object.keys(updateData).length === 0) {
      this.error = 'No changes detected';
      this.loading = false;
      return;
    }

    this.speakersService.updateSpeaker(this.selectedSpeaker.id, updateData).subscribe({
      next: (response) => {
        console.log('✅ Speaker updated successfully:', response);
        this.clearDataView();
        this.loading = false;
        this.loadSpeakers();
      },
      error: (error) => {
        console.error('❌ Error updating speaker:', error);
        
        if (error.status === 401) {
          this.error = 'Authentication expired. Please log in again.';
        } else if (error.status === 403) {
          this.error = 'You do not have permission to update speakers.';
        } else {
          this.error = error.error?.message || error.message || 'Error updating speaker. Please try again.';
        }
        
        this.loading = false;
      }
    });
  }

  isEditFormValid(): boolean {
    return !!(
      this.editForm.name?.trim() &&
      this.editForm.position &&
      this.editForm.batteryPercentage >= 0 &&
      this.editForm.batteryPercentage <= 100
    );
  }

  confirmDelete() {
    if (!this.selectedSpeaker) {
      return;
    }

    if (!this.speakersService.hasAccessToken()) {
      this.error = 'Authentication required. Please log in again.';
      return;
    }

    console.log('🗑️ Confirming deletion of speaker:', this.selectedSpeaker.id);

    this.loading = true;
    this.error = '';

    this.speakersService.deleteSpeaker(this.selectedSpeaker.id).subscribe({
      next: (response) => {
        console.log('✅ Speaker deleted successfully:', response);
        this.clearDataView();
        this.loading = false;
        this.loadSpeakers();
      },
      error: (error) => {
        console.error('❌ Error deleting speaker:', error);
        
        if (error.status === 401) {
          this.error = 'Authentication expired. Please log in again.';
        } else if (error.status === 403) {
          this.error = 'You do not have permission to delete speakers.';
        } else if (error.status === 400) {
          this.error = 'Cannot delete speaker with active sessions.';
        } else {
          this.error = error.error?.message || error.message || 'Error deleting speaker. Please try again.';
        }
        
        this.loading = false;
      }
    });
  }

  toggleSpeaker(speaker: Speaker) {
    const newState = !speaker.state;
    
    this.speakersService.updateSpeaker(speaker.id, { state: newState }).subscribe({
      next: (response) => {
        const index = this.speakers.findIndex(s => s.id === speaker.id);
        if (index !== -1) {
          this.speakers[index].state = newState;
        }
        
        if (this.selectedSpeaker && this.selectedSpeaker.id === speaker.id) {
          this.selectedSpeaker.state = newState;
        }
        
        console.log('✅ Speaker state updated successfully');
      },
      error: (error) => {
        console.error('❌ Error updating speaker state:', error);
        this.error = 'Error updating speaker status';
      }
    });
  }

  // ==================== BATTERY METHODS ====================

  getBatteryStatusText(percentage: number): string {
    if (percentage > 60) return 'Excellent';
    if (percentage > 30) return 'Good';
    if (percentage > 10) return 'Low';
    return 'Critical';
  }

  getBatteryStatus(percentage: number): string {
    if (percentage > 60) return 'high';
    if (percentage > 30) return 'medium';
    if (percentage > 10) return 'low';
    return 'critical';
  }

  getBatteryClass(percentage: number): string {
    const status = this.getBatteryStatus(percentage);
    switch (status) {
      case 'high': return 'battery-high';
      case 'medium': return 'battery-medium';
      case 'low': 
      case 'critical': 
      default: return 'battery-low';
    }
  }

  percentageToVoltage(percentage: number): number {
    // Conversión no lineal más realista
    if (percentage >= 90) return 7.4 - (100 - percentage) * 0.02; // 7.4v - 7.2v
    if (percentage >= 70) return 7.2 - (90 - percentage) * 0.025; // 7.2v - 6.7v
    if (percentage >= 50) return 6.7 - (70 - percentage) * 0.03; // 6.7v - 6.1v
    if (percentage >= 30) return 6.1 - (50 - percentage) * 0.035; // 6.1v - 5.4v
    if (percentage >= 10) return 5.4 - (30 - percentage) * 0.04; // 5.4v - 4.6v
    return 4.6 - (10 - percentage) * 0.46; // 4.6v - 0v
  }

  getCurrentVoltage(percentage: number): string {
    return this.percentageToVoltage(percentage).toFixed(1);
  }

  getEstimatedBatteryTime(percentage: number): string {
    // MEJORADO: Usar datos reales si están disponibles
    if (this.speakerBatteryHistory.length > 0) {
      // Calcular tiempo promedio basado en consumo real
      const avgConsumption = this.speakerBatteryHistory.reduce((sum, item) => 
        sum + (item.batteryConsumed || 0), 0) / this.speakerBatteryHistory.length;
      
      if (avgConsumption > 0) {
        const estimatedHours = (percentage / avgConsumption) * 
          (this.speakerBatteryHistory.reduce((sum, item) => 
            sum + (item.durationMinutes || 0), 0) / this.speakerBatteryHistory.length / 60);
        
        if (estimatedHours >= 1) {
          return `~${Math.round(estimatedHours)} hours`;
        } else {
          return `~${Math.round(estimatedHours * 60)} minutes`;
        }
      }
    }
    
    // Fallback a estimación básica
    if (percentage > 80) return '8+ hours';
    if (percentage > 60) return '6-8 hours';
    if (percentage > 40) return '4-6 hours';
    if (percentage > 20) return '2-4 hours';
    if (percentage > 10) return '1-2 hours';
    return 'Less than 1 hour';
  }

  getAverageVoltage(): string {
    if (!this.selectedSpeaker) return '0.0';
    
    // Si hay datos reales de batería, calcular promedio real
    if (this.speakerBatteryHistory.length > 0) {
      const validVoltages = this.speakerBatteryHistory
        .map(item => item.avgVoltage_V)
        .filter(voltage => voltage && voltage > 0);
      
      if (validVoltages.length > 0) {
        const average = validVoltages.reduce((sum, voltage) => sum + voltage, 0) / validVoltages.length;
        return average.toFixed(1);
      }
    }
    
    // Fallback a estimación basada en porcentaje actual
    const current = this.percentageToVoltage(this.selectedSpeaker.batteryPercentage);
    const average = current + (Math.random() - 0.5) * 0.5;
    return Math.max(0, Math.min(7.4, average)).toFixed(1);
  }

  getBatteryStats(): any {
    if (this.speakerBatteryHistory.length === 0) {
      return {
        totalSessions: 0,
        avgConsumption: 0,
        avgDuration: 0,
        totalDuration: 0,
        avgVoltage: 0
      };
    }
    
    const totalSessions = this.speakerBatteryHistory.length;
    const avgConsumption = this.speakerBatteryHistory.reduce((sum, item) => 
      sum + (item.batteryConsumed || 0), 0) / totalSessions;
    const avgDuration = this.speakerBatteryHistory.reduce((sum, item) => 
      sum + (item.durationMinutes || 0), 0) / totalSessions;
    const totalDuration = this.speakerBatteryHistory.reduce((sum, item) => 
      sum + (item.durationMinutes || 0), 0);
    const validVoltages = this.speakerBatteryHistory
      .map(item => item.avgVoltage_V)
      .filter(voltage => voltage && voltage > 0);
    const avgVoltage = validVoltages.length > 0 ? 
      validVoltages.reduce((sum, voltage) => sum + voltage, 0) / validVoltages.length : 0;
    
    return {
      totalSessions,
      avgConsumption: Math.round(avgConsumption * 100) / 100,
      avgDuration: Math.round(avgDuration),
      totalDuration: Math.round(totalDuration),
      avgVoltage: Math.round(avgVoltage * 100) / 100
    };
  }

  get hasBatteryData(): boolean {
    return this.speakerBatteryHistory.length > 0;
  }

  get batteryDataStatus(): string {
    if (this.loadingBatteryData) {
      return 'Loading battery data...';
    }
    
    if (this.speakerBatteryHistory.length === 0) {
      return 'No battery data available';
    }
    
    return `${this.speakerBatteryHistory.length} records loaded`;
  }

  // ==================== BATTERY CALENDAR METHODS ====================

  generateBatteryCalendar(): void {
    const year = this.currentBatteryCalendarDate.getFullYear();
    const month = this.currentBatteryCalendarDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.batteryCalendarDays = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = this.isSameDate(currentDate, today);
      const isSelected = this.selectedBatteryDate ? this.isSameDate(currentDate, this.selectedBatteryDate) : false;
      
      this.batteryCalendarDays.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        hasBatteryData: false,
        dataCount: 0
      });
    }
    
    this.updateBatteryCalendarWithData();
  }

  updateBatteryCalendarWithData(): void {
    this.batteryCalendarDays.forEach(day => {
      const dayDateStr = this.formatDateForComparison(day.date);
      const batteryDataForDay = this.batteryDataByDate[dayDateStr] || [];
      
      day.hasBatteryData = batteryDataForDay.length > 0;
      day.dataCount = batteryDataForDay.length;
    });
  }

  selectBatteryDate(day: CalendarDay): void {
    if (!day.isCurrentMonth) return;
    
    if (this.selectedBatteryDate && this.isSameDate(day.date, this.selectedBatteryDate)) {
      this.selectedBatteryDate = null;
      this.batteryDateFilter = null;
    } else {
      this.selectedBatteryDate = new Date(day.date);
      this.batteryDateFilter = this.formatDateForDisplay(this.selectedBatteryDate);
    }
    
    this.generateBatteryCalendar();
    this.updateBatteryChart();
  }

  previousBatteryMonth(): void {
    this.currentBatteryCalendarDate.setMonth(this.currentBatteryCalendarDate.getMonth() - 1);
    this.currentBatteryCalendarDate = new Date(this.currentBatteryCalendarDate);
    this.generateBatteryCalendar();
  }

  nextBatteryMonth(): void {
    this.currentBatteryCalendarDate.setMonth(this.currentBatteryCalendarDate.getMonth() + 1);
    this.currentBatteryCalendarDate = new Date(this.currentBatteryCalendarDate);
    this.generateBatteryCalendar();
  }

  toggleBatteryCalendar(): void {
    this.showBatteryCalendar = !this.showBatteryCalendar;
  }

  clearBatteryDateFilter(): void {
    this.selectedBatteryDate = null;
    this.batteryDateFilter = null;
    this.generateBatteryCalendar();
    this.updateBatteryChart();
  }

  get currentBatteryMonthYear(): string {
    return `${this.monthNames[this.currentBatteryCalendarDate.getMonth()]} ${this.currentBatteryCalendarDate.getFullYear()}`;
  }

  // ==================== BATTERY CHART METHODS ====================

  initializeBatteryChart() {
    this.generateGridLines();
    this.updateBatteryChart();
  }

  generateGridLines() {
    this.gridLines = [];
    
    // Horizontal grid lines (voltage levels)
    for (let i = 0; i <= 8; i++) {
      const y = (i / 8) * 300;
      this.gridLines.push({
        x1: 0, y1: y, x2: 800, y2: y
      });
    }
    
    // Vertical grid lines (time intervals)
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * 800;
      this.gridLines.push({
        x1: x, y1: 0, x2: x, y2: 300
      });
    }
  }

  updateBatteryChart() {
    const data = this.generateBatteryData();
    this.generateChartPath(data);
    this.generateTimeLabels();
  }

  generateBatteryData(): { voltage: number; time: number }[] {
    // Si hay una fecha seleccionada, usar datos de esa fecha
    if (this.selectedBatteryDate) {
      return this.generateDataForSelectedDate();
    }
    
    // Si no hay fecha seleccionada, usar datos recientes según el filtro de tiempo
    return this.generateDataForTimeFilter();
  }

  generateDataForSelectedDate(): { voltage: number; time: number }[] {
    const selectedDateStr = this.formatDateForComparison(this.selectedBatteryDate!);
    const batteryDataForDay = this.batteryDataByDate[selectedDateStr] || [];
    
    if (batteryDataForDay.length === 0) {
      return this.generateFallbackData();
    }
    
    batteryDataForDay.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const data: { voltage: number; time: number }[] = [];
    
    batteryDataForDay.forEach((dataPoint, index) => {
      const voltage = dataPoint.voltage || this.percentageToVoltage(dataPoint.initialBattery);
      
      data.push({
        voltage: voltage,
        time: index
      });
      
      if (dataPoint.finalBattery !== dataPoint.initialBattery) {
        const finalVoltage = this.percentageToVoltage(dataPoint.finalBattery);
        data.push({
          voltage: finalVoltage,
          time: index + 0.5
        });
      }
    });
    
    console.log(`📊 Generated ${data.length} data points for ${selectedDateStr}`);
    return data;
  }

  generateDataForTimeFilter(): { voltage: number; time: number }[] {
    const now = new Date();
    const data: { voltage: number; time: number }[] = [];
    
    let timeRange: number;
    let dataPoints: number;
    
    switch (this.batteryTimeFilter) {
      case 'hours':
        timeRange = 24;
        dataPoints = 24;
        break;
      case 'days':
        timeRange = 7;
        dataPoints = 7;
        break;
      case 'weeks':
        timeRange = 4;
        dataPoints = 4;
        break;
      default:
        return this.generateFallbackData();
    }
    
    const relevantData: BatteryDataPoint[] = [];
    
    for (let i = timeRange - 1; i >= 0; i--) {
      let targetDate: Date;
      
      if (this.batteryTimeFilter === 'hours') {
        targetDate = new Date(now.getTime() - (i * 60 * 60 * 1000));
      } else if (this.batteryTimeFilter === 'days') {
        targetDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      } else {
        targetDate = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
      }
      
      const dateStr = this.formatDateForComparison(targetDate);
      const dayData = this.batteryDataByDate[dateStr] || [];
      
      if (dayData.length > 0) {
        const avgVoltage = dayData.reduce((sum, point) => 
          sum + (point.voltage || this.percentageToVoltage(point.initialBattery)), 0) / dayData.length;
        
        relevantData.push({
          date: dateStr,
          initialBattery: dayData[0].initialBattery,
          finalBattery: dayData[dayData.length - 1].finalBattery,
          voltage: avgVoltage,
          timestamp: targetDate,
          durationMinutes: dayData.reduce((sum, point) => sum + point.durationMinutes, 0)
        });
      }
    }
    
    if (relevantData.length === 0) {
      return this.generateFallbackData();
    }
    
    for (let i = 0; i < dataPoints; i++) {
      if (i < relevantData.length) {
        data.push({
          voltage: relevantData[i].voltage,
          time: i
        });
      } else {
        const lastVoltage = relevantData[relevantData.length - 1]?.voltage || 7.4;
        const estimatedVoltage = Math.max(3.0, lastVoltage - (0.1 * (i - relevantData.length + 1)));
        
        data.push({
          voltage: estimatedVoltage,
          time: i
        });
      }
    }
    
    console.log(`📊 Generated ${data.length} data points for ${this.batteryTimeFilter} filter`);
    return data;
  }

  generateFallbackData(): { voltage: number; time: number }[] {
    const baseVoltage = this.selectedSpeaker ? 
      this.percentageToVoltage(this.selectedSpeaker.batteryPercentage) : 7.4;
    
    const dataPoints = this.batteryTimeFilter === 'hours' ? 24 : 
                      this.batteryTimeFilter === 'days' ? 7 : 4;
    
    const data: { voltage: number; time: number }[] = [];
    
    for (let i = 0; i < dataPoints; i++) {
      const timeRatio = i / (dataPoints - 1);
      const baseDegradation = baseVoltage * (1 - timeRatio * 0.3);
      const noise = (Math.random() - 0.5) * 0.4;
      const voltage = Math.max(0, Math.min(7.4, baseDegradation + noise));
      
      data.push({
        voltage: voltage,
        time: i
      });
    }
    
    console.log('📊 Generated fallback data (no real data available)');
    return data;
  }

  generateChartPath(data: { voltage: number; time: number }[]) {
    if (data.length === 0) return;
    
    this.batteryDataPoints = [];
    let pathData = '';
    
    data.forEach((point, index) => {
      const x = (point.time / (data.length - 1)) * 800;
      const y = (1 - (point.voltage / 7.4)) * 300;
      
      this.batteryDataPoints.push({ x, y, voltage: point.voltage });
      
      if (index === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    });
    
    this.batteryChartPath = pathData;
  }

  generateTimeLabels() {
    this.timeLabels = [];
    
    if (this.selectedBatteryDate) {
      for (let i = 0; i < 6; i++) {
        const hour = i * 4;
        this.timeLabels.push(hour.toString().padStart(2, '0') + ':00');
      }
      return;
    }
    
    if (this.batteryTimeFilter === 'hours') {
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const time = new Date(now.getTime() - (24 - i * 4) * 60 * 60 * 1000);
        this.timeLabels.push(time.getHours().toString().padStart(2, '0') + ':00');
      }
    } else if (this.batteryTimeFilter === 'days') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const today = new Date().getDay();
      for (let i = 0; i < 7; i++) {
        const dayIndex = (today - 6 + i + 7) % 7;
        this.timeLabels.push(days[dayIndex]);
      }
    } else {
      for (let i = 0; i < 4; i++) {
        this.timeLabels.push(`Week ${i + 1}`);
      }
    }
  }

  // ==================== SPEAKER HELPER METHODS ====================

  getTotalSessions(speaker: Speaker): number {
    return speaker._count?.usageSessions || 0;
  }

  getTotalHistories(speaker: Speaker): number {
    return speaker._count?.histories || 0;
  }

  hasActiveSession(speaker: Speaker): boolean {
    return speaker.usageSessions && speaker.usageSessions.length > 0;
  }

  getActiveSessionInfo(speaker: Speaker): any {
    if (this.hasActiveSession(speaker)) {
      return speaker.usageSessions[0];
    }
    return null;
  }

  // ==================== UTILITY AND FORMATTING METHODS ====================

  // MODIFICADO: Ahora acepta Date | string
  formatLastConnection(date: string | Date): string {
    let connectionDate: Date;
    
    if (date instanceof Date) {
      connectionDate = date;
    } else {
      connectionDate = new Date(date);
    }
    
    const now = new Date();
    const diffMs = now.getTime() - connectionDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'A few minutes ago';
    }
  }

  clearError() {
    this.error = '';
  }

  // ==================== AUTH AND NAVIGATION METHODS ====================

  logout() {
    const confirmLogout = confirm('¿Estás seguro de que quieres desconectarte?');
    
    if (confirmLogout) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('roleName');
      localStorage.removeItem('userSession');
      
      this.router.navigate([`${loginApi}`]).then(() => {
        console.log('Logged out successfully');
      });
    }
  }

  // ==================== COMPONENT LIFECYCLE ====================

  ngOnDestroy() {
    // Limpiar event listeners si es necesario
    document.removeEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.showBatteryCalendar) {
        this.showBatteryCalendar = false;
      }
    });
  }
}