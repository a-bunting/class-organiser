import { Component } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent {
  constructor(
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    this.authService.checkLoggedInStatus();
  }
}
