import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DatabaseReturn, DatabaseService } from './database.service';

export interface User {
  id: number; token: string;
  name: { forename: string, surname: string }; 
  email: string;
  institute: { id: number, name: string }
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  user: BehaviorSubject<User> = new BehaviorSubject<User>(null!);

  constructor(
    private databaseService: DatabaseService
  ) { }

  get token(): string { return this.user.value.token; }

}
