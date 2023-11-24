import { Component } from '@angular/core';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';
import { DatabaseReturn, DatabaseService } from 'src/app/services/database.service';

@Component({
  selector: 'app-interest',
  templateUrl: './interest.component.html',
  styleUrls: ['./interest.component.scss']
})
export class InterestComponent {

  error: string[] = [];
  thinking: boolean = false;
  complete: boolean = false;

  data: {
    name: { forename: string, surname: string },
    email: string,
    institute: {
      name: string, suffix: string, size: number
    }
  } = {
    name: { forename: '', surname: '' },
    email: '',
    institute: {
      name: '', suffix: '', size: 400
    }
  }

  constructor(
    private dbService: DatabaseService
  ) {}

  ngOnInit(): void {
  }

  highlightRequired: boolean = false;
  highlightEmails: boolean = false;
  highlightSuffix: boolean = false;
  confirmedEmail: string = '';
  isFormValid: boolean = false;

  valid(): void {
    this.highlightEmails = false;
    this.highlightRequired = false;
    this.highlightSuffix = false;
    this.error = [];

    if(!this.data.name.forename || !this.data.name.surname || !this.data.email || !this.confirmedEmail || !this.data.institute.size || !this.data.institute.name || !this.data.institute.suffix) {
      this.error.push("Please ensure you enter all required (*) data");
      this.highlightRequired = true;
    }

    if(this.confirmedEmail !== this.data.email) {
      this.error.push("Please ensure your email and confirmed email are correct");
      this.highlightEmails = true;
    }

    if(!this.isValidEmail(this.data.email)) {
      this.error.push("Please input a valid email address");
      this.highlightEmails = true;
    }

    if(!this.isValidEmail(`test@${this.data.institute.suffix}`)) {
      this.error.push("Please input a valid email suffix");
      this.highlightSuffix = true;
    }

    if(this.error.length > 0) {
      // invalid
      this.isFormValid = false;
    } else {
      this.isFormValid = true;
      this.submit();
    }
  }

  isValidEmail(email: string): boolean {
    const emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  modifySchoolSize(input: any): void {
    let size: number = +input.target.value;
    this.data.institute.size = size;
  }

  submit(): void {

    this.thinking = true;

    let message: string = `
      Forename: ${this.data.name.forename},
      Surname: ${this.data.name.surname},
      Email: ${this.data.email},
      School Name: ${this.data.institute.name},
      Suffix: ${this.data.institute.suffix},
      Size: ${this.data.institute.size}
    `;

    this.dbService.sendInterestMessage(this.data.email, message).subscribe({
      next: (result: DatabaseReturn) => {
        this.thinking = false;
        this.complete = true;
      },
      error: (err: any) => {
        this.error = [];
        this.error.push(`Apologies but your email could not be sent at this time, please try again later or directly email me at alex.bunting@gmail.com`);
        this.thinking = false;
      }
    })

  }

}
