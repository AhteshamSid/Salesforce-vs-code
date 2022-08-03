import { LightningElement, api } from 'lwc';
import lookup from '@salesforce/apex/LookupController.lookup';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class Lookup extends LightningElement {
    // information passed down from parent...
    @api objecttype;
    @api searchagainst;   //Name of the field against which we need to find the results. (In most cases or by default this would be Name) (Primary Field)
    @api secondaryfield;   // Name of the field which will be used as the meta text from the search results.
    @api maxResults = 1000;
    @api label;
    @api variant;
    @api lookupicon = 'standard:record';
    @api isRequired = false;
    @api isdisabled = false;

    // Local information
    _isinitCompleted = false;
    _isLoading = false;
    _searchResults = [];

    @api selectedId;
    @api selectedName;

/**************************************************************************************
* @Description  This method will called on load of component 
**************************************************************************************/ 
    connectedCallback() {
        /*this.objecttype = 'Product2';
        this.label = 'product';
        this.searchagainst = 'Name'; // 
        this.secondaryfield = null;
        this.lookupicon = 'standard:product';*/
    }
/**************************************************************************************
* @Description  This method will called when DOM is loaded
**************************************************************************************/ 
    renderedCallback(){
        if(!this._isinitCompleted){
            window.addEventListener('click', this.clearDropdown);
            this.template.addEventListener('click', this.clearDropdown);
            this._isinitCompleted = true;
        }
    }

  /**************************************************************************************
* @Description  This method will called to check if field label is visible or not 
**************************************************************************************/ 
    get isLabelVisible(){
        return this.variant != 'label-hidden';
    }

    isDropDownVisible = false;
    startLookingUp(event){
        let searchInput = event.target;
        this.selectedName = searchInput.value;
        
        if(searchInput.value.length > 1){
            if(event.type == 'focus' && this.isDropDownVisible){
                // in case of the focus event we just check if the dropdown has a value and if search results are there
                this.showLookupDropdown(searchInput);
                return;
            }else if(event.type == 'focus'){
                return;
            }

            this.isDropDownVisible = true;
            this._isLoading = true;
            lookup({ 
                objectType: this.objecttype,
                searchText: searchInput.value, 
                searchAgainst: this.searchagainst, 
                secondaryField: this.secondaryfield,
                maxResults: this.maxResults 
            }).then(result => {
                this._searchResults =  result.map(item => {
                    return {
                        Id: item.Id,
                        Name: item.Name,
                        primaryField: this.searchagainst != 'Name' ? item[this.searchagainst] : null, // If primary field is not name then it is the field we are filtering against.
                        secondaryField: item[this.secondaryfield] ? item[this.secondaryfield] : null
                    };
                });

                console.log(JSON.parse(JSON.stringify(this._searchResults)));
                this.showLookupDropdown(searchInput);
                this._isLoading = false;
            })
            .catch(error => {
                console.log(error);
                if(error && error.body && error.body.message){
                    this.showNotification(error.body.message, 'error');
                }else if(error && error.body && error.body.pageErrors && error.body.pageErrors.length > 0){
                    this.showNotification(error.body.pageErrors[0].message, 'error');
                }
                this._isLoading = false;
            });
        }else{
            this._searchResults = [];
        }   
    }
  /**************************************************************************************
* @Description  This method will called to check if lookup search has values or not 
**************************************************************************************/ 
    get hasSearchResults(){
        return this._searchResults.length > 0;
    }

 /**************************************************************************************
* @Description  This method will called to check if selected record has values or not
**************************************************************************************/ 
    get hasSelection(){
        return this.selectedId && this.selectedName;
    }

 /**************************************************************************************
* @Description  This method will called to set selected value
**************************************************************************************/ 
    set hasSelection(value) {
       this.uppercaseItemName = value.toUpperCase();
    }
/**************************************************************************************
* @Description  This method will called when we select a value from dropdown
**************************************************************************************/ 
    handleSelection(event){
        let selectedLine = event.currentTarget;

        this.selectedId = selectedLine.dataset.id;
        this.selectedName = selectedLine.dataset.name;
        
        this.disptachSelectionEvent();
    }

/**************************************************************************************
* @Description  This method will called to clear selected value from input
**************************************************************************************/ 
    clearSelection(){
        this.selectedId = null;
        this.selectedName = null;

        // Move focus to the nearest input box, using a timeout because the input that we need to focus on doesnt exist yet.
        setTimeout(function(){
            let inputEle = this.template.querySelector("lightning-input");
            if(inputEle){
                inputEle.focus();
            }
        }.bind(this), 0);
        
        let formElement = this.template.querySelector('.slds-form-element');
        if(formElement && formElement.classList.contains('slds-has-error')){
            formElement.classList.remove('slds-has-error');
        }

        this.disptachSelectionEvent();
    }
/**************************************************************************************
* @Description  This method will csend the data to parent using event
**************************************************************************************/ 
    disptachSelectionEvent(){
        const selectedEvent = new CustomEvent('selection', { 
            detail: {
                recordId: this.selectedId,
                recordName: this.selectedName,
                searchedagainst: this.searchagainst
            } 
        });
        // Dispatches the event.
        this.dispatchEvent(selectedEvent);
    }
/**************************************************************************************
* @Description  // there are 2 click events registered for this component, one on the window and second on this template.
        // The window click was always being registered on the body because of locker services so a new event on the template which is stopped from propogating to the window
        // This helps us check if the click is inside the input and we dont close the dropdown.
**************************************************************************************/ 
    clearDropdown = (event) => {
        
        event.stopPropagation();
        this.template.querySelectorAll('div.slds-dropdown-trigger').forEach( (container) => {
            if(!container.classList.contains('slds-is-open')){
                return;
            }
            
            if(event && event.type && event.type == 'click' && (event.target && (event.target.tagName == 'INPUT' || event.target.tagName == 'LIGHTNING-INPUT')) && container.contains(event.target)){ 
                return; 
            }
            
            container.classList.remove("slds-is-open");
            container.setAttribute("aria-expanded", false);
        })
    }
 /**************************************************************************************
* @Description  This will help in showing dropdown for lookup
**************************************************************************************/ 
    showLookupDropdown(currentNode){
        let parent = currentNode.closest("div.slds-dropdown-trigger");
        if (!parent.classList.contains('slds-is-open')){ 
            parent.classList.add("slds-is-open");
            parent.setAttribute("aria-expanded", true);
        }
    }; 
/**************************************************************************************
* @Description  This common method is used to show toast messages on events on component
**************************************************************************************/ 
    showNotification(message, variant) {
        const evt = new ShowToastEvent({
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }
/**************************************************************************************
* @Description  This method is used to remove selection from input block
**************************************************************************************/ 
    @api removeSelection(){
        this.selectedId = '';
        this.selectedName = '';
        this._searchResults = [];

        //clear the input too...
        let inputBlock = this.template.querySelector('input');
        if(inputBlock){
            inputBlock.value='';
        }
    }

/**************************************************************************************
* @Description  This  method is used to check validity of data
**************************************************************************************/ 
    @api isValid(){
        if(this.isrequired && !this.selectedId){
            return false;
        }else{
            return true;
        }
    }
/**************************************************************************************
* @Description  This  method is used to show few custom validations on component
**************************************************************************************/ 
    @api setCustomValidity(message){
        let searchBox = this.template.querySelector('lightning-input[data-name="lookupInput"]');
        if(searchBox && message){
            
            console.log(message);
            searchBox.setCustomValidity(message);
            searchBox.reportValidity();
        }else{
            // If we come here that means, there is a selection already in the lookup where we want to throw an error.
            let selectedInput  = this.template.querySelector('input[data-name="inputselection"]');
            if(selectedInput && message){
                let formElement = this.template.querySelector('.slds-form-element');
                if(formElement){
                    formElement.classList.add('slds-has-error');
                }

                let helpText = this.template.querySelector('.slds-form-element__help');
                if(helpText){
                    helpText.innerHTML = message;
                }
            }else{
                let formElement = this.template.querySelector('.slds-form-element');
                if(formElement && formElement.classList.contains('slds-has-error')){
                    formElement.classList.remove('slds-has-error');
                }

                let helpText = this.template.querySelector('.slds-form-element__help');
                if(helpText){
                    helpText.innerHTML = '';
                }
            }
        }
    }
/**************************************************************************************
* @Description  This  method is report validity on component fields
**************************************************************************************/ 
    @api reportValidity(){
        let searchBox = this.template.querySelector('lightning-input[data-name="lookupInput"]');
        if(this.isrequired && (!this.selectedId || !this.selectedName)){
            if(searchBox){
                console.log('this.selectedId == '+this.selectedId);
                console.log('this.selectedName == '+this.selectedName);

                if(!this.selectedId && this.selectedName){
                    searchBox.setCustomValidity('Please select an option from the dropdown.');
                }else{
                    searchBox.setCustomValidity('Complete this field.');
                }
                searchBox.reportValidity();
            }
        }else if(searchBox){
            searchBox.setCustomValidity('');
            searchBox.reportValidity();
        }
    }
}