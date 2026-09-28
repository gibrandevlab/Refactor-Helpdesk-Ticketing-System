import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    });
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() });
  }

  createUser(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data, { headers: this.getHeaders() });
  }

  updateUser(id: number | string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  deleteUser(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
