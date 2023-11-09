import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BuildTimetableComponent } from './admin/build-timetable/build-timetable.component';
import { TimetableSettingsComponent } from './admin/build-timetable/timetable-settings/timetable-settings.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { LoadingSpinnerComponent } from './utilities/loading-spinner/loading-spinner.component';

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
import { AuthGuard } from './guards/auth.guard';
import { SmallLoaderComponent } from './utilities/small-loader/small-loader.component';
import { DataCollectionComponent } from './data-collection/data-collection.component';

import { ColorPickerModule } from 'ngx-color-picker';
import { SelectTimetableTypeComponent } from './timetables/select-timetable-type/select-timetable-type.component';
import { ClassPriorityComponent } from './views/class-priority/class-priority.component';
import { StudentPriorityComponent } from './views/student-priority/student-priority.component';
import { UnlockComponent } from './timetables/unlock/unlock.component';
import { InterestComponent } from './user/interest/interest.component';

@NgModule({
  declarations: [
    AppComponent,
    BuildTimetableComponent,
    TimetableSettingsComponent,
    LoadingSpinnerComponent,
    StudentDataComponent,
    TooltipComponent,
    OrdinalPipe,
    LoginComponent,
    RegisterComponent,
    TimetablesComponent,
    StartComponent,
    SmallLoaderComponent,
    DataCollectionComponent,
    SelectTimetableTypeComponent,
    ClassPriorityComponent,
    StudentPriorityComponent,
    UnlockComponent,
    InterestComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    DragDropModule,
    FormsModule,
    TooltipModule,
    ColorPickerModule
  ],
  providers: [
    Title,
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    {provide: LocationStrategy, useClass: HashLocationStrategy}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
