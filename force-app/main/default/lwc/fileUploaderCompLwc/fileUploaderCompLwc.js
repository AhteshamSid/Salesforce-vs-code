import { NavigationMixin } from 'lightning/navigation';
import { LightningElement, wire, api } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import CONTENTVERSION_TT_FIELD from '@salesforce/schema/ContentVersion.tt_fileupload__c';
import uploadFile from '@salesforce/apex/FileUploaderClass.uploadFile';
import {refreshApex} from '@salesforce/apex';



export default class FileUploaderCompLwc extends NavigationMixin(LightningElement) {
    @api recordId;
    value=''
    @wire(getObjectInfo, { objectApiName: 'ContentVersion' }
    )fileInfo;

    @wire(getPicklistValues,{recordTypeId: '$fileInfo.data.defaultRecordTypeId',
                            fieldApiName: CONTENTVERSION_TT_FIELD}
    )ttValues;
    
    handleChange(e){
        this.value=e.target.value;
        
        refreshApex(this.uploadFile);
    }

    get acceptedFormats() {
        return ['.pdf', '.png','.jpg','.jpeg', '.xlsx', '.xls', '.csv', '.doc', '.docx'];
    }
    
    @wire(uploadFile, {val:'$value', recordId:'$recordId'})
    uploadFile 
    
    refershLwc(){
        refreshApex(this.uploadFile)
    }



    navigateToFiles(event) {

        this[NavigationMixin.Navigate]({
          type: 'standard__namedPage',
          attributes: {
              pageName: 'filePreview'
          },
          state : {
              recordIds: event.currentTarget.dataset.value,
              selectedRecordId: event.currentTarget.dataset.value
          }
        })
        
        refreshApex(this.uploadFile)
      }


}