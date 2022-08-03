import { LightningElement, wire} from 'lwc';
import ContactList from '@salesforce/apex/AccountHandler.ContactList';
import AccountList from '@salesforce/apex/AccountHandler.AccountList';
import retriveSquare from '@salesforce/apex/squareAPI.retriveSquare';
import {refreshApex} from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import {updateRecord} from 'lightning/uiRecordApi'


const columns = [
    
    { label: 'Name', fieldName: 'Name', type: 'text', editable: true },
    { label: 'Rating', fieldName: 'Rating', type: 'text', editable: true },
    { label: 'Industry', fieldName: 'Industry', type: 'text', editable: true},
    // Other column data here
    { label: 'Action', type: 'button-icon', initialWidth: 75, 
        typeAttributes: { iconName: 'action:preview', 
                            title: 'Preview', variant: 'border-filled', 
                            alternativeText: 'View' 
                        } 
    } 
];

const col= [
    { label: 'First Name', fieldName: 'FirstName', type: 'text', editable: true },
    { label: 'Last Name', fieldName: 'LastName', type: 'text', editable: true },
    { label: 'Email', fieldName: 'Email', type: 'email', editable: true },
    { label: 'Account Name', fieldName: 'AccountName', type: 'text' }
];

export default class AccountContactsPopupList extends LightningElement {
    @wire(AccountList)
    aL;
    accId='';
    bb='Account'
    cA=columns;
    cC = col;

    cL=[];
    @wire(ContactList, {accId: '$accId'}) 
    opp({error, data}) {
        if(data) {
             var currentData = [];
             data.forEach((row) => {
                var rowData = {};
                rowData.LastName = row.LastName;
                rowData.FirstName = row.FirstName;
                rowData.Email = row.Email;
                
                // Account related data
                if (row.Account) {
                    rowData.AccountName = row.Account.Name;
                }
                currentData.push(rowData);
            });

            this.cL = currentData;
        }
        if(error) {console.log("error--------"+ error)}
    }
    
    handleRowSelect(e){
        const row = e.detail.row;
        this.accId = row.Id ;
        this.bb = row.Name;
        this.showModal = true;
     }

    showModal = false;
    closeModal() {
        this.showModal = false;
    }

    df=[]
    handleSave(event){
        const recordInputs = event.detail.draftValues.slice().map(draft=>{
            const fields = Object.assign({}, draft)
            return {fields}
        })

        const promises = recordInputs.map(recordInput => updateRecord(recordInput))
        Promise.all(promises).then(result=>{
            this.showToastMsg('Success', 'Contacts updated')
            this.df=[]
            refreshApex(this.aL)
        }).catch(error=>{
            this.showToastMsg('Error creating record', error.body.message, error)
        })
    }
    showToastMsg(title, message, variant){
        this.dispatchEvent(
            new ShowToastEvent({
                title:title,
                message:message,
                variant:variant||'success'
            })
        )
    }
		
		
    @wire(retriveSquare) btn;
		conectedcallback(){
				console.log('btn======>' + btn.data);
		}
		
}