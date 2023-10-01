import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BuildScheduleComponent } from './admin/build-schedule/build-schedule.component';
import { BuildTimetableComponent } from './admin/build-timetable/build-timetable.component';
import { TimetableBuilderComponent } from './testing/timetable-builder/timetable-builder.component';


const routes: Routes = [
  { path: 'schedules', component: BuildScheduleComponent },
  { path: 'timetables', component: BuildTimetableComponent },
  { path: 'test', component: TimetableBuilderComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
