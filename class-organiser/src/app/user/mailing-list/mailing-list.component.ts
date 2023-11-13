import { Component } from '@angular/core';

@Component({
  selector: 'app-mailing-list',
  templateUrl: './mailing-list.component.html',
  styleUrls: ['./mailing-list.component.scss']
})
export class MailingListComponent {

  sending: boolean = false;
  error: string[] = [];
  email: string = '';

  join(): void {

  }

}
