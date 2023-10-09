import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BuildTimetableComponent } from './admin/build-timetable/build-timetable.component';
import { StudentDataComponent } from './students/student-data/student-data.component';


const routes: Routes = [
  { path: 'timetables', component: BuildTimetableComponent },
  { path: 'students', component: StudentDataComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
