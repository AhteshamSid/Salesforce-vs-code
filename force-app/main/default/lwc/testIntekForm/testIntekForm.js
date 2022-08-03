import { LightningElement, api } from 'lwc';

export default class TestIntekForm extends LightningElement {
    @api recordId;
    @api objectApiName;
    activeSections = ['A','B', 'C'];

    isLoading = true;
    connectedCallback() {
        setTimeout(() => {
            this.isLoading = false;
        }, 3000)
    }
    
}