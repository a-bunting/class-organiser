import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NotificationBody, NotificationButton, NotificationReturnData } from 'src/app/services/notification.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements AfterViewInit {

  @Input() title: string = null!;
  @Input() body: NotificationBody = null!;
  @Input() options: NotificationButton[] = [];

  @Output() clickListener: EventEmitter<NotificationReturnData> = new EventEmitter<NotificationReturnData>();

  optionsButtonStatus: boolean[] = [];

  constructor(
    private cdRef: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.checkDisabled();
    this.cdRef.detectChanges();
  }

  checkDisabled() : void {
    
    // all buttons enabled if no interactivity
    if(this.body.type === 'list' || this.body.type === 'text') {
      this.optionsButtonStatus = new Array(this.options.length).fill(false);
      return;
    }

    
    if(this.body.type === 'radio') {
      // radio consts
      const radioCount: number = this.body.values?.length ?? 0;
      const radios: NodeListOf<HTMLElement> = document.getElementsByName('radioGroup');

      this.optionsButtonStatus = new Array(this.options.length).fill(true);
      for(let o = 0 ; o < radios.length ; o++) {
        const radio: HTMLInputElement = radios[o] as HTMLInputElement;
        if(radio.checked) { 
          this.optionsButtonStatus = new Array(this.options.length).fill(false);
          return;
         }
      } 
    }
    
    // checkbox
    if(this.body.type === 'checkbox') {      
      for(let i = 0 ; i < this.options.length ; i++) {
        // if no conditions, return false;
        if(this.options[i].conditions === undefined) {
          this.optionsButtonStatus[i] = false;
          continue;
        }
        
        // checkbox consts
        const checkboxes: HTMLCollection = document.getElementsByClassName('checkbox');
        
        if(checkboxes.length > 0) {
          this.optionsButtonStatus[i] = !this.options[i].conditions!.every((a: boolean, i: number) => {
            const checkbox: HTMLInputElement = checkboxes[i] as HTMLInputElement;
            return (!!checkbox.checked) === a;
          })      
        }
      }
    }
  }

  executeCommand(value: number | string | boolean | null): void {

    if(value === null) {
      this.clickListener.emit([null, {}]);
      return;
    }

    if(this.body.type === 'list' || this.body.type === 'text') {
      this.clickListener.emit([value, {}]);
      return;
    }
    
    if(this.body.type === 'checkbox') {
      const checkboxCount: number = this.body.values?.length ?? 0;
      const checkboxValues: boolean[] = [];
      
      if(checkboxCount) {
        const checkboxes: HTMLCollection = document.getElementsByClassName('checkbox');
        
        for(let i = 0 ; i < checkboxes.length ; i++) {
          const checkbox: HTMLInputElement = checkboxes[i] as HTMLInputElement;
          checkboxValues.push(!!checkbox.checked);
        }
      
      }
      
      this.clickListener.emit([value, checkboxValues]);
      return;
    }

    if(this.body.type === 'radio') {
      const radioCount: number = this.body.values?.length ?? 0;
      
      if(radioCount) {
        const radios: NodeListOf<HTMLElement> = document.getElementsByName('radioGroup');
        
        for(let i = 0 ; i < radios.length ; i++) {
          const radio: HTMLInputElement = radios[i] as HTMLInputElement;
          
          if(radio.checked) {
            this.clickListener.emit([value, i]);
            return;
          }
        }
        
      }
      
      this.clickListener.emit([value, -1]);
      return;
    }

  }
}
