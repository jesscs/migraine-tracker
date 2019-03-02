import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {HomePage} from "../home/home";
import {CouchDbServiceProvider} from "../../providers/couch-db-service/couch-db-service";
import {GlobalFunctionsServiceProvider} from "../../providers/global-functions-service/global-functions-service";



@Component({
  selector: 'page-track-data',
  templateUrl: 'track-data.html',
})
export class TrackDataPage {

  private tracked = {};
  private buttonColors = {};
  private goalProgresses = {};
  private dataType;
  private dataToTrack = [];
  private trackedSoFar;
  private numList;
  private previouslyTracked;
  somethingTracked;
  durationItemStart = {};
  durationItemEnd ={};


  constructor(public navCtrl: NavController, public navParams: NavParams,
              private couchDBService: CouchDbServiceProvider, private globalFunctions: GlobalFunctionsServiceProvider) {
    this.numList = Array.from(new Array(10),(val,index)=>index+1);
    this.previouslyTracked = couchDBService.getTrackedData();
  }

  ionViewDidLoad() {
    this.dataType = this.navParams.data['currentDataType'];
    this.dataToTrack = this.navParams.data['dataDict'][this.dataType];
    this.trackedSoFar = this.navParams.data['tracked'];

    if(!('tracked' in this.navParams.data)) {
      this.navParams.data['tracked'] = {};
    }

    this.calculateGoalProgresses();
  }

  getColor(data, value) {
    if(this.buttonColors[data.name] === undefined){
      this.buttonColors[data.name] = {value: 'light'};
      return 'light';
    }
    else if (this.buttonColors[data.name][value] === undefined) {
      this.buttonColors[data.name][value] = 'light';
      return 'light';
    }
    return this.buttonColors[data.name][value];
  }


  calculateGoalProgresses() {
    for(let i=0; i<this.dataToTrack.length; i++){
      let data = this.dataToTrack[i];
      if(data.goal && data.goal.freq) {
        this.goalProgresses[data.name] =
          this.globalFunctions.calculatePriorGoalProgress(data, this.dataType, this.previouslyTracked);
      }
    }
  }


  totalTrackedTimes(data) {
    if(data.name === 'Frequent Use of Medications'){
      let dataName = 'As-needed medications today';
      let timesSoFar = this.globalFunctions.calculatePriorGoalProgress({'name': dataName, 'field': 'Number'},
        'Treatments', this.previouslyTracked, data.goal.timespan);
      if(!this.trackedSoFar['Treatments'] || !this.trackedSoFar['Treatments'][dataName]){
        return timesSoFar;
      }
      return Number(this.trackedSoFar['Treatments'][dataName]) + timesSoFar;
    }
    let timesSoFar = this.goalProgresses[data.name];
    if(this.tracked[data.name] !== 'undefined' && !isNaN(this.tracked[data.name])){
      if(data.field === 'number'){
        timesSoFar += Number(this.tracked[data.name]);
      }
      else if(data.field !== 'binary' || this.tracked[data.name] === true){
        timesSoFar += 1;
      }
    }
    return timesSoFar;
  }


  goalProgress(data){
    if(this.dataType==='Symptoms'){
      return 'no feedback';
    }
    let timesTracked = this.totalTrackedTimes(data);
    if(timesTracked > data.goal.threshold){
      if(data.goal.freq === 'More'){
        return 'met';
      }
      return 'over'
    }
    else if(timesTracked === data.goal.threshold){
      if(data.goal.freq === 'More'){
        return 'met';
      }
      return 'at limit';
    }
    else{
      if(data.goal.freq === 'More'){
        return 'under';
      }
      return 'below limit';
    }
  }


  catScale(data, value) {
    if(this.tracked[data.name]){
      this.buttonColors[data.name][this.tracked[data.name]] = 'light';
    }
    this.buttonColors[data.name][value] = 'primary';
    this.tracked[data.name] = value;
    this.itemTracked();
  }

  itemTracked() {
    this.somethingTracked = true;
  }

  addDurationItems(dict, endPoint){
    let dataNames = Object.keys(dict);
    for(let i=0; i<dataNames.length; i++){
      if(!this.tracked[dataNames[i]]){
        this.tracked[dataNames[i]] = {};
      }
      this.tracked[dataNames[i]][endPoint] = dict[dataNames[i]];
    }
  }

  continueTracking() {
    if(this.somethingTracked){
      this.addDurationItems(this.durationItemStart, 'start');
      this.addDurationItems(this.durationItemEnd, 'end');
      this.navParams.data.tracked[this.dataType] = this.tracked;
    }

    let newIndex = this.navParams.data['allDataTypes'].indexOf(this.dataType)+1;
    if(newIndex < this.navParams.data['allDataTypes'].length){
      this.navParams.data['currentDataType'] = this.navParams.data['allDataTypes'][newIndex];
      this.navCtrl.push(TrackDataPage, this.navParams.data);
    }
    else {
      this.navParams.data['tracked']['dateTracked'] = new Date();
      this.couchDBService.trackData(this.navParams.data['tracked']);
      this.navCtrl.setRoot(HomePage, {'trackedData': this.navParams.data['tracked']});
    }
  }

}
