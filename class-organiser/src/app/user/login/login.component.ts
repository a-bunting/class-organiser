import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { DatabaseReturn, DatabaseService } from 'src/app/services/database.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  email: string = '';
  password: string = '';
  error: string = '';
  loggingIn: boolean = false;

  constructor(
    private authService: AuthenticationService,
    private databaseService: DatabaseService,
   ) {}

  login(): void {
    if(!this.email || !this.password) return;

    this.loggingIn = true;

    this.databaseService.login(this.email, this.password).subscribe({
      next: (result: DatabaseReturn) => {
        this.loggingIn = false;
        this.authService.loginNewUser(result.data);
      },
      error: (e: any) => {
        this.error = e;
        this.loggingIn = false;
        console.log(`Error: ${e}`);
      }
    })
  }

}
