import { NavigationMixin } from 'lightning/navigation';
import { LightningElement, api, wire } from 'lwc';
import AccountList from '@salesforce/apex/AccountHandler.AccountList';


export default class DisplayList extends NavigationMixin(LightningElement) {
    aList = [];
    err = [];
    //using wire
    @wire(AccountList)
    aL

    //using lifecycle of lwc
    connectedCallback(){
        AccountList()
            .then(
                result=>{
                    this.aList=result;
                })
            .catch(
                error=> this.err= error
            )

    }

    viewRecord(event) {
        // Navigate to Account record page
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: event.target.value,
                objectApiName: "Account",
                actionName: 'view',
			},
		});
    }


    burn = "hi dude"
    bb = "hi dude"  
    changeHandler(event){
        this.burn = event.detail;
    }

}