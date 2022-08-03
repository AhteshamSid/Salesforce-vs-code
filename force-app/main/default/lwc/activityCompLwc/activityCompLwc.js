import { LightningElement, wire, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import activityEvent from '@salesforce/apex/activityHandler.activityEvent';
import activityTask from '@salesforce/apex/activityHandler.activityTask';
const col= [
    { label: 'Subject', fieldName: 'Subject', type: 'text', editable: true },
    { label: 'Description', fieldName: 'Description', type: 'text', editable: true },
    { label: 'Related to', fieldName: 'WhatName', type: 'text' }
];
export default class ActivityCompLwc extends NavigationMixin(LightningElement) {
    @api recordId
    aT=[];
    @wire(activityEvent, {aId: '$recordId'})
    aE 
    @wire(activityTask, {aId: '$recordId'})
    opp({error, data}) {
        if(data) {
             var currentData = [];
             data.forEach((row) => {
                var rowData = {};
                rowData.Description = row.Description;
                rowData.Subject = row.Subject;
                
                // Account related data
                if (row.What) {
                    rowData.WhatName = row.What.Name;
                }
                currentData.push(rowData);
            });

            this.aT = currentData;
        }
        if(error) {console.log("error--------"+ error)}
    } 
    
    cC = col;
    df=[]
}