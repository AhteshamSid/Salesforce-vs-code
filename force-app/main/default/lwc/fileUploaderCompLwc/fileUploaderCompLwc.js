import { NavigationMixin } from 'lightning/navigation';
import { LightningElement, wire, api } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import CONTENTVERSION_TT_FIELD from '@salesforce/schema/ContentVersion.tt_fileupload__c';
import uploadFile from '@salesforce/apex/FileUploaderClass.uploadFile';
import {refreshApex} from '@salesforce/apex';



const columns = [
    { label: 'Title', fieldName: 'Title' }, 
    { label: 'CreatedDate', fieldName: 'CreatedDate', type: 'date',sortable: true,
                            cellAttributes: {
                                iconName: 'utility:event',
                                iconAlternativeText: 'Close Date', }, },
    { label: 'size', fieldName: 'recordSize__c' }, 
    { label: 'FileExtension', fieldName: 'FileExtension' },
    { label: 'Action', type: 'button-icon', initialWidth: 75, 
    typeAttributes: { iconName: 'action:preview', 
                 title: 'Preview', variant: 'border-filled', 
                 alternativeText: 'View' 
               } 
    }
];
export default class FileUploaderCompLwc extends NavigationMixin(LightningElement) {
    @api recordId;
    value='';
    columns = columns;
    //datas=[];
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
    uploadFile; 
 /*   opp(result) {
        if(result.data) {
            var currentData = [];
            data.forEach((row) => {
                var rowData = {};
                rowData.Title = row.Title;
                rowData.FileExtension = row.FileExtension;
                rowData.CreatedDate = row.CreatedDate;
              //  rowData.ContentSize = this.formatBytes(row.ContentSize, 2);
                currentData.push(rowData);
            });
            this.datas = currentData;
        }
        else if(result.error){window.console.log(result.error);}
    }
    formatBytes(bytes,decimals) {
        if(bytes == 0) return '0 Bytes';
        var k = 1024,
            dm = decimals || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    } */ 

    
    navigateToFiles(event) {
        let eId = event.currentTarget.dataset.value;
        this[NavigationMixin.Navigate]({
          type: 'standard__namedPage',
          attributes: {
              pageName: 'filePreview'
          },
          state : {
              recordIds: eId,
              selectedRecordId: eId
          }
        })
        
        refreshApex(this.uploadFile);
      }


      handleRowAction(event) {
        const row = event.detail.row.ContentDocumentId;
        this[NavigationMixin.Navigate]({
          type: 'standard__namedPage',
          attributes: {
              pageName: 'filePreview'
          },
          state : {
              recordIds: row,
              selectedRecordId: row
          }
        })
        
      }

      
    refershLwc(){
        refreshApex(this.uploadFile);
    }



}