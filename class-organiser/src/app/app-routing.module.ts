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


const routes: Routes = [
  { path: 'start', component: StartComponent, children: [
    { path: '', component: LoginComponent },
    { path: 'register', component: RegisterComponent }
  ] },
  { path: '', component: TimetablesComponent, canActivate: [AuthGuard], children: [
    { path: 'timetables', component: BuildTimetableComponent },
    { path: 'students', component: StudentDataComponent }
  ]}, 
  { path: 'survey', component: DataCollectionComponent },
  { path: 'survey/:code', component: DataCollectionComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
