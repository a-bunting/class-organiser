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
  email: string = 'alex.bunting@gmail.com';

  constructor(
    private databaseService: DatabaseService
  ) {}

  join(): void {

    this.databaseService.joinMailingList(this.email).subscribe({
      next: (result: DatabaseReturn) => {
        console.log(result);
      },
      error: (e: any) => { console.log(e) }
    })

  }

}
