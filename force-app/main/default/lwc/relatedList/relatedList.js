import { LightningElement, wire, api } from 'lwc';
import getContactsRelatedToAccount from '@salesforce/apex/relatedListLwc.getContactsRelatedToAccount';


export default class RelatedList extends LightningElement {
    @api recordId;
    columns = [
        { label: 'First Name', fieldName: 'FirstName', type: 'text' },
        { label: 'Last Name', fieldName: 'LastName', type: 'text' },
        { label: 'Email', fieldName: 'Email'},
        { label: 'Phone', fieldName: 'Phone'}
    ];
    contacts;
    error;
    @wire(getContactsRelatedToAccount, {accId: '$recordId'}) 
    WireContactRecords({error, data}){
        if(data){
            this.contacts = data;
            this.error = undefined;
        }else{
            this.error = error;
            this.contacts = undefined;
        }
    }
}