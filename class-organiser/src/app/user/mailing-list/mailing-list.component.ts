import { Component } from '@angular/core';
import { DatabaseReturn, DatabaseService } from 'src/app/services/database.service';

@Component({
  selector: 'app-mailing-list',
  templateUrl: './mailing-list.component.html',
  styleUrls: ['./mailing-list.component.scss']
})
export class MailingListComponent {

  sending: boolean = false;
  error: string[] = [];
  email: string = '';
  message: string[] = [];

  constructor(
    private databaseService: DatabaseService
  ) {}

  join(): void {

    this.sending = true;

    this.databaseService.joinMailingList(this.email).subscribe({
      next: (result: DatabaseReturn) => {
        this.sending = false;
        this.message.push("Verification Sent to your Email Address");
      },
      error: (e: any) => { console.log(e); this.sending = false; }
    })

  }

}
