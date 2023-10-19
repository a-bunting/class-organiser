import { Injectable } from '@angular/core';
import { Timetable } from './timetable.service';
import { Observable, take } from 'rxjs';
import { HttpClient } from '@angular/common/http'
import { environment } from 'src/environments/environment.development';

export interface DatabaseReturn {
  error: boolean; message: string; data: any
}

@Injectable({
  providedIn: 'root'
})

export class DatabaseService {

  constructor(
    private http: HttpClient
  ) { }

  // user stuff
  login(email: string, password: string): Observable<DatabaseReturn> {
    return this.http.post<DatabaseReturn>(`${environment.apiUrl}/user/login`, { email, password }).pipe(take(1));
  }

  checkAuthStatus(): Observable<DatabaseReturn> {
    return this.http.get<DatabaseReturn>(`${environment.apiUrl}/user/tokenCheck`).pipe(take(1));
  }

  sendMessage(from: string, message: string): Observable<DatabaseReturn> {
    return this.http.post<DatabaseReturn>(`${environment.apiUrl}/user/emailEnquiry`, { from, message }).pipe(take(1));
  }

  // timetable stuff
  processTimetable(timetable: Timetable): Observable<DatabaseReturn> {
    return this.http.post<DatabaseReturn>(`${environment.apiUrl}/process/timetable`, { timetable }).pipe(take(1));
  }

  retrieveSelectedTimetable(code: string, selectionId: number): Observable<DatabaseReturn> {
    return this.http.post<DatabaseReturn>(`${environment.apiUrl}/process/selectSavedItem`, { code, selectionId }).pipe(take(1));
  }

  // timetable saving etc
  saveTimetable(timetable: Timetable, deleted?: { courses: number[], classes: number[], restrictions: number[], students: number[] }): Observable<DatabaseReturn> {
    return this.http.post<DatabaseReturn>(`${environment.apiUrl}/user/saveTimetable`, { timetable, deleted }).pipe(take(1));
  }

  deleteClass(ttId: number, classId: number[]): Observable<DatabaseReturn> {
    return this.http.post<DatabaseReturn>(`${environment.apiUrl}/user/deleteClass`, { ttId, classId }).pipe(take(1));
  }
  
  // exports
  googleSheet(): Observable<DatabaseReturn> {
    return this.http.post<DatabaseReturn>(`${environment.apiUrl}/export/gSheet`, {}).pipe(take(1));
  }
  
  
  // survey
  getSurvey(code: string): Observable<DatabaseReturn> {
    return this.http.post<DatabaseReturn>(`${environment.apiUrl}/survey/get`, { code }).pipe(take(1));
  }
  


}
