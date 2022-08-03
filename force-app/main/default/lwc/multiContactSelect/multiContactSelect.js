import { LightningElement, wire, api } from 'lwc';
import multiOption from '@salesforce/apex/multiContactSelect.multiOption';
export default class MultiContactSelect extends LightningElement {
    @api
    recordId
    @wire(multiOption, { oId: '$recordId'})
    cL;
    value;
    get getOptions() {
        var returnOptions = [];
        if(this.cL.data){
            this.cL.data.forEach(ele =>{
                returnOptions.push({label: ele.FirstName +' ' + ele.LastName , value:ele.FirstName +' ' + ele.LastName});
            }); 
        }
      // console.log(JSON.stringify(returnOptions));
        return returnOptions;
    }

    _selected=[];
    get selected() {
        return this._selected.length ? this._selected : 'none';
    }

    handleChange(e) {
        this._selected = e.detail.value;
    }

}