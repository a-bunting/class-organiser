import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BuildTimetableComponent } from './admin/build-timetable/build-timetable.component';
import { AuthGuard } from './guards/auth.guard';
import { StartComponent } from './start/start.component';
import { StudentDataComponent } from './students/student-data/student-data.component';
import { TimetablesComponent } from './timetables/timetables.component';
import { LoginComponent } from './user/login/login.component';
import { RegisterComponent } from './user/register/register.component';
import { DataCollectionComponent } from './data-collection/data-collection.component';
import { StudentPriorityComponent } from './views/student-priority/student-priority.component';
import { ClassPriorityComponent } from './views/class-priority/class-priority.component';
import { InterestComponent } from './user/interest/interest.component';
import { MailingListComponent } from './user/mailing-list/mailing-list.component';
import { VerifyComponent } from './user/verify/verify.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { PrivacyComponent } from './welcome/privacy/privacy.component';
import { TermsComponent } from './welcome/terms/terms.component';


const routes: Routes = [
  { path: '', component: WelcomeComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'verify/:verifyCode', component: VerifyComponent },
  // { path: '', component: StartComponent, children: [
  //   { path: '', component: LoginComponent },
  //   { path: 'message', component: RegisterComponent },
  //   { path: 'login', component: LoginComponent },
  //   { path: 'mailinglist', component: MailingListComponent },
  // ] },
  { path: 'register', component: InterestComponent },
  { path: 'survey', component: DataCollectionComponent },
  { path: 'survey/:code', component: DataCollectionComponent },
  { path: 'dashboard', component: TimetablesComponent, canActivate: [AuthGuard], children: [
    { path: 'timetables', component: BuildTimetableComponent, children: [
      { path: 'classes', component: ClassPriorityComponent },
      { path: 'groups', component: StudentPriorityComponent }
    ] },
    { path: 'students', component: StudentDataComponent }
  ]},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
