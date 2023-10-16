import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BuildTimetableComponent } from './admin/build-timetable/build-timetable.component';
import { StartComponent } from './start/start.component';
import { StudentDataComponent } from './students/student-data/student-data.component';
import { TimetablesComponent } from './timetables/timetables.component';
import { LoginComponent } from './user/login/login.component';
import { RegisterComponent } from './user/register/register.component';


const routes: Routes = [
  { path: 'front', component: StartComponent, children: [
    { path: '', component: LoginComponent },
    { path: 'register', component: RegisterComponent }
  ] },
  { path: '', component: TimetablesComponent, children: [
    { path: 'timetables', component: BuildTimetableComponent },
    { path: 'students', component: StudentDataComponent }
  ]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
