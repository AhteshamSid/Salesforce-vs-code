import { LightningElement, api } from 'lwc';

export default class Lwc1 extends LightningElement {
    changeHandler(){
        this.dispatchEvent(
            new CustomEvent( "burn", {detail: "cant Burn"})
        )
    }
}