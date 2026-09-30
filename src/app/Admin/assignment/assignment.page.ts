import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  menuOutline,
  searchOutline,
  checkmarkOutline,
  closeOutline,
  chevronBackOutline,
  chevronForwardOutline
} from 'ionicons/icons';

import { HttpClientModule } from '@angular/common/http';
import { AssignmentService } from '../../services/assignment.service';
import { TicketService } from '../../services/ticket.service';
import { TeknisiOption } from '../../services/teknisi.service';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

export interface AssignmentTicket {
  no: number;
  idTicket: string;
  reportedBy: string;
  idKategori: number;
  kategori: string;
  subKategori: string;
  asset: string;
  tanggal: string;
  teknisiTerpilih: number | null;
  teknisiOptions: TeknisiOption[];
  loadingTeknisi: boolean;
  prioritas?: 'Low' | 'Normal' | 'Urgent';
  deadline?: string | null;
}

@Component({
  selector: 'app-assignment-ticket',
  templateUrl: './assignment.page.html',
  styleUrls: ['./assignment.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, IonicModule, SidebarComponent],
  providers: [AssignmentService]
})
export class AssignmentTicketPage implements OnInit {
  isSidebarOpen = false;
  activeMenu = 'assignment-ticket';

  tickets: AssignmentTicket[] = [];
  returnedTickets: any[] = [];

  isLoading = false;
  errorMessage = '';

  searchTerm = '';
  filterKategori = '';
  filterStatus: 'assignable' | 'returned' = 'assignable';

  kategoriOptions: string[] = [];

  currentPage = 1;
  pageSize = 10;

  constructor(
    private router: Router,
    private assignmentService: AssignmentService,
    private ticketService: TicketService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      menuOutline,
      searchOutline,
      checkmarkOutline,
      closeOutline,
      chevronBackOutline,
      chevronForwardOutline
    });
  }

  ngOnInit() {
    this.loadAssignableTickets();
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

  loadAssignableTickets() {
    this.isLoading = true;
    this.errorMessage = '';

    this.assignmentService.getAssignableTickets().subscribe({
      next: (res: any) => {
        const rows = res?.data || [];
        this.tickets = rows.map((row: any, index: number): AssignmentTicket => ({
          no: index + 1,
          idTicket: row.id_ticket,
          reportedBy: row.reported,
          idKategori: row.id_kategori,
          kategori: row.kategori,
          subKategori: row.sub_kategori,
          asset: row.asset,
          tanggal: row.tanggal,
          teknisiTerpilih: null,
          teknisiOptions: [],
          loadingTeknisi: false,
          prioritas: row.prioritas || row.priority || 'Normal',
          deadline: row.deadline || null,
        }));

        this.buildFilterOptions();
        this.isLoading = false;

        this.tickets.forEach((t) => this.loadTeknisiForTicket(t));
      },
      error: (err: any) => {
        console.error('Gagal memuat tiket assignment:', err);
        this.errorMessage = 'Gagal memuat data tiket.';
        this.isLoading = false;
      }
    });
  }

  loadReturnedTickets() {
    this.ticketService.getReturnedTickets().subscribe({
      next: (res) => {
        this.returnedTickets = res?.data || [];
      },
      error: (err) => {
        console.error('Gagal load returned tickets', err);
      }
    });
  }

  loadTeknisiForTicket(ticket: AssignmentTicket) {
    ticket.loadingTeknisi = true;
    this.assignmentService.getTeknisiByKategori(ticket.idKategori).subscribe({
      next: (res: any) => {
        ticket.teknisiOptions = Array.isArray(res) ? res : (res?.data || []);
        ticket.loadingTeknisi = false;
      },
      error: (err: any) => {
        console.error(`Gagal memuat teknisi untuk tiket ${ticket.idTicket}:`, err);
        ticket.loadingTeknisi = false;
      }
    });
  }

  private buildFilterOptions() {
    this.kategoriOptions = [...new Set(this.tickets.map((t) => t.kategori))];
  }

  get filteredTickets(): any[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (this.filterStatus === 'assignable') {
      return this.tickets.filter((t) => {
        const matchSearch =
          !term ||
          t.idTicket.toLowerCase().includes(term) ||
          t.reportedBy.toLowerCase().includes(term);
        const matchKategori = !this.filterKategori || t.kategori === this.filterKategori;
        return matchSearch && matchKategori;
      });
    } else {
      return this.returnedTickets.filter((t: any) => {
        const matchSearch =
          !term ||
          t.id_ticket?.toLowerCase().includes(term) ||
          t.reported?.toLowerCase().includes(term);
        return matchSearch;
      });
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTickets.length / this.pageSize));
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pagedTickets(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTickets.slice(start, start + this.pageSize);
  }

  onFilterChange() {
    this.currentPage = 1;
  }

  goToPage(page: number) {
    this.currentPage = page;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  getPrioritasClass(prioritas: string): string {
    const p = prioritas?.toLowerCase() || 'normal';
    if (p === 'low') return 'prioritas-low';
    if (p === 'urgent') return 'prioritas-urgent';
    return 'prioritas-normal';
  }

  /** Assign Tiket Ke Teknisi */
  async onAssign(ticket: AssignmentTicket) {
    if (!ticket.teknisiTerpilih) {
      this.showToast(`Silakan pilih teknisi terlebih dahulu untuk tiket ${ticket.idTicket}!`, 'warning');
      return;
    }

    const alertEl = await this.alertCtrl.create({
      header: 'Konfirmasi Assignment',
      message: `Assign tiket #${ticket.idTicket} dengan prioritas ${ticket.prioritas}?`,
      cssClass: 'custom-alert-light',
      buttons: [
        { text: 'Batal', role: 'cancel', cssClass: 'alert-btn-cancel' },
        {
          text: 'Assign',
          cssClass: 'alert-btn-primary',
          handler: () => {
            this.assignmentService.assignTicket(ticket.idTicket, ticket.teknisiTerpilih!, ticket.prioritas).subscribe({
              next: () => {
                this.showToast(`Tiket #${ticket.idTicket} berhasil di-assign!`, 'success');
                this.loadAssignableTickets();
              },
              error: (err: any) => {
                console.error('Gagal assign tiket:', err);
                this.showToast(err?.error?.message || 'Gagal assign tiket.', 'danger');
              }
            });
          }
        }
      ]
    });

    await alertEl.present();
  }

  /** Review Pengembalian Tiket */
  async reviewReturn(ticket: any, action: 'Approve' | 'Reject') {
    const isApprove = action === 'Approve';
    const alertEl = await this.alertCtrl.create({
      header: isApprove ? 'Setujui Pengembalian' : 'Tolak Pengembalian',
      message: isApprove
        ? `Setujui pengembalian tiket #${ticket.id_ticket}? Tiket akan siap di-assign ulang.`
        : `Tolak pengembalian tiket #${ticket.id_ticket}? Tiket akan dikembalikan ke teknisi.`,
      cssClass: 'custom-alert-light',
      buttons: [
        { text: 'Batal', role: 'cancel', cssClass: 'alert-btn-cancel' },
        {
          text: isApprove ? 'Setujui' : 'Tolak',
          cssClass: isApprove ? 'alert-btn-success' : 'alert-btn-danger',
          handler: () => {
            this.ticketService.reviewReturn(ticket.id_ticket, action).subscribe({
              next: () => {
                this.showToast(`Pengembalian tiket #${ticket.id_ticket} ${isApprove ? 'disetujui' : 'ditolak'}.`, 'success');
                this.loadReturnedTickets();
                this.loadAssignableTickets();
              },
              error: (err: any) => this.showToast(err?.error?.message || 'Gagal memproses review.', 'danger')
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
