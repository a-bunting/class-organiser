import { ComponentRef, ViewContainerRef } from '@angular/core';
import { NotificationComponent } from '../utilities/notification/notification.component';
import { finalize, Observable, take } from 'rxjs';

export type NotificationReturnData = [string | number | boolean | null, object | number | boolean[] ];

export interface NotificationButton {
  returnValue: number | string | boolean | null;
  text: string;
  conditions?: boolean[];
}

export interface NotificationBody {
  type: 'text' | 'list' | 'checkbox' | 'radio';
  text?: string; // this is the text that always goes at the top, above any lists or checkboxes
  values?: { text: string, default?: boolean, selected?: boolean }[] // this is a list of the text to go in the list or checkboxes
}

export class NotificationService {

  private componentRef: ComponentRef<NotificationComponent> = null!;

  // needs passing as its a service.
  private viewContainerRef: ViewContainerRef = null!;

  set setViewContainerRef(viewContainerRef: ViewContainerRef) { this.viewContainerRef = viewContainerRef; }

  createNewNotification(title: string, body: NotificationBody, options: NotificationButton[]): Observable<NotificationReturnData> {
    this.componentRef = this.viewContainerRef.createComponent(NotificationComponent);
    this.componentRef.setInput('title', title);
    this.componentRef.setInput('body', body);
    this.componentRef.setInput('options', options);
    document.body.appendChild(this.componentRef.location.nativeElement);
    
    return this.componentRef.instance.clickListener.pipe(
      take(1), 
      finalize(() => { this.destroyNotification() }
    ));
  }

  destroyNotification(): void {
    if(this.componentRef !== null) {
      try {
        document.body.removeChild(this.componentRef.location.nativeElement);
        this.viewContainerRef.clear();
        this.componentRef.destroy();
        this.componentRef = null!;
      } catch (e: unknown) {
        //
      }
    }
  }
}
