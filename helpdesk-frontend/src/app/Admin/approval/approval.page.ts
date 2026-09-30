import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  menuOutline,
  searchOutline,
  imageOutline,
  checkmarkOutline,
  closeOutline,
  chevronBackOutline,
  chevronForwardOutline
} from 'ionicons/icons';

import { TicketService } from '../../services/ticket.service';
import { environment } from '../../../environments/environment';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

export interface ApprovalTicket {
  id_ticket: string;
  reported: string;
  dept: string;
  nama_kategori: string;
  nama_sub_kategori: string;
  tanggal: string;
  deskripsi: string;
  lampiran: string | null;
  prioritas?: 'Low' | 'Normal' | 'Urgent';
  status_approval?: string;
}

export interface ReturnedTicket {
  id_ticket: string;
  reported: string;
  dept: string;
  kategori: string;
  sub_kategori: string | null;
  teknisi_nama: string;
  return_reason: string;
  return_status: string;
}

@Component({
  selector: 'app-approval',
  templateUrl: './approval.page.html',
  styleUrls: ['./approval.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SidebarComponent],
})
export class ApprovalTicketPage implements OnInit {
  isSidebarOpen = false;
  activeMenu = 'approval-ticket';

  approvalTickets: ApprovalTicket[] = [];
  isLoadingApproval = false;

  returnedTickets: ReturnedTicket[] = [];
  isLoadingReturned = false;

  searchTerm = '';
  filterStatus = '';
  filterDepartemen = '';
  filterKategori = '';

  statusOptions: string[] = ['Menunggu Approval', 'Approve', 'Reject'];
  departemenOptions: string[] = [];
  kategoriOptions: string[] = [];

  currentPage = 1;
  pageSize = 10;

  apiBase = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(
    private router: Router,
    private ticketService: TicketService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      menuOutline,
      searchOutline,
      imageOutline,
      checkmarkOutline,
      closeOutline,
      chevronBackOutline,
      chevronForwardOutline
    });
  }

  ngOnInit() {
    this.loadApprovalTickets();
    this.loadReturnedTickets();
  }

  /** Helper Toast Notification */
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

  /** Format Tanggal Ramah Pengguna */
  formatDate(rawDate: string | null | undefined): string {
    if (!rawDate) return '-';
    const d = new Date(String(rawDate).trim().replace(' ', 'T'));
    if (isNaN(d.getTime())) return rawDate;

    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace('.', ':');
  }

  loadApprovalTickets() {
    this.isLoadingApproval = true;
    this.ticketService.getAllRaw().subscribe({
      next: (res: any) => {
        const data = res?.data || res || [];

        this.approvalTickets = data
          .filter((t: any) => t.status === 'Menunggu Approval')
          .map((t: any) => ({
            id_ticket: t.id_ticket,
            reported: t.reported,
            dept: t.dept,
            nama_kategori: t.nama_kategori,
            nama_sub_kategori: t.nama_sub_kategori || '-',
            tanggal: t.tanggal,
            deskripsi: t.deskripsi || '-',
            lampiran: t.lampiran,
            prioritas: t.prioritas || 'Normal',
            status_approval: t.status_approval || 'Menunggu Approval'
          }));

        this.buildFilterOptions();
        this.isLoadingApproval = false;
      },
      error: (err: any) => {
        console.error('Gagal memuat tiket approval:', err);
        this.isLoadingApproval = false;
      }
    });
  }

  private buildFilterOptions() {
    this.departemenOptions = [...new Set(this.approvalTickets.map((t) => t.dept).filter(Boolean))];
    this.kategoriOptions = [...new Set(this.approvalTickets.map((t) => t.nama_kategori).filter(Boolean))];
  }

  loadReturnedTickets() {
    this.isLoadingReturned = true;
    this.ticketService.getReturnedTickets().subscribe({
      next: (res: any) => {
        this.returnedTickets = res?.data || res || [];
        this.isLoadingReturned = false;
      },
      error: (err: any) => {
        console.error('Gagal memuat tiket pengembalian:', err);
        this.isLoadingReturned = false;
      }
    });
  }

  /** Confirm & Approve Ticket dengan AlertController (Light Theme) */
  async approveTicket(ticket: ApprovalTicket) {
    if (!ticket?.id_ticket) {
      this.showToast('ID Tiket tidak valid.', 'warning');
      return;
    }

    const alertEl = await this.alertCtrl.create({
      header: 'Konfirmasi Approval',
      message: `Apakah Anda yakin ingin menyetujui tiket #${ticket.id_ticket}?`,
      cssClass: 'custom-alert-light',
      buttons: [
        { text: 'Batal', role: 'cancel', cssClass: 'alert-btn-cancel' },
        {
          text: 'Setujui',
          cssClass: 'alert-btn-success',
          handler: () => {
            this.ticketService.approve(ticket.id_ticket, 'Approve').subscribe({
              next: () => {
                this.loadApprovalTickets();
                this.showToast('Tiket berhasil disetujui!', 'success');
              },
              error: (err: any) => this.showToast('Gagal approve: ' + (err.error?.message || err.message), 'danger')
            });
          }
        }
      ]
    });
    await alertEl.present();
  }

  /** Reject Ticket dengan Input Alasan Wajib (Light Theme) */
  async rejectTicket(ticket: ApprovalTicket) {
    if (!ticket?.id_ticket) {
      this.showToast('ID Tiket tidak valid.', 'warning');
      return;
    }

    const alertEl = await this.alertCtrl.create({
      header: 'Tolak Tiket',
      subHeader: `Tiket #${ticket.id_ticket}`,
      message: 'Masukkan alasan penolakan tiket ini (wajib diisi):',
      cssClass: 'custom-alert-light',
      inputs: [
        {
          name: 'alasan',
          type: 'textarea',
          placeholder: 'Contoh: Deskripsi kurang jelas, mohon dilengkapi kembali',
        },
      ],
      buttons: [
        { text: 'Batal', role: 'cancel', cssClass: 'alert-btn-cancel' },
        {
          text: 'Tolak Tiket',
          cssClass: 'alert-btn-danger',
          handler: (data) => {
            const alasan = (data?.alasan || '').trim();
            if (!alasan) {
              this.showToast('Alasan penolakan wajib diisi!', 'warning');
              return false;
            }
            this.doRejectTicket(ticket, alasan);
            return true;
          },
        },
      ],
    });

    await alertEl.present();
  }

  private doRejectTicket(ticket: ApprovalTicket, alasan: string) {
    this.ticketService.approve(ticket.id_ticket, 'Reject', alasan).subscribe({
      next: () => {
        this.loadApprovalTickets();
        this.showToast('Tiket berhasil ditolak.', 'success');
      },
      error: (err: any) => this.showToast('Gagal reject: ' + (err.error?.message || err.message), 'danger'),
    });
  }

  /** Confirm & Approve Return Ticket (Light Theme) */
  async approveReturn(ticket: ReturnedTicket) {
    if (!ticket?.id_ticket) {
      this.showToast('ID Tiket tidak valid.', 'warning');
      return;
    }

    const alertEl = await this.alertCtrl.create({
      header: 'Setujui Pengembalian',
      message: `Setujui pengembalian tiket #${ticket.id_ticket}? Tiket akan siap di-assign ulang.`,
      cssClass: 'custom-alert-light',
      buttons: [
        { text: 'Batal', role: 'cancel', cssClass: 'alert-btn-cancel' },
        {
          text: 'Setujui',
          cssClass: 'alert-btn-success',
          handler: () => {
            this.ticketService.reviewReturn(ticket.id_ticket, 'Approve').subscribe({
              next: () => {
                this.loadReturnedTickets();
                this.loadApprovalTickets();
                this.showToast('Pengembalian tiket berhasil disetujui.', 'success');
              },
              error: (err: any) => this.showToast('Gagal approve return: ' + (err.error?.message || err.message), 'danger')
            });
          }
        }
      ]
    });
    await alertEl.present();
  }

  /** Confirm & Reject Return Ticket (Light Theme) */
  async rejectReturn(ticket: ReturnedTicket) {
    if (!ticket?.id_ticket) {
      this.showToast('ID Tiket tidak valid.', 'warning');
      return;
    }

    const alertEl = await this.alertCtrl.create({
      header: 'Tolak Pengembalian',
      message: `Tolak pengembalian tiket #${ticket.id_ticket}? Tiket akan dikembalikan ke teknisi.`,
      cssClass: 'custom-alert-light',
      buttons: [
        { text: 'Batal', role: 'cancel', cssClass: 'alert-btn-cancel' },
        {
          text: 'Tolak',
          cssClass: 'alert-btn-danger',
          handler: () => {
            this.ticketService.reviewReturn(ticket.id_ticket, 'Reject').subscribe({
              next: () => {
                this.loadReturnedTickets();
                this.showToast('Pengembalian tiket ditolak.', 'success');
              },
              error: (err: any) => this.showToast('Gagal reject return: ' + (err.error?.message || err.message), 'danger')
            });
          }
        }
      ]
    });
    await alertEl.present();
  }

  get filteredApprovalTickets(): ApprovalTicket[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.approvalTickets.filter((t) => {
      const matchSearch = !term ||
        t.id_ticket.toLowerCase().includes(term) ||
        t.reported.toLowerCase().includes(term);
      const matchStatus = !this.filterStatus || t.status_approval === this.filterStatus;
      const matchDept = !this.filterDepartemen || t.dept === this.filterDepartemen;
      const matchKategori = !this.filterKategori || t.nama_kategori === this.filterKategori;
      return matchSearch && matchStatus && matchDept && matchKategori;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredApprovalTickets.length / this.pageSize));
  }
  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  get pagedApprovalTickets(): ApprovalTicket[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredApprovalTickets.slice(start, start + this.pageSize);
  }

  onFilterChange() { this.currentPage = 1; }
  goToPage(page: number) { this.currentPage = page; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }

  getLampiranUrl(lampiranPath: string | null): string | null {
    if (!lampiranPath) return null;
    return this.apiBase + lampiranPath;
  }

  toggleSidebar() { this.isSidebarOpen = !this.isSidebarOpen; }
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
