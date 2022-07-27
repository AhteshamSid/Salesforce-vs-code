import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import oppRec from '@salesforce/apex/OppRecordType.oppRec';

export default class ProLwc extends NavigationMixin(LightningElement) {
    
    navigateToNewCase() {
    this[NavigationMixin.Navigate]({
        type: 'standard__objectPage',
        attributes: {
            objectApiName: 'Case',
            actionName: 'new'
        }
    });
   }



   f1=false;
   handlePopIn() {
    this.f1 = true
  }
   handlePopOut() {
    this.f1 = false
  }



@wire(oppRec)
rL
get getrL() {
    var returnOptions = [];
    if(this.rL.data){
        this.rL.data.forEach(ele =>{
            returnOptions.push({label:ele.Name , value:ele.Id});
        }); 
    }
    console.log(JSON.stringify(returnOptions));
    return returnOptions;
}
value='';
handleChange(e){
    const iid = e.target.value;
        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Opportunity',
                actionName: 'new'
            },
            state: { recordTypeId:iid } 
        });
}

}