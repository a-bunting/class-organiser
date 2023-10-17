import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DatabaseReturn, DatabaseService } from '../services/database.service';

@Injectable({providedIn: 'root'})

export class AuthGuard {

  constructor(
    private router: Router,
    private dbService: DatabaseService
  ) {}

  canActivate() {
    this.dbService.checkAuthStatus().subscribe({
      next: (result: DatabaseReturn) => {
        console.log(`true`);
        if(!result.error) return true;
        else return false;
      },
      error: (e: any) => {
        console.log(`false`);
        return this.router.createUrlTree(['/start']);
      }
    })
  }
};

