import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  IonicModule, ToastController, AlertController, IonicSafeString, IonModal
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  menuOutline, searchOutline, peopleOutline, laptopOutline, businessOutline,
  addOutline, createOutline, trashOutline, chevronBackOutline, chevronForwardOutline,
  closeOutline, saveOutline
} from 'ionicons/icons';

import { JabatanService } from '../../services/Jabatan.service';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

export interface Karyawan {
  id: number;
  nik: string;
  nama: string;
  alamat: string;
  jenisKelamin: string;
  departemen: string;
  bagian: string;
  jabatan: string;
}

@Component({
  selector: 'app-karyawan',
  templateUrl: './karyawan.page.html',
  styleUrls: ['./karyawan.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonicModule, SidebarComponent
  ],
})
export class KaryawanPage implements OnInit {
  isSidebarOpen = false;
  activeMenu = 'karyawan';

  private apiUrl = 'http://localhost:5000/api/karyawan';
  private apiDepartemenUrl = 'http://localhost:5000/api/master/departemen';
  private apiBagianUrl = 'http://localhost:5000/api/master/bagian-departemen';

  karyawanList: Karyawan[] = [];

  departemenMasterList: any[] = [];
  bagianMasterList: any[] = [];
  jabatanMasterList: any[] = [];

  get totalKaryawan(): number { return this.karyawanList.length; }
  get totalIT(): number { return this.karyawanList.filter(k => k.departemen === 'IT').length; }
  get totalNonIT(): number { return this.karyawanList.filter(k => k.departemen !== 'IT').length; }

  searchTerm = '';
  filterDepartemen = '';
  filterBagian = '';

  get departemenOptions(): string[] {
    const fromMaster = this.departemenMasterList.map(d => d.nama_departemen);
    const fromKaryawan = this.karyawanList.map(k => k.departemen);
    return [...new Set([...fromMaster, ...fromKaryawan])].filter(Boolean);
  }

  get bagianOptions(): string[] {
    const fromMaster = this.bagianMasterList.map(b => b.nama_bagian);
    const fromKaryawan = this.karyawanList.map(k => k.bagian);
    return [...new Set([...fromMaster, ...fromKaryawan])].filter(Boolean);
  }

  get filteredBagianOptions(): string[] {
    if (!this.formData.departemen) return [];
    return this.bagianMasterList
      .filter(b => b.departemen === this.formData.departemen)
      .map(b => b.nama_bagian);
  }

  get jabatanOptions(): string[] {
    const fromMaster = this.jabatanMasterList.map(j => j.nama_jabatan);
    const fromKaryawan = this.karyawanList.map(k => k.jabatan);
    return [...new Set([...fromMaster, ...fromKaryawan])].filter(Boolean);
  }

  currentPage = 1;
  pageSize = 10;

  @ViewChild('modal') modal!: IonModal;
  isModalOpen = false;
  isEditing = false;
  formData: any = {
    id: null,
    nik: '',
    nama: '',
    alamat: '',
    jenisKelamin: 'Laki-laki',
    departemen: '',
    bagian: '',
    jabatan: 'Operator'
  };
  jenisKelaminOptions = ['Laki-laki', 'Perempuan'];

