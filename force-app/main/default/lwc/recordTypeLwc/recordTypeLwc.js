import { NavigationMixin } from 'lightning/navigation';
import { LightningElement, wire} from 'lwc';

import recordTypeClass from '@salesforce/apex/abcRecordType.recordTypeClass';

export default class RecordTypeLwc extends NavigationMixin(LightningElement)  {
    options = [];
    @wire(recordTypeClass)
    rec({data, error}){
        if(data){
            let optionsValues = [];
            window.console.log('rtInfos ===> '+JSON.stringify(data));
            for(let i = 0; i < data.length; i++) {
                optionsValues.push({
                        label: data[i].Name,
                        value: data[i].Id
                    })
            }

            this.options = optionsValues;
        }
    }


    handleChange(event) {
				const iid = e.target.value;
        this.selectedValue = event.detail.value;
        window.console.log('rtInfos recordTypeId===> '+this.recordTypeId);
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                objectApiName: 'Account',
                actionName: 'new',
			},
						state: { recordTypeId:this.selectedValue } 
		});
    }

    
}