import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
export default class ContSec extends LightningElement {
    @api objectApiName;
    fields = ['FirstName__C', 'LastName__C']
    FirstName='Ahtesham'
    LastName
    MiddleName
    suffix

    // @wire(getRecord, { recordId: '$recordId', fields })
    // obj;

    // get LastName() {
    //     return getFieldValue(this.obj.data, 'LastName__C');
    // }

    onFirstNameChange(e){
        this.FirstName = e.detail.value;
    }

    onFirstNameChange(e){
        this.FirstName = e.detail.value;
    }

    onLastNameChange(e){
        this.LastName = e.detail.value;
    }

    onMiddleNameChange(e){
        this.MiddleName = e.detail.value;
    }

    onSuffixChange(e){
        this.Suffix = e.detail.value;
    }
}