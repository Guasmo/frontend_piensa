import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './users-management.html',
  styleUrl: './users-management.css'
})
export class UsersManagementComponent {
  
  // Sample data para mostrar la interfaz
  users = [
    {
      id: '1',
      username: 'john.smith',
      email: 'john.smith@test.com',
      firstName: 'John',
      lastName: 'Smith',
      role: 'Administrator',
      phone: '+1234567890',
      isActive: true,
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      username: 'maria.garcia',
      email: 'maria.garcia@test.com',
      firstName: 'Maria',
      lastName: 'Garcia',
      role: 'User',
      phone: '+1234567891',
      isActive: true,
      createdAt: new Date('2024-02-20')
    },
    {
      id: '3',
      username: 'carlos.rodriguez',
      email: 'carlos.rodriguez@test.com',
      firstName: 'Carlos',
      lastName: 'Rodriguez',
      role: 'User',
      phone: '+1234567892',
      isActive: false,
      createdAt: new Date('2024-03-10')
    },
    {
      id: '4',
      username: 'ana.lopez',
      email: 'ana.lopez@test.com',
      firstName: 'Ana',
      lastName: 'Lopez',
      role: 'User',
      phone: '+1234567893',
      isActive: true,
      createdAt: new Date('2024-04-05')
    }
  ];

  loading = false;

  // Modal control variables
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedUser: any = null;

  // Form data
  createForm = {
    username: '',
    email: '',
    password: '',
    role: ''
  };

  editForm = {
    username: '',
    email: '',
    role: '',
    isActive: true
  };

  constructor(
    private router: Router,
    private location: Location
  ) {}

  // Métodos básicos para navegación
  goBack() {
    this.router.navigate(['/dashboard']);
  }

  logout() {
    console.log('Logout clicked');
    // Aquí puedes agregar tu lógica de logout
  }

  // Create User Modal Methods
  openCreateModal() {
    this.createForm = {
      username: '',
      email: '',
      password: '',
      role: ''
    };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  createUser() {
    if (!this.isCreateFormValid()) {
      return;
    }

    // Generate new user ID
    const newId = (this.users.length + 1).toString();
    
    const newUser = {
      id: newId,
      username: this.createForm.username,
      email: this.createForm.email,
      firstName: this.createForm.username, // Use username as firstName for display
      lastName: '', // Empty lastName
      role: this.createForm.role,
      phone: '', // Empty phone
      isActive: true,
      createdAt: new Date()
    };

    this.users.push(newUser);
    this.closeCreateModal();
    console.log('User created successfully:', newUser);
  }

  isCreateFormValid(): boolean {
    return !!(
      this.createForm.username &&
      this.createForm.email &&
      this.createForm.password &&
      this.createForm.role
    );
  }

  // Edit User Modal Methods
  editUser(user: any) {
    this.selectedUser = { ...user };
    this.editForm = {
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedUser = null;
  }

  updateUser() {
    if (!this.selectedUser || !this.isEditFormValid()) {
      return;
    }

    const index = this.users.findIndex(u => u.id === this.selectedUser.id);
    if (index !== -1) {
      this.users[index] = {
        ...this.users[index],
        username: this.editForm.username,
        email: this.editForm.email,
        role: this.editForm.role,
        isActive: this.editForm.isActive
      };
    }

    this.closeEditModal();
    console.log('User updated successfully');
  }

  isEditFormValid(): boolean {
    return !!(
      this.editForm.username &&
      this.editForm.email &&
      this.editForm.role
    );
  }

  // Delete User Modal Methods
  deleteUser(user: any) {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  confirmDelete() {
    if (!this.selectedUser) {
      return;
    }

    const index = this.users.findIndex(u => u.id === this.selectedUser.id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }

    this.closeDeleteModal();
    console.log('User deleted successfully');
  }

  // Toggle User Status (existing method)
  toggleUser(user: any) {
    console.log('Toggle user:', user);
    user.isActive = !user.isActive;
  }

  // Método utilitario para obtener avatar
  getUserAvatar(user: any): string {
    return (user.firstName || user.username).charAt(0).toUpperCase();
  }
}