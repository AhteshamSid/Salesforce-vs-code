import { LightningElement, api } from 'lwc';

export default class DisplayListChild extends LightningElement {
    @api bb
    bChild =  "cant Burn"
    flag = false
    changeHandler(){
        if(this.flag){
            bChild = 'this.bb';
            this.flag=false
        }else{
            this.bChild = "cant Burn"
            this.flag=true
        }
        this.dispatchEvent(
            new CustomEvent( "burn", {detail: this.bChild})
        );
    }
}