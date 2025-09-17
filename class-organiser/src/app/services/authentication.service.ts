import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
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
    private databaseService: DatabaseService,
    private router: Router
  ) {}

  get forename(): string { return `${this.user.value.name.forename}`; }
  get surname(): string { return `${this.user.value.name.surname}`; }
  token(): string { return this.user.value ? this.user.value.token : undefined!; }

  loginNewUser(user: User): void {
    this.setLocal(user);
    this.user.next(user);
    this.router.navigate(['dashboard']);
  }

  setLocal(user: User): void {
    window.localStorage.setItem('classOrganiser-user', JSON.stringify(user));
  }

  clearLocal(): void {
    window.localStorage.removeItem('classOrganiser');
    window.localStorage.removeItem('classOrganiser-user');
  }

  // called when the app is loaded
  checkLoggedInStatus(): void {
    const userFromLocal: User = JSON.parse(window.localStorage.getItem('classOrganiser-user')!);

    if(userFromLocal) {

      this.user.next(userFromLocal);

      // check the token is still valid
      this.databaseService.checkAuthStatus().subscribe({
        next: (result: DatabaseReturn) => {
          if(!result.error) this.router.navigate(['dashboard']);
          else {
            this.clearLocal();
            this.router.navigate(['']);
          }
        },
        error: (e: any) => {
          this.clearLocal();
          this.router.navigate(['']);
        }
      })
    }
  }

  logOut(): void {
    this.clearLocal();
    this.router.navigate(['']);
  }

}
