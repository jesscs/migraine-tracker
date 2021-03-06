import { Component } from '@angular/core';
import {NavParams, ViewController} from 'ionic-angular';
import {DataDetailsServiceProvider} from "../../../providers/data-details-service/data-details-service";
import {GoalDetailsServiceProvider} from "../../../providers/goal-details-service/goal-details-service";
import {DataElement, DataField} from "../../../interfaces/customTypes";

/**
 * Generated class for the EditDataPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-edit-data',
  templateUrl: 'edit-data.html',
})
export class EditDataPage {

  private data : DataElement = null;
  private dataType : string;
  private goalList = [];
  private fieldList : DataField[]= [];
  private allowsGoals: boolean;
  private somethingEdited : boolean = false;
  private fieldButtonsExpanded : boolean = false;
  private goalFreqExpanded : boolean = false;
  private goalTimeExpanded : boolean = false;
  private isCustom : boolean = false;
  private isNew : boolean = false;

  constructor(public navParams: NavParams,
              public viewCtrl: ViewController,
              public dataDetails: DataDetailsServiceProvider,
              public goalDetails: GoalDetailsServiceProvider) {
    this.allowsGoals = navParams.data['allowsDataGoals'];
    this.dataType = navParams.data['dataType'];
    this.data = navParams.data['data'];
    if(!this.data['name']) this.isNew = true;
    if(this.data.recommendingGoals) this.getRecommendingGoals();
    this.isCustom = this.data.custom;
    if(!this.data.field && this.data.recommendedField) this.data.field = this.data.recommendedField;
    if(!this.data.goal){
      if(this.data.suggestedGoal) this.data.goal = this.data.suggestedGoal;
      else this.data.goal = {'freq': null, 'threshold': null, 'timespan': null};
    }
  }

  ionViewDidLoad() {
    this.fieldList = this.dataDetails.getSupportedFields();
  }

  getRecommendingGoals(){
    for(let i=0; i<this.data.recommendingGoals.length; i++){
      if(this.navParams.data['selectedGoals'].indexOf(this.data.recommendingGoals[i]) > -1){
        let goal = this.goalDetails.getGoalByID(this.data.recommendingGoals[i], true, false);
        if(goal) this.goalList.push(goal['name']);
      }
    }
  }


  expandField(data : DataElement){
    if(!data.fieldSet) this.fieldButtonsExpanded = !this.fieldButtonsExpanded;
  }


  editedField(field : DataField){
    this.somethingEdited = true;
    this.fieldButtonsExpanded = false;
    this.data.field = field['name'];

    if(this.data.field === this.data.recommendedField){
      this.data.explanation = this.data['fieldDescription'];
      if(this.data.suggestedGoal && !this.data.goal['freq']){
        this.data.goal = this.data.suggestedGoal;
      }
    }
    else{
      this.data.explanation = field['explanation'];
      this.data.goal = {'freq': null, 'threshold': null, 'timespan': null}; // because they don't make sense across fields
    }
  }

  editedGoal(goal : string, val : any=null){
    this.somethingEdited = true;
    this.goalTimeExpanded = false;
    this.goalFreqExpanded = false;
    if(goal==='remove'){
      this.data.goal = {'freq': null, 'threshold': null, 'timespan': null};
    }
    else{
      this.data.goal[goal] = val;
    }
  }


  backToConfig(choice : string){
    if(choice==='add') {
      this.viewCtrl.dismiss(this.data);
    }
    else if(choice=='remove'){
      this.viewCtrl.dismiss('remove');
    }
    else {
      this.viewCtrl.dismiss();
    }
  }

}
