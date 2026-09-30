import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController, AlertController, IonicSafeString } from '@ionic/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { addIcons } from 'ionicons';
import {
  menuOutline, addOutline, createOutline, trashOutline,
  chevronBackOutline, chevronForwardOutline, closeOutline,
  saveOutline, constructOutline
} from 'ionicons/icons';

import { TeknisiService } from 'src/app/services/teknisi.service';
import { UserService } from 'src/app/services/user.service';
import { Kategori, KategoriService } from 'src/app/services/kategori.service';
import { Teknisi } from 'src/app/models/teknisi.model';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

interface TeknisiFormData {
  nik: string;
  idKategori: number | null;
  status: string;
}

@Component({
  selector: 'app-teknisi',
  templateUrl: './teknisi.page.html',
  styleUrls: ['./teknisi.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SidebarComponent],
})
export class TeknisiPage implements OnInit {
  isSidebarOpen = false;
  activeMenu = 'teknisi';

  teknisiList: Teknisi[] = [];
  userList: any[] = [];
  kategoriList: Kategori[] = [];

  searchTerm = '';
  filterKategori = '';
  filterStatus = '';
  kategoriOptions: string[] = [];
  statusOptions: string[] = [];

  currentPage = 1;
  pageSize = 10;

  isModalOpen = false;
  isEditing = false;
  selectedId: string | null = null;
  editingNamaDisplay = '';
  formData: TeknisiFormData = {
    nik: '',
    idKategori: null,
    status: 'Aktif',
  };

  constructor(
    private router: Router,
    private teknisiService: TeknisiService,
    private userService: UserService,
    private kategoriService: KategoriService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      menuOutline, addOutline, createOutline, trashOutline,
      chevronBackOutline, chevronForwardOutline, closeOutline,
      saveOutline, constructOutline
    });
  }

  ngOnInit() {
    this.loadTeknisi();
    this.loadUsers();
    this.loadKategori();
  }

  /** Helper Toast Notification */
  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      cssClass: `custom-toast toast-${color}`,
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  private loadTeknisi() {
    this.teknisiService.getAll().subscribe({
      next: (res: any) => {
        this.teknisiList = res?.data ?? res ?? [];
        this.buildFilterOptions();
      },
      error: (err: HttpErrorResponse) => console.error('Gagal mengambil data teknisi:', err),
    });
  }

  private loadUsers() {
    this.userService.getUsers().subscribe({
      next: (res: any) => {
        this.userList = res?.data ?? res ?? [];
      },
      error: (err: HttpErrorResponse) => console.error('Gagal mengambil data user:', err),
    });
  }

  private loadKategori() {
    this.kategoriService.getAll().subscribe({
      next: (res: any) => {
        const rows = res?.data ?? res ?? [];
        // Normalisasi objek ke interface Kategori { id, nama }
        this.kategoriList = rows.map((k: any): Kategori => ({
          id: k.id ?? k.id_kategori,
          nama: k.nama ?? k.nama_kategori ?? ''
        }));
      },
      error: (err: HttpErrorResponse) => console.error('Gagal mengambil data kategori:', err),
    });
  }

  private buildFilterOptions() {
    this.kategoriOptions = [...new Set(this.teknisiList.map((t) => t.kategoriSpesialis).filter((v): v is string => !!v))];
    this.statusOptions = [...new Set(this.teknisiList.map((t) => t.status).filter((v): v is string => !!v))];
  }

  get filteredTeknisi(): Teknisi[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.teknisiList.filter((t) => {
      const matchSearch = !term || t.idTeknisi.toLowerCase().includes(term) || t.nama.toLowerCase().includes(term);
      const matchKategori = !this.filterKategori || t.kategoriSpesialis === this.filterKategori;
      const matchStatus = !this.filterStatus || t.status === this.filterStatus;
      return matchSearch && matchKategori && matchStatus;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTeknisi.length / this.pageSize));
  }
  get totalPagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get pagedTeknisi(): Teknisi[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTeknisi.slice(start, start + this.pageSize);
  }

  onFilterChange() { this.currentPage = 1; }
  goToPage(page: number) { this.currentPage = page; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

  openTambahModal() {
    this.isEditing = false;
    this.selectedId = null;
    this.editingNamaDisplay = '';
    this.formData = { nik: '', idKategori: null, status: 'Aktif' };
    this.isModalOpen = true;
  }

  openEditModal(t: Teknisi) {
    this.isEditing = true;
    this.selectedId = t.idTeknisi;
    this.editingNamaDisplay = t.nama;

    const matched = this.kategoriList.find((k) => k.nama === t.kategoriSpesialis);

    this.formData = {
      nik: '',
      idKategori: matched ? matched.id : null,
      status: t.status,
    };
    this.isModalOpen = true;
  }

  closeModal() { this.isModalOpen = false; }

  simpanTeknisi() {
    if (this.isEditing && this.selectedId !== null) {
      if (!this.formData.idKategori) {
        this.showToast('Kategori Spesialis wajib diisi!', 'warning');
        return;
      }
      this.teknisiService.update(this.selectedId, { idKategori: this.formData.idKategori, status: this.formData.status }).subscribe({
        next: () => {
          this.loadTeknisi();
          this.closeModal();
          this.showToast('Data teknisi berhasil diperbarui!', 'success');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Gagal memperbarui teknisi:', err);
          this.showToast(err.error?.message || 'Gagal memperbarui data.', 'danger');
        },
      });
    } else {
      if (!this.formData.nik || !this.formData.idKategori) {
        this.showToast('User dan Kategori Spesialis wajib diisi!', 'warning');
        return;
      }

      this.teknisiService.create({ nik: this.formData.nik, idKategori: this.formData.idKategori }).subscribe({
        next: () => {
          this.loadTeknisi();
          this.closeModal();
          this.showToast('Teknisi berhasil ditambahkan!', 'success');
        },
        error: (err: HttpErrorResponse) => {
          console.error('Gagal menambah teknisi:', err);
          this.showToast(err.error?.message || 'Gagal menambah data.', 'danger');
        },
      });
    }
  }

  async hapusTeknisi(t: Teknisi) {
    const alertEl = await this.alertCtrl.create({
      header: 'Hapus Teknisi',
      message: new IonicSafeString(`Apakah Anda yakin ingin menghapus teknisi <strong>${t.nama}</strong>?`),
      cssClass: 'custom-alert-dialog',
      buttons: [
        { text: 'Batal', role: 'cancel', cssClass: 'alert-button-cancel' },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => {
            this.teknisiService.remove(t.idTeknisi).subscribe({
              next: () => {
                this.showToast('Teknisi berhasil dihapus!', 'success');
                this.loadTeknisi();
              },
              error: (err: HttpErrorResponse) => {
                console.error('Gagal menghapus teknisi:', err);
                this.showToast(err.error?.message || 'Gagal menghapus data.', 'danger');
              },
            });
          }
        }
      ]
    });

    await alertEl.present();
  }

  getStatusClass(status: string): string {
    return status === 'Aktif' ? 'status-aktif' : 'status-nonaktif';
  }

  // ===== NAVIGASI & SIDEBAR =====
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
