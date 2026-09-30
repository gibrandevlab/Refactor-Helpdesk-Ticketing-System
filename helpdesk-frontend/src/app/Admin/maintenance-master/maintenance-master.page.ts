import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonInput,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  createOutline,
  trashOutline,
  closeOutline,
  saveOutline,
  menuOutline,
  chevronBackOutline,
  chevronForwardOutline,
  searchOutline
} from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

interface AssetType {
  id_asset_type: number;
  nama_jenis: string;
  is_active: boolean;
  jumlah_aset: number;
}

interface ChecklistItem {
  id_maintenance_item: number;
  id_asset_type: number;
  uraian_pemeriksaan: string;
  alat_metode: string | null;
  kriteria_hasil: string | null;
  urutan: number;
  is_active: boolean;
  maintenance_asset_type?: AssetType;
}

@Component({
  selector: 'app-maintenance-master',
  templateUrl: './maintenance-master.page.html',
  styleUrls: ['./maintenance-master.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonInput,
    SidebarComponent
  ]
})
export class MaintenanceMasterPage implements OnInit {
  isSidebarOpen = false;
  activeMenu = 'maintenance-master';
  activeTab: 'kategori' | 'pemeriksaan' = 'kategori';
  searchType = '';
  searchItem = '';
  pageSize = 10;
  typePage = 1;
  itemPage = 1;

  types: AssetType[] = [];
  items: ChecklistItem[] = [];
  activeTypes: AssetType[] = [];

  typeModalOpen = false;
  itemModalOpen = false;
  editingType: AssetType | null = null;
  editingItem: ChecklistItem | null = null;

