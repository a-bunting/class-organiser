import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { DatabaseReturn, DatabaseService } from 'src/app/services/database.service';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.scss']
})
export class VerifyComponent implements OnInit {

  code: string = '';
  success: boolean = false;
  verificationInProgress: boolean = false;

  constructor(
    private activeRoute: ActivatedRoute,
    private databaseService: DatabaseService
  ) {}

  ngOnInit(): void {
    this.activeRoute.paramMap.subscribe({
      next: (params: ParamMap) => {
        const codeSplit: string[] = params.get('verifyCode')?.split('&')!;
        this.validify(codeSplit[0], codeSplit[1]);
      }
    })
  }

  validify(email: string, code: string): void {
    this.verificationInProgress = true;

    this.databaseService.verifyEmail(email, code).subscribe({
      next: (result: DatabaseReturn) => {
        this.verificationInProgress = false;
        this.success = true;
      },
      error: (e: any) => { console.log(e); this.verificationInProgress = false; }
    })
  }

}
