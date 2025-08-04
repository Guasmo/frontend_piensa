import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Navbar } from '../../components/navbar/navbar';
import { SpeakersService } from '../../services/speaker.service';
import { HistoryItem } from '../../interfaces/speakerInterface';
import { CalendarDay, DisplayHistoryItem } from '../../interfaces/historyInterface';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, Navbar, HttpClientModule],
  templateUrl: './history.html',
  styleUrls: ['./history.css'],
  providers: [SpeakersService]
})
export class History implements OnInit {
  expandedIndex: number | null = null;
  username: string = 'John Doe';
  showLogoutButton: boolean = true;
  historyItems: DisplayHistoryItem[] = [];
  filteredHistoryItems: DisplayHistoryItem[] = [];
  loading = true;
  error: string | null = null;
  speakerIdFilter: number | null = null;

  // Calendar properties
  showCalendar = false;
  selectedDate: Date | null = null;
  currentCalendarDate = new Date();
  calendarDays: CalendarDay[] = [];
  dateFilter: string | null = null;

  // Calendar navigation
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  constructor(
    private router: Router,
    private speakersService: SpeakersService
  ) {}

  ngOnInit(): void {
    this.loadHistory();
    this.generateCalendar();
    
    // Listen for escape key to close calendar
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.showCalendar) {
        this.showCalendar = false;
      }
    });

    // 🔥 DEBUG: Debugging automático después de cargar
    setTimeout(() => {
      this.debugHistoryData();
    }, 3000);
  }

  // 🔥 MÉTODO CORREGIDO: Cargar historial completo o filtrado
  loadHistory(): void {
    this.loading = true;
    this.error = null;
    
    console.log('🔄 Cargando historial...');
    
    if (this.speakerIdFilter) {
      // Si hay filtro, cargar solo el historial de ese parlante
      this.loadSpeakerHistory(this.speakerIdFilter);
    } else {
      // Si no hay filtro, cargar todo el historial
      this.speakersService.getAllSpeakersHistory().subscribe({
        next: (histories: HistoryItem[]) => {
          console.log('📊 Historial completo recibido:', histories);
          console.log('📊 Cantidad de registros:', histories.length);
          
          // Debug del primer elemento para verificar transformación
          if (histories.length > 0) {
            console.log('🔍 Primer elemento transformado:', histories[0]);
          }
          
          this.historyItems = this.transformHistoryData(histories);
          this.applyFilters();
          this.updateCalendarWithHistory();
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error loading history:', error);
          this.error = 'Error al cargar el historial. Por favor, intenta de nuevo.';
          this.loading = false;
        }
      });
    }
  }

  // 🔥 MÉTODO CORREGIDO: Cargar historial de un parlante específico
  loadSpeakerHistory(speakerId: number): void {
    this.loading = true;
    this.error = null;

    console.log('📊 Cargando historial del parlante:', speakerId);

    this.speakersService.getSpeakerHistory(speakerId, 50, 1).subscribe({
      next: (response) => {
        console.log('📊 Historial del parlante recibido:', response);
        console.log('📊 Cantidad de registros:', response.data.histories.length);
        
        this.historyItems = this.transformHistoryData(response.data.histories);
        this.applyFilters();
        this.updateCalendarWithHistory();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading speaker history:', error);
        this.error = `Error al cargar el historial del parlante ID: ${speakerId}`;
        this.loading = false;
      }
    });
  }

  // 🔥 MÉTODO transformHistoryData SIMPLIFICADO
  private transformHistoryData(histories: HistoryItem[]): DisplayHistoryItem[] {
    return histories.map(history => {
      console.log('🔄 Transformando para display:', {
        id: history.id,
        speakerName: history.speakerName,
        avgCurrent: history.avgCurrent_mA,
        avgVoltage: history.avgVoltage_V,
        avgPower: history.avgPower_mW,
        totalConsumed: history.totalConsumed_mAh
      });
      
      const displayItem: DisplayHistoryItem = {
        id: history.id,
        usageSessionId: history.usageSessionId,
        speakerId: history.speakerId,
        speakerName: history.speakerName,
        speakerPosition: history.speakerPosition,
        userId: history.userId,
        username: history.user?.username || 'Usuario desconocido',
        startDate: this.formatTimestamp(history.startDate),
        endDate: this.formatTimestamp(history.endDate),
        durationMinutes: history.durationMinutes,
        
        // 🔥 USAR DIRECTAMENTE LOS VALORES YA TRANSFORMADOS POR EL SERVICE
        avgCurrent_mA: history.avgCurrent_mA,
        avgVoltage_V: history.avgVoltage_V,
        avgPower_mW: history.avgPower_mW,
        
        totalCurrent_mA: history.totalCurrent_mA,
        totalVoltage_V: history.totalVoltage_V,
        totalPower_mW: history.totalPower_mW,
        totalConsumed_mAh: history.totalConsumed_mAh,
        
        // Información de batería
        initialBatteryPercentage: history.initialBatteryPercentage,
        finalBatteryPercentage: history.finalBatteryPercentage,
        batteryConsumed: history.batteryConsumed,
        
        createdAt: this.formatTimestamp(history.createdAt),
        
        // Raw dates para filtrado
        rawStartDate: new Date(history.startDate),
        rawEndDate: new Date(history.endDate),
        rawCreatedAt: new Date(history.createdAt)
      };

      // Verificar que los valores numéricos estén correctos
      if (displayItem.avgCurrent_mA === 0 && displayItem.avgVoltage_V === 0 && displayItem.avgPower_mW === 0) {
        console.warn('⚠️ Todos los valores eléctricos son 0 para el item:', displayItem.id);
      }

      return displayItem;
    });
  }

  private formatTimestamp(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // 🔥 NUEVO: Aplicar todos los filtros
  private applyFilters(): void {
    let filtered = [...this.historyItems];

    // Apply speaker ID filter
    if (this.speakerIdFilter) {
      filtered = filtered.filter(item => item.speakerId === this.speakerIdFilter);
    }

    // Apply date filter
    if (this.selectedDate) {
      const selectedDateStr = this.formatDateForComparison(this.selectedDate);
      filtered = filtered.filter(item => {
        const itemDateStr = this.formatDateForComparison(item.rawStartDate);
        return itemDateStr === selectedDateStr;
      });
    }

    this.filteredHistoryItems = filtered;
    this.expandedIndex = null;
    
    console.log('🔍 Filtros aplicados:', {
      speakerIdFilter: this.speakerIdFilter,
      dateFilter: this.selectedDate,
      totalItems: this.historyItems.length,
      filteredItems: this.filteredHistoryItems.length
    });
  }

  // 🔥 NUEVO: Formatear fecha para comparación (YYYY-MM-DD)
  private formatDateForComparison(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // 🔥 MÉTODO MEJORADO: Manejar input del filtro de Speaker ID
  onFilterInput(event: any): void {
    const value = event.target.value;
    console.log('🔍 Valor del filtro Speaker ID:', value);
    
    if (!value || value === '' || Number(value) <= 0) {
      this.speakerIdFilter = null;
    } else {
      this.speakerIdFilter = Number(value);
    }
    
    this.applyFilters();
  }

  // 🔥 NUEVO: Generar calendario
  generateCalendar(): void {
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the beginning of the week
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks)
    this.calendarDays = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = this.isSameDate(currentDate, today);
      const isSelected = this.selectedDate ? this.isSameDate(currentDate, this.selectedDate) : false;
      
      this.calendarDays.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        hasHistory: false,
        historyCount: 0
      });
    }
    
    this.updateCalendarWithHistory();
  }

  // 🔥 NUEVO: Actualizar calendario con información de historial
  updateCalendarWithHistory(): void {
    this.calendarDays.forEach(day => {
      const dayDateStr = this.formatDateForComparison(day.date);
      const historyCount = this.historyItems.filter(item => {
        const itemDateStr = this.formatDateForComparison(item.rawStartDate);
        return itemDateStr === dayDateStr;
      }).length;
      
      day.hasHistory = historyCount > 0;
      day.historyCount = historyCount;
    });
  }

  // 🔥 NUEVO: Verificar si dos fechas son el mismo día
  private isSameDate(date1: Date, date2: Date): boolean {
    return this.formatDateForComparison(date1) === this.formatDateForComparison(date2);
  }

  // 🔥 NUEVO: Seleccionar fecha en el calendario
  selectDate(day: CalendarDay): void {
    if (!day.isCurrentMonth) return;
    
    if (this.selectedDate && this.isSameDate(day.date, this.selectedDate)) {
      // If clicking the same date, deselect it
      this.selectedDate = null;
      this.dateFilter = null;
    } else {
      // Select new date
      this.selectedDate = new Date(day.date);
      this.dateFilter = this.formatDateForDisplay(this.selectedDate);
    }
    
    this.generateCalendar(); // Regenerate to update selected state
    this.applyFilters();
  }

  // 🔥 NUEVO: Formatear fecha para mostrar
  private formatDateForDisplay(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // 🔥 NUEVO: Navegar calendario
  previousMonth(): void {
    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
    this.currentCalendarDate = new Date(this.currentCalendarDate);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
    this.currentCalendarDate = new Date(this.currentCalendarDate);
    this.generateCalendar();
  }

  // 🔥 NUEVO: Toggle calendar visibility
  toggleCalendar(): void {
    this.showCalendar = !this.showCalendar;
  }

  // 🔥 NUEVO: Limpiar filtro de fecha
  clearDateFilter(): void {
    this.selectedDate = null;
    this.dateFilter = null;
    this.generateCalendar();
    this.applyFilters();
  }

  // 🔥 MÉTODO MEJORADO: Limpiar todos los filtros
  clearAllFilters(): void {
    this.speakerIdFilter = null;
    this.selectedDate = null;
    this.dateFilter = null;
    this.generateCalendar();
    this.applyFilters();
  }

  toggleItem(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  // 🔥 MÉTODO MEJORADO: Refrescar historial
  refreshHistory(): void {
    console.log('🔄 Refrescando historial...');
    this.loadHistory();
  }

  loadMore(): void {
    console.log('Loading more data...');
    // TODO: Implementar paginación
  }

  // 🔥 NUEVO: Obtener nombre del mes actual del calendario
  get currentMonthYear(): string {
    return `${this.monthNames[this.currentCalendarDate.getMonth()]} ${this.currentCalendarDate.getFullYear()}`;
  }

  // 🔥 NUEVO: Verificar si hay filtros activos
  get hasActiveFilters(): boolean {
    return this.speakerIdFilter !== null || this.selectedDate !== null;
  }

  // 🔥 MÉTODO DE DEBUGGING PARA EL COMPONENTE
  debugHistoryData(): void {
    console.log('🔍 === DEBUG HISTORY COMPONENT ===');
    console.log('Total items cargados:', this.historyItems.length);
    console.log('Items filtrados:', this.filteredHistoryItems.length);
    console.log('Speaker ID filter:', this.speakerIdFilter);
    console.log('Date filter:', this.selectedDate);
    
    if (this.historyItems.length > 0) {
      console.log('Primer item:', this.historyItems[0]);
      console.log('Valores eléctricos del primer item:');
      console.log('  - avgCurrent_mA:', this.historyItems[0].avgCurrent_mA);
      console.log('  - avgVoltage_V:', this.historyItems[0].avgVoltage_V);
      console.log('  - avgPower_mW:', this.historyItems[0].avgPower_mW);
      console.log('  - totalConsumed_mAh:', this.historyItems[0].totalConsumed_mAh);
    }
    
    if (this.filteredHistoryItems.length > 0) {
      console.log('Primer item filtrado:', this.filteredHistoryItems[0]);
    }
    
    console.log('=====================================');
  }
}