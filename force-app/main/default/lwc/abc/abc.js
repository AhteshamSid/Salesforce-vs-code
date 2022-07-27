import { LightningElement, wire } from 'lwc';
import recordTypeClass from '@salesforce/apex/abcRecordType.recordTypeClass'

export default class Abc extends LightningElement { 
    @wire(recordTypeClass)
    rec

    viewRecord(event) {
        console.log(event.target.value)


    }

}