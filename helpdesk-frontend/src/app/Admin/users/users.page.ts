import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { addIcons } from 'ionicons';
import {
  menuOutline, searchOutline, peopleOutline, shieldCheckmarkOutline, constructOutline,
  personOutline, addOutline, createOutline, trashOutline, chevronBackOutline,
  chevronForwardOutline, closeOutline, saveOutline
} from 'ionicons/icons';

import { UserService } from '../../services/user.service';
import { DepartemenService } from '../../services/departemen.services';
import { KaryawanService, AvailableKaryawan } from '../../services/karyawan.service';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

export interface User {
  id_user?: number;
  id?: number;
  username: string;
  nama: string;
  departemen: string;
  level: string;
  status?: string;
  nik?: string;
  password?: string;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SidebarComponent],
})
export class UsersPage implements OnInit {
  isSidebarOpen = false;
  activeMenu = 'user';

  userList: User[] = [];
  departemenMasterList: any[] = [];
  availableKaryawan: AvailableKaryawan[] = [];

  get totalUsers() { return this.userList.length; }
  get totalAdmin() { return this.userList.filter(u => u.level && u.level.toLowerCase() === 'admin').length; }
  get totalTeknisi() { return this.userList.filter(u => u.level && u.level.toLowerCase() === 'teknisi').length; }
  get totalUsersLevel() { return this.userList.filter(u => u.level && u.level.toLowerCase() === 'users').length; }

  searchTerm = '';
  filterLevel = '';
  filterDepartemen = '';
  levelOptions: string[] = ['Admin', 'Teknisi', 'Users'];

  get departemenOptions(): string[] {
    const fromMaster = this.departemenMasterList.map(d => d.nama_departemen || d.namaDepartemen);
    const fromUsers = this.userList.map(u => u.departemen);
    return [...new Set([...fromMaster, ...fromUsers])].filter(Boolean);
  }

  currentPage = 1;
  pageSize = 10;

  isModalOpen = false;
  isEditing = false;
  selectedId: number | null = null;
  formData: any = {
    nik: '',
    username: '',
    nama: '',
    departemen: '',
    level: 'Users',
    password: '',
  };

  constructor(
    private router: Router,
    private userService: UserService,
    private departemenService: DepartemenService,
    private karyawanService: KaryawanService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      menuOutline, searchOutline, peopleOutline, shieldCheckmarkOutline, constructOutline,
      personOutline, addOutline, createOutline, trashOutline, chevronBackOutline,
      chevronForwardOutline, closeOutline, saveOutline
    });
  }

  ngOnInit() {
    this.loadUsers();
    this.loadDepartemenMaster();
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (res: any) => {
        if (res?.success || Array.isArray(res?.data) || Array.isArray(res)) {
          const rawData = res.success ? res.data : (res.data || res);
          this.userList = rawData.map((u: any) => ({
            ...u,
            id: u.id_user || u.id
          }));
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error('Gagal memuat data user:', err);
        if (err.status === 403 || err.status === 401) {
          this.showToast('Akses ditolak. Pastikan Anda login sebagai Admin!', 'danger');
        }
      }
    });
  }

  loadDepartemenMaster() {
    this.departemenService.getAll().subscribe({
      next: (res: any) => {
        this.departemenMasterList = Array.isArray(res) ? res : (res?.data || []);
      },
      error: (err) => console.error('Gagal memuat master departemen untuk user:', err)
    });
  }

  loadAvailableKaryawan() {
    this.karyawanService.getAvailable().subscribe({
      next: (data) => {
        this.availableKaryawan = data;
      },
      error: (err) => console.error('Gagal memuat daftar karyawan tersedia:', err)
    });
  }

  onNikChange() {
    const selected = this.availableKaryawan.find(k => k.nik === this.formData.nik);
    if (selected) {
      this.formData.nama = selected.nama;
      this.formData.departemen = selected.departemen;
      this.formData.username = selected.nik;
    } else {
      this.formData.nama = '';
      this.formData.departemen = '';
      this.formData.username = '';
    }
  }

  get filteredUsers(): User[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.userList.filter((u) => {
      const matchSearch = !term || (u.nama && u.nama.toLowerCase().includes(term)) || (u.username && u.username.toLowerCase().includes(term));
      const matchLevel = !this.filterLevel || u.level === this.filterLevel;
      const matchDept = !this.filterDepartemen || u.departemen === this.filterDepartemen;
      return matchSearch && matchLevel && matchDept;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
  }
  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  get pagedUsers(): User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  onFilterChange() { this.currentPage = 1; }
  goToPage(page: number) { this.currentPage = page; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

  openTambahModal() {
    this.isEditing = false;
    this.selectedId = null;
    this.formData = {
      nik: '',
      username: '',
      nama: '',
      departemen: '',
      level: 'Users',
      password: ''
    };
    this.loadDepartemenMaster();
    this.loadAvailableKaryawan();
    this.isModalOpen = true;
  }

  openEditModal(u: User) {
    this.isEditing = true;
    this.selectedId = u.id_user || u.id || null;
    this.formData = { ...u, password: '' };
    this.loadDepartemenMaster();
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  simpanUser() {
    if (this.isEditing && this.selectedId !== null) {
      this.userService.updateUser(this.selectedId, this.formData).subscribe({
        next: () => {
          this.showToast('Data user berhasil diperbarui!', 'success');
          this.closeModal();
          this.loadUsers();
        },
        error: (err: HttpErrorResponse) => this.showToast('Gagal memperbarui: ' + (err.error?.message || err.message), 'danger')
      });
    } else {
      if (!this.formData.nik) {
        this.showToast('Silakan pilih NIK Karyawan terlebih dahulu!', 'warning');
        return;
      }
      this.userService.createUser(this.formData).subscribe({
        next: () => {
          this.showToast('User berhasil ditambahkan!', 'success');
          this.closeModal();
          this.loadUsers();
        },
        error: (err: HttpErrorResponse) => this.showToast('Gagal menambah user: ' + (err.error?.message || err.message), 'danger')
      });
    }
  }

  // 🔥 Menggunakan Light Mode Alert & Menghapus String HTML Mentah
  async hapusUser(u: User) {
    const targetId = u.id_user || u.id;
    if (!targetId) return;

    const alertEl = await this.alertCtrl.create({
      header: 'Konfirmasi Hapus',
      message: `Apakah Anda yakin ingin menghapus user ${u.username}? Action ini tidak dapat dibatalkan.`,
      cssClass: 'custom-alert-light',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
          cssClass: 'alert-btn-cancel'
        },
        {
          text: 'Hapus',
          role: 'confirm',
          cssClass: 'alert-btn-danger',
          handler: () => {
            this.userService.deleteUser(targetId).subscribe({
              next: () => {
                this.showToast('User berhasil dihapus!', 'success');
                this.loadUsers();
              },
              error: (err: HttpErrorResponse) => this.showToast('Gagal menghapus: ' + (err.error?.message || err.message), 'danger')
            });
          }
        }
      ]
    });

    await alertEl.present();
  }

  getLevelClass(level: string): string {
    if (!level) return 'level-default';
    const l = level.toLowerCase();
    if (l === 'admin') return 'level-admin';
    if (l === 'teknisi') return 'level-teknisi';
    return 'level-users';
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  setActiveMenu(menu: string) {
    this.activeMenu = menu;
    if (window.innerWidth < 1024) this.isSidebarOpen = false;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
