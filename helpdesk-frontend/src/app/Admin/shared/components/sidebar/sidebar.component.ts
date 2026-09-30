import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
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
  @Input() waitingApproval: number = 0;
  @Output() closeSidebar = new EventEmitter<void>();

  activeMenu: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.updateActiveMenu(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateActiveMenu(event.urlAfterRedirects);
      });
  }

  private updateActiveMenu(url: string) {
    const segments = url.split('/').filter(s => s);
    this.activeMenu = segments[segments.length - 1] || 'dashboard';
  }

  toggleSidebar() {
    this.closeSidebar.emit();
  }

  navigateTo(path: string) {
    this.router.navigate([`/${path}`]);
    if (window.innerWidth < 768) {
      this.closeSidebar.emit();
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
