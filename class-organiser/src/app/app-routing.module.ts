import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BuildScheduleComponent } from './admin/build-schedule/build-schedule.component';
import { BuildTimetableComponent } from './admin/build-timetable/build-timetable.component';
import { AddCsvDataComponent } from './testing/add-csv-data/add-csv-data.component';
import { StudentDataComponent } from './students/student-data/student-data.component';


const routes: Routes = [
  { path: 'timetables', component: BuildTimetableComponent },
  { path: 'csv', component: AddCsvDataComponent },
  { path: 'students', component: StudentDataComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
