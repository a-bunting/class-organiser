import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BuildTimetableComponent } from './admin/build-timetable/build-timetable.component';
import { TimetableSettingsComponent } from './admin/build-timetable/timetable-settings/timetable-settings.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { LoadingSpinnerComponent } from './utilities/loading-spinner/loading-spinner.component';
import { AddCsvDataComponent } from './testing/add-csv-data/add-csv-data.component';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { StudentDataComponent } from './students/student-data/student-data.component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { TooltipComponent } from './directives/tooltip/tooltip.component';
import { TooltipModule } from './directives/tooltip/tooltip.module';
import { OrdinalPipe } from './utilities/ordinal.pipe';
import { LoginComponent } from './user/login/login.component';
import { RegisterComponent } from './user/register/register.component';
import { TimetablesComponent } from './timetables/timetables.component';
import { StartComponent } from './start/start.component';
import { AuthInterceptor } from './interceptors/auth-interceptor';

@NgModule({
  declarations: [
    AppComponent,
    BuildTimetableComponent,
    TimetableSettingsComponent,
    LoadingSpinnerComponent,
    AddCsvDataComponent,
    StudentDataComponent,
    TooltipComponent,
    OrdinalPipe,
    LoginComponent,
    RegisterComponent,
    TimetablesComponent,
    StartComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    DragDropModule,
    FormsModule,
    TooltipModule
  ],
  providers: [
    Title,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    {provide: LocationStrategy, useClass: HashLocationStrategy}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