  typeForm = { nama_jenis: '', is_active: true };
  itemForm = {
    id_asset_type: null as number | null,
    uraian_pemeriksaan: '',
    alat_metode: '',
    kriteria_hasil: '',
    urutan: 0,
    is_active: true
  };

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      addOutline,
      createOutline,
      trashOutline,
      closeOutline,
      saveOutline,
      menuOutline,
      chevronBackOutline,
      chevronForwardOutline,
      searchOutline
    });
  }

  private headers() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`
      })
    };
  }

  ngOnInit() {
    this.reload();
  }

  async toast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const el = await this.toastCtrl.create({
      message,
      color,
      duration: 3500,
      position: 'top',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await el.present();
  }

  private errorMessage(err: any, fallback: string) {
    return err?.error?.message || fallback;
  }

  reload() {
    this.http
      .get<AssetType[]>(`${environment.apiUrl}/maintenance-master/asset-types`, this.headers())
      .subscribe({
        next: (data) => {
          this.types = data || [];
          this.activeTypes = this.types.filter((t) => t.is_active);
        },
        error: (e) => this.toast(this.errorMessage(e, 'Gagal memuat jenis aset'), 'danger')
      });

    this.http
      .get<ChecklistItem[]>(`${environment.apiUrl}/maintenance-master/checklist-items`, this.headers())
      .subscribe({
        next: (data) => (this.items = data || []),
        error: (e) => this.toast(this.errorMessage(e, 'Gagal memuat template checklist'), 'danger')
      });
  }

  get filteredTypes() {
    const q = this.searchType.trim().toLowerCase();
    return this.types.filter((x) => !q || String(x.nama_jenis || '').toLowerCase().includes(q));
  }

  get filteredItems() {
    const q = this.searchItem.trim().toLowerCase();
    return this.items.filter(
      (x) =>
        !q ||
        [
          x.uraian_pemeriksaan,
          x.alat_metode,
          x.kriteria_hasil,
          x.maintenance_asset_type?.nama_jenis
        ].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }

  get typePages() {
    return Math.max(1, Math.ceil(this.filteredTypes.length / this.pageSize));
  }

  get itemPages() {
    return Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
  }

  get pagedTypes() {
    return this.filteredTypes.slice((this.typePage - 1) * this.pageSize, this.typePage * this.pageSize);
  }

  get pagedItems() {
    return this.filteredItems.slice((this.itemPage - 1) * this.pageSize, this.itemPage * this.pageSize);
  }

  onTypeSearch() {
    this.typePage = 1;
  }

  onItemSearch() {
    this.itemPage = 1;
  }

  setTab(tab: 'kategori' | 'pemeriksaan') {
    this.activeTab = tab;
  }

  openTypeModal(type?: AssetType) {
    this.editingType = type || null;
    this.typeForm = type
      ? { nama_jenis: type.nama_jenis || '', is_active: !!type.is_active }
      : { nama_jenis: '', is_active: true };
    this.typeModalOpen = true;
  }

  closeTypeModal() {
    this.typeModalOpen = false;
    this.editingType = null;
  }

  openItemModal(item?: ChecklistItem) {
    this.editingItem = item || null;
    this.itemForm = item
      ? {
          id_asset_type: item.id_asset_type,
          uraian_pemeriksaan: item.uraian_pemeriksaan || '',
          alat_metode: item.alat_metode || '',
          kriteria_hasil: item.kriteria_hasil || '',
          urutan: Number(item.urutan) || 0,
          is_active: !!item.is_active
        }
      : {
          id_asset_type: null,
          uraian_pemeriksaan: '',
          alat_metode: '',
          kriteria_hasil: '',
          urutan: 0,
          is_active: true
        };
    this.itemModalOpen = true;
  }

  closeItemModal() {
    this.itemModalOpen = false;
    this.editingItem = null;
  }

  saveType() {
    const nama = this.typeForm.nama_jenis.trim();
    if (!nama) {
      this.toast('Nama jenis aset wajib diisi', 'warning');
      return;
    }
    const req = this.editingType
      ? this.http.put(
          `${environment.apiUrl}/maintenance-master/asset-types/${this.editingType.id_asset_type}`,
          { ...this.typeForm, nama_jenis: nama },
          this.headers()
        )
      : this.http.post(
          `${environment.apiUrl}/maintenance-master/asset-types`,
          { ...this.typeForm, nama_jenis: nama },
          this.headers()
        );

    req.subscribe({
      next: () => {
        this.closeTypeModal();
        this.toast('Jenis aset berhasil disimpan');
        this.reload();
      },
      error: (e) => this.toast(this.errorMessage(e, 'Gagal menyimpan jenis aset'), 'danger')
    });
  }

  saveItem() {
    if (!this.itemForm.id_asset_type || !this.itemForm.uraian_pemeriksaan.trim()) {
      this.toast('Jenis aset dan uraian pemeriksaan wajib diisi', 'warning');
      return;
    }
    const data = { ...this.itemForm, uraian_pemeriksaan: this.itemForm.uraian_pemeriksaan.trim() };
    const req = this.editingItem
      ? this.http.put(
          `${environment.apiUrl}/maintenance-master/checklist-items/${this.editingItem.id_maintenance_item}`,
          data,
          this.headers()
        )
      : this.http.post(`${environment.apiUrl}/maintenance-master/checklist-items`, data, this.headers());

    req.subscribe({
      next: () => {
        this.closeItemModal();
        this.toast('Template checklist berhasil disimpan');
        this.reload();
      },
      error: (e) => this.toast(this.errorMessage(e, 'Gagal menyimpan template checklist'), 'danger')
    });
  }

  async deactivate(kind: 'type' | 'item', row: AssetType | ChecklistItem) {
    const isType = kind === 'type';
    const name = isType ? (row as AssetType).nama_jenis : (row as ChecklistItem).uraian_pemeriksaan;

    const alert = await this.alertCtrl.create({
      header: `Nonaktifkan ${isType ? 'Jenis Aset' : 'Checklist'}`,
      message: `Data "${name}" tidak dihapus permanen dan tetap ada pada riwayat.`,
      cssClass: 'custom-alert-light',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
          cssClass: 'alert-btn-cancel'
        },
        {
          text: 'Nonaktifkan',
          role: 'confirm',
          cssClass: 'alert-btn-danger',
          handler: () =>
            this.http
              .delete(
                `${environment.apiUrl}/maintenance-master/${isType ? 'asset-types' : 'checklist-items'}/${
                  isType ? (row as AssetType).id_asset_type : (row as ChecklistItem).id_maintenance_item
                }`,
                this.headers()
              )
              .subscribe({
                next: () => {
                  this.toast('Data berhasil dinonaktifkan');
                  this.reload();
                },
                error: (e) => this.toast(this.errorMessage(e, 'Gagal menonaktifkan data'), 'danger')
              })
        }
      ]
    });

    await alert.present();
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
