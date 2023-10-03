import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BuildTimetableComponent } from './admin/build-timetable/build-timetable.component';
import { BuildScheduleComponent } from './admin/build-schedule/build-schedule.component';
import { TimetableSettingsComponent } from './admin/build-timetable/timetable-settings/timetable-settings.component';
import { TimetableBuilderComponent } from './testing/timetable-builder/timetable-builder.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LoadingSpinnerComponent } from './utilities/loading-spinner/loading-spinner.component';
import { AddCsvDataComponent } from './testing/add-csv-data/add-csv-data.component';

@NgModule({
  declarations: [
    AppComponent,
    BuildTimetableComponent,
    BuildScheduleComponent,
    TimetableSettingsComponent,
    TimetableBuilderComponent,
    LoadingSpinnerComponent,
    AddCsvDataComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
