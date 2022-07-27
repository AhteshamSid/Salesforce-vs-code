
import { LightningElement} from 'lwc';
export default class ModalPopupLWC extends LightningElement {


    isModalOpen = false;
    openModal() {
        this.isModalOpen = true;
    }
    closeModal() {
        this.isModalOpen = false;
    }
    submitDetails() {
        this.isModalOpen = false;
    }
}