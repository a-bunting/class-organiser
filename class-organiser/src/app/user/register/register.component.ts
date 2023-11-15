import { Component } from '@angular/core';
import { DatabaseReturn, DatabaseService } from 'src/app/services/database.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  email: string= '';
  message: string= '';
  sendingEmail: boolean = false;
  error: string = '';
  emailSent: boolean = false;

  constructor(
    private dbService: DatabaseService
  ) {}

  sendEmail(): void {

    if(!this.email && !this.message) {
      this.error = `Please fill in all fields`;
      return;
    }

    this.sendingEmail = true;

    this.dbService.sendMessage(this.email, this.message).subscribe({
      next: (result: DatabaseReturn) => {
        this.sendingEmail = false;
        this.emailSent = true;
      },
      error: (err: any) => {
        this.error = `Apologies but your email could not be sent at this time, please try again later or directly email me at alex.bunting@gmail.com`;
        this.sendingEmail = false;
        console.log(`Error: ${err}`)
      }
    })

  }

}
