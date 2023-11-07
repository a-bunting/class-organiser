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
import { SelectTimetableTypeComponent } from './timetables/select-timetable-type/select-timetable-type.component';
import { StudentPriorityComponent } from './views/student-priority/student-priority.component';
import { ClassPriorityComponent } from './views/class-priority/class-priority.component';


const routes: Routes = [
  { path: 'survey', component: DataCollectionComponent },
  { path: 'survey/:code', component: DataCollectionComponent },
  { path: 'start', component: StartComponent, children: [
    { path: '', component: LoginComponent },
    { path: 'register', component: RegisterComponent }
  ] },
  { path: '', component: TimetablesComponent, canActivate: [AuthGuard], children: [
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
