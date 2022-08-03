import { LightningElement, wire, api } from 'lwc';
import { getRecord, getFieldName } from 'lightning/uiRecordApi';
import oList from '@salesforce/apex/OppList.oList';
import accountDetails from '@salesforce/apex/OppList.accountDetails';
import NAME_FIELD from '@salesforce/schema/Opportunity.Name';
import CLOSEDATE_FEILD from '@salesforce/schema/Opportunity.CloseDate';
import STAGENAME_FIELD from '@salesforce/schema/Opportunity.StageName';
export default class Lwc2 extends LightningElement {
    burn = "hi dude"
    changeHandler(event){
        this.burn = event.detail;
    }









    @api
    recordId
    oL
    err
    fields=[
        {lable:'Name', fieldName: 'Name', type: 'Text'}
    ];


    @wire(oList)
    bigB({error, data}) {
        if (data) {
            this.oL = data;
            this.err = undefined;
        } else if(error){
            this.err = error;
            this.oL = undefined;
        }
    }
    @wire(accountDetails, {oId: '$recordId'})
    account;
    flds=[NAME_FIELD, CLOSEDATE_FEILD, STAGENAME_FIELD];
}