import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseURL = 'http://localhost:3000';
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  // Métodos GET
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseURL}${endpoint}`, this.httpOptions);
  }

  // Métodos POST
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseURL}${endpoint}`, data, this.httpOptions);
  }

  // Métodos PUT
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseURL}${endpoint}`, data, this.httpOptions);
  }

  // Métodos DELETE
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseURL}${endpoint}`, this.httpOptions);
  }

  // Método para agregar token de autorización
  setAuthToken(token: string): void {
    this.httpOptions.headers = this.httpOptions.headers.set('Authorization', `Bearer ${token}`);
  }

  // Método para remover token
  removeAuthToken(): void {
    this.httpOptions.headers = this.httpOptions.headers.delete('Authorization');
  }
}