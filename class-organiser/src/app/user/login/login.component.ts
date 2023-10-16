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

  constructor(
    private authService: AuthenticationService, 
    private databaseService: DatabaseService,
    private router: Router
  
   ) {}

  login(): void {
    if(!this.email || !this.password) return;
  
    this.databaseService.login(this.email, this.password).subscribe({
      next: (result: DatabaseReturn) => {
        console.log(result);
        this.authService.user.next(result.data);
        // this.router.navigate(['']);
      },
      error: (e: any) => {
        this.error = e.error.message;
        console.log(`Error: ${e}`);
      }
    })  
  }

}
