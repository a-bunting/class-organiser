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


    // const url = 'https://api.emailjs.com/api/v1.0/email/send';

    // const data = {
    //     service_id: 'service_1tfvcqe',
    //     template_id: 'template_y652eg4',
    //     user_id: 'user_1ystzLQ4lPxmWtXLAH0Op',
    //     template_params: {
    //         'email':this.email,
    //         'message': this.message
    //     }
    // };

    // const emailjs: SMTPClient = new SMTPClient({

    // });

    // emailjs
    // .send(data.service_id, data.template_id, data.template_params, data.user_id)
    // .then(response => {
    //     if(response.status === 200) {
    //         const successBox = document.createElement('div');
    //         successBox.classList.add('contact__sent');
    //         successBox.innerHTML = "<p>Your message has been sent</p>";

    //         document.getElementById("contact__form").appendChild(successBox);
    //         document.getElementById("contact").classList.add('fadeout');

    //         setContactMessage("")
    //     }
    // })
    // .catch(error => {
    //     const message = "Your message was not sent. Please try again or email me directly at <a href='mailto:alex.bunting@gmail.com'>alex.bunting@gmail.com</a>.";
    //     setContactMessage(message);
    //     contactInputToggle(true);
    //     document.getElementById('contact').removeChild(spinner);
    // });

  }

}
