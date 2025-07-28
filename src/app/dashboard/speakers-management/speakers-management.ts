// speakers-management.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpeakersService } from '../../services/speaker.service';

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

  // Modal control variables
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
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

  // Colores predefinidos para los speakers
  private speakerColors = [
    { name: 'Yellow', color: '#ffc107' },
    { name: 'Red', color: '#dc3545' },
    { name: 'Purple', color: '#8b5cf6' },
    { name: 'Green', color: '#32cd32' },
    { name: 'Blue', color: '#007bff' },
    { name: 'Orange', color: '#fd7e14' },
    { name: 'Pink', color: '#e83e8c' },
    { name: 'Cyan', color: '#17a2b8' }
  ];

  // Posiciones disponibles
  availablePositions = [
    'Top Left',
    'Top Center', 
    'Top Right',
    'Center Left',
    'Center',
    'Center Right',
    'Bottom Left',
    'Bottom Center',
    'Bottom Right'
  ];

  constructor(private speakersService: SpeakersService) {}

  ngOnInit() {
    this.loadSpeakers();
  }

  loadSpeakers() {
    this.loading = true;
    this.error = '';

    this.speakersService.getAllSpeakers().subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          this.speakers = response.data;
          console.log('✅ Speakers loaded:', this.speakers);
        } else {
          this.error = 'Error al cargar los speakers';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading speakers:', error);
        this.error = 'Error de conexión con el servidor';
        this.loading = false;
      }
    });
  }

  // CREATE SPEAKER MODAL METHODS
  openCreateModal() {
    this.createForm = {
      name: '',
      position: '',
      state: false,
      batteryPercentage: 100
    };
    this.showCreateModal = true;
    this.error = '';
    console.log('📝 Opening create speaker modal');
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.error = '';
  }

  createSpeaker() {
    if (!this.isCreateFormValid()) {
      this.error = 'Please fill in all required fields';
      return;
    }

    // 🔐 Verificar autenticación antes de crear
    if (!this.speakersService.hasaccessToken()) {
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
        this.closeCreateModal();
        this.loading = false;
        this.loadSpeakers(); // Recargar la lista
      },
      error: (error) => {
        console.error('❌ Error creating speaker:', error);
        
        // 🔐 Manejar errores de autenticación
        if (error.status === 401) {
          this.error = 'Authentication expired. Please log in again.';
          // Opcional: redirigir al login
          // this.router.navigate(['/login']);
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

  // EDIT SPEAKER MODAL METHODS
  openEditModal(speaker: Speaker) {
    this.selectedSpeaker = { ...speaker };
    this.editForm = {
      name: speaker.name,
      position: speaker.position,
      state: Boolean(speaker.state),
      batteryPercentage: Number(speaker.batteryPercentage)
    };
    this.showEditModal = true;
    this.error = '';
    console.log('📝 Editing speaker:', speaker);
    console.log('📝 Edit form initialized with:', this.editForm);
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedSpeaker = null;
    this.error = '';
  }

  updateSpeaker() {
    if (!this.selectedSpeaker || !this.isEditFormValid()) {
      this.error = 'Please fill in all required fields';
      return;
    }

    // 🔐 Verificar autenticación antes de actualizar
    if (!this.speakersService.hasaccessToken()) {
      this.error = 'Authentication required. Please log in again.';
      return;
    }

    console.log('🔄 Updating speaker with data:', this.editForm);

    this.loading = true;
    this.error = '';

    const updateData: any = {};
    
    // Solo incluir campos que han cambiado
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

    // Si no hay cambios, mostrar mensaje
    if (Object.keys(updateData).length === 0) {
      this.error = 'No changes detected';
      this.loading = false;
      return;
    }

    this.speakersService.updateSpeaker(this.selectedSpeaker.id, updateData).subscribe({
      next: (response) => {
        console.log('✅ Speaker updated successfully:', response);
        this.closeEditModal();
        this.loading = false;
        this.loadSpeakers(); // Recargar la lista
      },
      error: (error) => {
        console.error('❌ Error updating speaker:', error);
        
        // 🔐 Manejar errores de autenticación
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

  // DELETE SPEAKER MODAL METHODS
  openDeleteModal(speaker: Speaker) {
    this.selectedSpeaker = speaker;
    this.showDeleteModal = true;
    this.error = '';
    console.log('🗑️ Preparing to delete speaker:', speaker);
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedSpeaker = null;
    this.error = '';
  }

  confirmDelete() {
    if (!this.selectedSpeaker) {
      return;
    }

    // 🔐 Verificar autenticación antes de eliminar
    if (!this.speakersService.hasaccessToken()) {
      this.error = 'Authentication required. Please log in again.';
      return;
    }

    console.log('🗑️ Confirming deletion of speaker:', this.selectedSpeaker.id);

    this.loading = true;
    this.error = '';

    this.speakersService.deleteSpeaker(this.selectedSpeaker.id).subscribe({
      next: (response) => {
        console.log('✅ Speaker deleted successfully:', response);
        this.closeDeleteModal();
        this.loading = false;
        this.loadSpeakers(); // Recargar la lista
      },
      error: (error) => {
        console.error('❌ Error deleting speaker:', error);
        
        // 🔐 Manejar errores de autenticación
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

  // UTILITY METHODS
  getSpeakerColor(index: number): { name: string; color: string } {
    return this.speakerColors[index % this.speakerColors.length];
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

  formatLastConnection(date: string): string {
    const connectionDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - connectionDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} día${diffDays > 1 ? 's' : ''} atrás`;
    } else if (diffHours > 0) {
      return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    } else {
      return 'Hace unos minutos';
    }
  }

  // Alternar estado del speaker (método existente mejorado)
  toggleSpeaker(speaker: Speaker) {
    const newState = !speaker.state;
    
    this.speakersService.updateSpeaker(speaker.id, { state: newState }).subscribe({
      next: (response) => {
        // Actualizar el speaker en la lista local
        const index = this.speakers.findIndex(s => s.id === speaker.id);
        if (index !== -1) {
          this.speakers[index].state = newState;
        }
        console.log('✅ Speaker state updated successfully');
      },
      error: (error) => {
        console.error('❌ Error updating speaker state:', error);
        this.error = 'Error al actualizar el estado del speaker';
      }
    });
  }

  // Método para desconectar/logout
  logout() {
    console.log('Logout');
    // Implementar lógica de logout
  }

  // Obtener el total de sesiones de uso de un speaker
  getTotalSessions(speaker: Speaker): number {
    return speaker._count?.usageSessions || 0;
  }

  // Obtener el total de historiales de un speaker
  getTotalHistories(speaker: Speaker): number {
    return speaker._count?.histories || 0;
  }

  // Verificar si un speaker tiene sesión activa
  hasActiveSession(speaker: Speaker): boolean {
    return speaker.usageSessions && speaker.usageSessions.length > 0;
  }

  // Obtener información de la sesión activa
  getActiveSessionInfo(speaker: Speaker): any {
    if (this.hasActiveSession(speaker)) {
      return speaker.usageSessions[0];
    }
    return null;
  }

  // Método para limpiar errores
  clearError() {
    this.error = '';
  }
}