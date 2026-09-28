import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IonicModule, ToastController } from '@ionic/angular';
import { FeedbackService } from '../../services/feedback.service';
import { SidebarComponent } from '../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.page.html',
  styleUrls: ['./feedback.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SidebarComponent]
})
export class FeedbackPage implements OnInit {
  isSidebarOpen = false;
  activeMenu = 'laporan-feedback';

  user = {
    nama: 'User',
    role: 'users',
  };

  solvedTickets: any[] = [];
  myFeedbacks: any[] = [];

  // Model Form
  selectedTicketId = '';
  selectedRating = 0;
  keterangan = '';
  isSubmitting = false;

  constructor(
    private router: Router,
    private feedbackService: FeedbackService,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        this.user.nama = parsed.nama || 'User';
        this.user.role = parsed.role || 'users';
      } catch (e) {}
    }

    this.loadSolvedTickets();
    this.loadMyFeedbacks();
  }

  loadSolvedTickets() {
    this.feedbackService.getMyTickets().subscribe({
      next: (res: any) => {
        this.solvedTickets = res?.data || [];
      },
      error: (err) => console.error(err)
    });
  }

  loadMyFeedbacks() {
    this.feedbackService.getMyFeedbacks().subscribe({
      next: (res: any) => {
        this.myFeedbacks = res?.data || [];
      },
      error: (err) => console.error(err)
    });
  }

  setRating(stars: number) {
    this.selectedRating = stars;
  }

  async submitFeedback() {
    if (!this.selectedTicketId) {
      this.showToast('Pilih tiket yang ingin diberi penilaian', 'warning');
      return;
    }
    if (this.selectedRating === 0) {
      this.showToast('Silakan pilih rating bintang (1-5)', 'warning');
      return;
    }

    this.isSubmitting = true;
    const body = {
      id_ticket: this.selectedTicketId,
      rating: this.selectedRating,
      feedback: this.selectedRating >= 4 ? 'Positif' : 'Negatif',
      keterangan: this.keterangan
    };

    this.feedbackService.submitFeedback(body).subscribe({
      next: async (res: any) => {
        this.isSubmitting = false;
        await this.showToast(res?.message || 'Feedback berhasil dikirim!', 'success');

        // Reset Form
        this.selectedTicketId = '';
        this.selectedRating = 0;
        this.keterangan = '';

        // Reload data
        this.loadSolvedTickets();
        this.loadMyFeedbacks();
      },
      error: async (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        const msg = err.error?.message || 'Gagal mengirim feedback';
        await this.showToast(msg, 'danger');
      }
    });
  }

  async showToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  getPageTitle(): string {
    return 'Laporan Feedback';
  }

  goToProfile() {
    this.router.navigate(['/users/profile']);
  }
}
