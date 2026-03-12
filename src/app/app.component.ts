import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  titulo = 'studytrack-web';

  loquesea = 123412;

  usuariozzz() {
    console.log('Si');
  }
}

//Githooks con angular, state management, async http client
/*
import { Component } from "@angular/core";

@Component({
    selector: 'app-root',
  templateUrl: "./app.component.html",
    styleUrls: ["./app.component.css"]
})
export class AppComponent {
  titulo = "studytrack-web";
  
  loquesea: any = 123412; 

  usuariozzz() {
    console.log("Si") ;   
  }
}
*/
