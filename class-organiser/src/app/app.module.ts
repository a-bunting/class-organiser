import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BuildTimetableComponent } from './admin/build-timetable/build-timetable.component';
import { TimetableSettingsComponent } from './admin/build-timetable/timetable-settings/timetable-settings.component';
import { HttpClientModule } from '@angular/common/http';
import { LoadingSpinnerComponent } from './utilities/loading-spinner/loading-spinner.component';
import { AddCsvDataComponent } from './testing/add-csv-data/add-csv-data.component';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { StudentDataComponent } from './students/student-data/student-data.component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { TooltipComponent } from './directives/tooltip/tooltip.component';
import { TooltipModule } from './directives/tooltip/tooltip.module';
import { OrdinalPipe } from './utilities/ordinal.pipe';

@NgModule({
  declarations: [
    AppComponent,
    BuildTimetableComponent,
    TimetableSettingsComponent,
    LoadingSpinnerComponent,
    AddCsvDataComponent,
    StudentDataComponent,
    TooltipComponent,
    OrdinalPipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    DragDropModule,
    FormsModule,
    TooltipModule
  ],
  providers: [{provide: LocationStrategy, useClass: HashLocationStrategy}],
  bootstrap: [AppComponent]
})
export class AppModule { }
