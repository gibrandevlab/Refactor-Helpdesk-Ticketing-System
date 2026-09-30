import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IonContent, IonButton, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonInput, ToastController, AlertController, IonicSafeString } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, closeOutline, saveOutline, menuOutline, searchOutline } from 'ionicons/icons';
import { environment } from '../../../environments/environment';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

interface Type { id_asset_type: number; nama_jenis: string; is_active: boolean; jumlah_aset: number; }
interface Unit { id_checklist_unit: number; id_asset_type: number; nama_unit: string; urutan: number; is_active: boolean; maintenance_asset_type?: Type; }
interface Item { id_maintenance_item: number; id_asset_type: number; id_checklist_unit: number; uraian_pemeriksaan: string; alat_metode: string | null; kriteria_hasil: string | null; urutan: number; is_active: boolean; maintenance_asset_type?: Type; maintenance_checklist_unit?: Unit; }
type Tab = 'kategori' | 'unit' | 'pemeriksaan';

@Component({ selector: 'app-maintenance-master', templateUrl: './maintenance-master.page.html', styleUrls: ['./maintenance-master.page.scss'], standalone: true, imports: [CommonModule, FormsModule, IonContent, IonButton, IonIcon, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonInput, SidebarComponent] })
export class MaintenanceMasterPage implements OnInit {
  isSidebarOpen = false; activeTab: Tab = 'kategori'; search = ''; pageSize = 10;
  types: Type[] = []; units: Unit[] = []; items: Item[] = []; activeTypes: Type[] = []; activeUnits: Unit[] = [];
  typeModalOpen = false; unitModalOpen = false; itemModalOpen = false;
  editingType: Type | null = null; editingUnit: Unit | null = null; editingItem: Item | null = null;
  typeForm = { nama_jenis: '', is_active: true };
  unitForm = { id_asset_type: null as number | null, nama_unit: '', urutan: 0, is_active: true };
  itemForm = { id_asset_type: null as number | null, id_checklist_unit: null as number | null, uraian_pemeriksaan: '', alat_metode: '', kriteria_hasil: '', urutan: 0, is_active: true };
  constructor(private http: HttpClient, private toastCtrl: ToastController, private alertCtrl: AlertController) { addIcons({ addOutline, createOutline, trashOutline, closeOutline, saveOutline, menuOutline, searchOutline }); }
  private headers() { return { headers: new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` }) }; }
  ngOnInit() { this.reload(); }
  async toast(message: string, color: 'success' | 'danger' | 'warning' = 'success') { const toast = await this.toastCtrl.create({ message, color, duration: 3500, position: 'top' }); await toast.present(); }
  private message(err: any, fallback: string) { return err?.error?.message || fallback; }
  reload() {
    this.http.get<Type[]>(`${environment.apiUrl}/maintenance-master/asset-types`, this.headers()).subscribe({ next: x => { this.types = x || []; this.activeTypes = this.types.filter(v => v.is_active); }, error: e => this.toast(this.message(e, 'Gagal memuat kategori maintenance'), 'danger') });
    this.http.get<Unit[]>(`${environment.apiUrl}/maintenance-master/checklist-units`, this.headers()).subscribe({ next: x => this.units = x || [], error: e => this.toast(this.message(e, 'Gagal memuat unit pemeriksaan'), 'danger') });
    this.http.get<Item[]>(`${environment.apiUrl}/maintenance-master/checklist-items`, this.headers()).subscribe({ next: x => this.items = x || [], error: e => this.toast(this.message(e, 'Gagal memuat uraian pemeriksaan'), 'danger') });
  }
  setTab(tab: Tab) { this.activeTab = tab; this.search = ''; }
  get rows(): Array<Type | Unit | Item> { const q = this.search.toLowerCase().trim(); const source = this.activeTab === 'kategori' ? this.types : this.activeTab === 'unit' ? this.units : this.items; return source.filter((x: any) => !q || Object.values(x).some(v => String(v || '').toLowerCase().includes(q))); }
  get visibleRows(): any[] { return this.rows.slice(0, this.pageSize); }
  loadUnits(typeId: number | null) { this.activeUnits = this.units.filter(x => x.is_active && x.id_asset_type === Number(typeId)); }
  openType(row?: Type) { this.editingType = row || null; this.typeForm = row ? { nama_jenis: row.nama_jenis, is_active: !!row.is_active } : { nama_jenis: '', is_active: true }; this.typeModalOpen = true; }
  openUnit(row?: Unit) { this.editingUnit = row || null; this.unitForm = row ? { id_asset_type: row.id_asset_type, nama_unit: row.nama_unit, urutan: row.urutan, is_active: !!row.is_active } : { id_asset_type: null, nama_unit: '', urutan: 0, is_active: true }; this.unitModalOpen = true; }
  openItem(row?: Item) { this.editingItem = row || null; this.itemForm = row ? { id_asset_type: row.id_asset_type, id_checklist_unit: row.id_checklist_unit, uraian_pemeriksaan: row.uraian_pemeriksaan, alat_metode: row.alat_metode || '', kriteria_hasil: row.kriteria_hasil || '', urutan: row.urutan, is_active: !!row.is_active } : { id_asset_type: null, id_checklist_unit: null, uraian_pemeriksaan: '', alat_metode: '', kriteria_hasil: '', urutan: 0, is_active: true }; this.loadUnits(this.itemForm.id_asset_type); this.itemModalOpen = true; }
  close(kind: Tab) { if (kind === 'kategori') { this.typeModalOpen = false; this.editingType = null; } if (kind === 'unit') { this.unitModalOpen = false; this.editingUnit = null; } if (kind === 'pemeriksaan') { this.itemModalOpen = false; this.editingItem = null; } }
  saveType() { const data = { ...this.typeForm, nama_jenis: this.typeForm.nama_jenis.trim() }; if (!data.nama_jenis) return void this.toast('Nama kategori maintenance wajib diisi', 'warning'); const url = `${environment.apiUrl}/maintenance-master/asset-types${this.editingType ? '/' + this.editingType.id_asset_type : ''}`; (this.editingType ? this.http.put(url, data, this.headers()) : this.http.post(url, data, this.headers())).subscribe({ next: () => { this.close('kategori'); this.reload(); this.toast('Kategori maintenance tersimpan'); }, error: e => this.toast(this.message(e, 'Gagal menyimpan kategori'), 'danger') }); }
  saveUnit() { const data = { ...this.unitForm, nama_unit: this.unitForm.nama_unit.trim() }; if (!data.id_asset_type || !data.nama_unit) return void this.toast('Kategori dan nama unit wajib diisi', 'warning'); const url = `${environment.apiUrl}/maintenance-master/checklist-units${this.editingUnit ? '/' + this.editingUnit.id_checklist_unit : ''}`; (this.editingUnit ? this.http.put(url, data, this.headers()) : this.http.post(url, data, this.headers())).subscribe({ next: () => { this.close('unit'); this.reload(); this.toast('Unit pemeriksaan tersimpan'); }, error: e => this.toast(this.message(e, 'Gagal menyimpan unit'), 'danger') }); }
  saveItem() { const data = { ...this.itemForm, uraian_pemeriksaan: this.itemForm.uraian_pemeriksaan.trim() }; if (!data.id_asset_type || !data.id_checklist_unit || !data.uraian_pemeriksaan) return void this.toast('Kategori, unit, dan uraian wajib diisi', 'warning'); const url = `${environment.apiUrl}/maintenance-master/checklist-items${this.editingItem ? '/' + this.editingItem.id_maintenance_item : ''}`; (this.editingItem ? this.http.put(url, data, this.headers()) : this.http.post(url, data, this.headers())).subscribe({ next: () => { this.close('pemeriksaan'); this.reload(); this.toast('Uraian pemeriksaan tersimpan'); }, error: e => this.toast(this.message(e, 'Gagal menyimpan uraian'), 'danger') }); }
  async deactivate(row: any) { const kind = this.activeTab; const id = kind === 'kategori' ? row.id_asset_type : kind === 'unit' ? row.id_checklist_unit : row.id_maintenance_item; const endpoint = kind === 'kategori' ? 'asset-types' : kind === 'unit' ? 'checklist-units' : 'checklist-items'; const name = kind === 'kategori' ? row.nama_jenis : kind === 'unit' ? row.nama_unit : row.uraian_pemeriksaan; const alert = await this.alertCtrl.create({ header: 'Nonaktifkan data', message: new IonicSafeString(`Data <strong>"${name}"</strong> tidak dihapus dan riwayat tiket tetap aman.`), buttons: [{ text: 'Batal', role: 'cancel' }, { text: 'Nonaktifkan', role: 'destructive', handler: () => this.http.delete(`${environment.apiUrl}/maintenance-master/${endpoint}/${id}`, this.headers()).subscribe({ next: () => { this.reload(); this.toast('Data dinonaktifkan'); }, error: e => this.toast(this.message(e, 'Gagal menonaktifkan data'), 'danger') }) }] }); await alert.present(); }
  toggleSidebar() { this.isSidebarOpen = !this.isSidebarOpen; }
}
