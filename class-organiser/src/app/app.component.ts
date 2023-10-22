import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from './services/authentication.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'class-organiser';

  constructor(
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.authService.checkLoggedInStatus();
  }
}
