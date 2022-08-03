import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import oppRec from '@salesforce/apex/OppRecordType.oppRec';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import ACCOUNT_FUNDRAISING_TARGET from '@salesforce/schema/Opportunity.Fundraising_target__c';


export default class OppRecLwc extends NavigationMixin(LightningElement) {
    showModal=false
    closeModal(){  this.pL=false;}


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
    pL=false;
    handleChange(e){

        const iid = e.target.value;
        if(iid=='0125h000000tfW6AAI') {this.pL=true;}
        else{
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


    @wire(getPicklistValues,{recordTypeId: '0125h000000tfW6AAI',
                            fieldApiName: ACCOUNT_FUNDRAISING_TARGET}
    )ttValues;
    picklistValue=''
    fundraisingChange(e){
        picklistValue = e.target.value;
        
    }
            
    

}