  isLoading = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private jabatanService: JabatanService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      menuOutline, searchOutline, peopleOutline, laptopOutline, businessOutline,
      addOutline, createOutline, trashOutline, chevronBackOutline, chevronForwardOutline,
      closeOutline, saveOutline
    });
  }

  ngOnInit() {
    this.loadDataKaryawan();
    this.loadMasterData();
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

  loadDataKaryawan() {
    this.isLoading = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(this.apiUrl, { headers }).subscribe({
      next: (res) => {
        this.karyawanList = Array.isArray(res) ? res : (res.data || []);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Gagal mengambil data dari database:', err);
        this.isLoading = false;
      }
    });
  }

  loadMasterData() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(this.apiDepartemenUrl, { headers }).subscribe({
      next: (res) => {
        this.departemenMasterList = Array.isArray(res) ? res : (res.data || []);
      },
      error: (err) => console.error('Gagal memuat master departemen:', err)
    });

    this.http.get<any>(this.apiBagianUrl, { headers }).subscribe({
      next: (res) => {
        this.bagianMasterList = Array.isArray(res) ? res : (res.data || []);
      },
      error: (err) => console.error('Gagal memuat master bagian departemen:', err)
    });

    this.jabatanService.getAll().subscribe({
      next: (res) => {
        this.jabatanMasterList = Array.isArray(res) ? res : (res.data || []);
      },
      error: (err) => console.error('Gagal memuat master jabatan:', err)
    });
  }

  get filteredKaryawan(): Karyawan[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.karyawanList.filter(k => {
      const matchSearch = !term ||
        (k.nik && k.nik.toLowerCase().includes(term)) ||
        (k.nama && k.nama.toLowerCase().includes(term)) ||
        (k.alamat && k.alamat.toLowerCase().includes(term));
      const matchDept = !this.filterDepartemen || k.departemen === this.filterDepartemen;
      const matchBagian = !this.filterBagian || k.bagian === this.filterBagian;
      return matchSearch && matchDept && matchBagian;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredKaryawan.length / this.pageSize));
  }
  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  get pagedKaryawan(): Karyawan[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredKaryawan.slice(start, start + this.pageSize);
  }

  onFilterChange() { this.currentPage = 1; }
  goToPage(page: number) { this.currentPage = page; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

  openTambahModal() {
    this.isEditing = false;
    this.formData = {
      id: null,
      nik: '',
      nama: '',
      alamat: '',
      jenisKelamin: 'Laki-laki',
      departemen: '',
      bagian: '',
      jabatan: 'Operator'
    };
    this.loadMasterData();
    this.isModalOpen = true;
  }

  openEditModal(karyawan: Karyawan) {
    this.isEditing = true;
    this.formData = { ...karyawan };
    this.loadMasterData();
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onDepartemenModalChange() {
    this.formData.bagian = '';
  }

  simpanKaryawan() {
    if (!this.formData.nama) {
      this.showToast('Nama karyawan wajib diisi!', 'warning');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    if (this.isEditing) {
      this.http.put(`${this.apiUrl}/${this.formData.id}`, this.formData, { headers }).subscribe({
        next: () => {
          this.showToast('Data karyawan berhasil diperbarui!', 'success');
          this.loadDataKaryawan();
          this.closeModal();
        },
        error: (err) => this.showToast('Gagal memperbarui data: ' + (err.error?.error || err.error?.message || err.message), 'danger')
      });
    } else {
      this.http.post(this.apiUrl, this.formData, { headers }).subscribe({
        next: () => {
          this.showToast('Karyawan berhasil ditambahkan!', 'success');
          this.loadDataKaryawan();
          this.closeModal();
        },
        error: (err) => this.showToast('Gagal menambah data: ' + (err.error?.error || err.error?.message || err.message), 'danger')
      });
    }
  }

  async hapusKaryawan(karyawan: Karyawan) {
    const alertEl = await this.alertCtrl.create({
      header: 'Hapus Karyawan',
      message: new IonicSafeString(`Apakah Anda yakin ingin menghapus data karyawan <strong>${karyawan.nama}</strong>?`),
      cssClass: 'custom-alert-dialog',
      buttons: [
        { text: 'Batal', role: 'cancel', cssClass: 'alert-button-cancel' },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => {
            const token = localStorage.getItem('token');
            const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

            this.http.delete(`${this.apiUrl}/${karyawan.id}`, { headers }).subscribe({
              next: () => {
                this.showToast('Karyawan berhasil dihapus.', 'success');
                this.loadDataKaryawan();
              },
              error: (err) => this.showToast(err.error?.error || err.error?.message || 'Gagal menghapus data.', 'danger')
            });
          }
        }
      ]
    });

    await alertEl.present();
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
