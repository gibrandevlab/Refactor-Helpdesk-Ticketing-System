import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule
  ]
})
export class SidebarComponent implements OnInit {
  @Input() isSidebarOpen: boolean = false;
  @Input() activeMenu: string = '';
  @Output() isSidebarOpenChange = new EventEmitter<boolean>();

  user: any = {
    nama: 'User',
    role: 'users',
  };

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        this.user = {
          nama: parsed.nama || parsed.username || 'User',
          role: parsed.role || 'users',
        };
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.isSidebarOpenChange.emit(this.isSidebarOpen);
  }

  closeSidebar() {
    this.isSidebarOpen = false;
    this.isSidebarOpenChange.emit(false);
  }

  navigateTo(path: string) {
    this.router.navigate([`/${path}`]);
    if (window.innerWidth < 992) {
      this.closeSidebar();
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
