import { LightningElement, api } from 'lwc';

export default class ContactInformationSection extends LightningElement {
    @api isPrimary =false;
     _contact;

    connectedCallback(){
    	console.log('connectedCallback CONTACTINFO ' +this.isPrimary);
    }
    
    renderedCallback(){
    	console.log('RENDERED CONTACTINFO');
    }
    
    
    @api get contact(){
        return this._contact;
    }

    set contact(value){
        console.log('setting contacct value'+JSON.stringify(value));
        this._contact = Object.assign({}, value);
    }

    get referredById(){
        if(this._contact && this._contact.Referred_by_Client__c){
            return this._contact.Referred_by_Client__c;
        }else{
            return null;
        }
    }

    get referredByName(){
        if(this._contact && this._contact.Referred_by_Client__c && this._contact.Referred_by_Client__r && this._contact.Referred_by_Client__r.Name){
            return this._contact.Referred_by_Client__r.Name;
        }else{
            return null;
        }
    }

    handleChange(event){
        let changedField = event.currentTarget;    
        this._contact[changedField.name] = changedField.value;
        console.log('In Change == '+this._contact[changedField.name]);
    }

    @api isContactInformationValid(){
        let allValid = true;
        
        let firstName = this.template.querySelector('lightning-input[data-name="FirstName"]');
        if(!this.isFirstNameValid(firstName)){
            allValid = false;
        }

        let lastName = this.template.querySelector('lightning-input[data-name="LastName"]');
        if(!this.isLastNameValid(lastName)){
            allValid = false;
        }

        let middleName = this.template.querySelector('lightning-input[data-name="MiddleName"]');
        if(!this.isMiddleNameValid(middleName)){
            allValid = false;
        }

        let referredBy = this.template.querySelector('c-lookup');
        if(referredBy){
            if(!referredBy.isValid()){
                allValid = false;
                referredBy.reportValidity();
            }
        }

        return allValid;
    }

    /**************************************************************************************
    * @Description  - // validate first name, check if there are any special characters and capitalise the field value.
    **************************************************************************************/
    validateFirstName(event){
        let firstName = event.currentTarget;
        this.isFirstNameValid(firstName);
        this.capitalizeFirstLetter(firstName);
        this.handleChange(event);
    }

    isFirstNameValid(firstNameInput){
        let isValid =true;
        
       
        if(firstNameInput){
            let firstnameVal = firstNameInput.value;
            if(firstnameVal.trim()==''){
                firstNameInput.setCustomValidity('First Name is Required.');
                isValid =false;
            }else if(!this.containsOnlyLettersOrParenthesis(firstnameVal)){
                firstNameInput.setCustomValidity('Please do not enter special characters or numbers in First Name.');
                isValid =false;
            }else if(firstnameVal.toLowerCase()=='name'){
                 firstNameInput.setCustomValidity('Enter a valid name');
                 isValid =false;
                
            }else{
                firstNameInput.setCustomValidity("");
            }
            firstNameInput.reportValidity();
        }
        return isValid;
    }

    /**************************************************************************************
    * @Description  - // validate last name, check if there are any special characters and capitalise the field value.
    **************************************************************************************/
    validateLastName(event){
        let lastName = event.currentTarget;
        this.isLastNameValid(lastName);
        this.capitalizeFirstLetter(lastName);
        this.handleChange(event);
    }

    isLastNameValid(lastNameInput){
        let isValid =true;
        if(lastNameInput){
            let lastNameVal = lastNameInput.value;
            if(lastNameVal.trim()==''){
                lastNameInput.setCustomValidity('Last Name is Required.');
                isValid =false;
            }else if(!this.containsOnlyLettersOrParenthesis(lastNameVal)){
                lastNameInput.setCustomValidity('Please do not enter special characters or numbers in Last Name.');
                isValid =false;
            }else if(lastNameVal.toLowerCase()=='name'){
                lastNameInput.setCustomValidity('Enter a valid name')
                isValid =false;
            }else{
                lastNameInput.setCustomValidity("");
            }
            lastNameInput.reportValidity();
        }
        return isValid;
    }

    /**************************************************************************************
    * @Description  - // validate middle name, check if there are any special characters and capitalise the field value.
    **************************************************************************************/
    validateMiddleName(event){
        let middleName = event.currentTarget;
        this.isMiddleNameValid(middleName);
        this.capitalizeFirstLetter(middleName);
        this.handleChange(event);
    }

    isMiddleNameValid(middleNameInput){
        let isValid =true;
        if(middleNameInput){
            let middleNameVal = middleNameInput.value;

            if(middleNameVal && !this.containsOnlyLettersOrParenthesis(middleNameVal)){
                middleNameInput.setCustomValidity('Please do not enter special characters or numbers in Middle Name.');
                isValid =false;
            }else{
                middleNameInput.setCustomValidity("");
            }
            middleNameInput.reportValidity();
        }
        return isValid;
    }

    /**************************************************************************************
    * @Description  - // validate suffix, capitalise the field value.
    **************************************************************************************/
    validateSuffix(event){
        let suffix = event.currentTarget;
        this.capitalizeFirstLetter(suffix);
        this.handleChange(event);
    }


    containsOnlyLettersOrParenthesis(inputValue){  
        return inputValue.match(/^([a-z-\(\) ']+)$/i);
    }

    /**************************************************************************************
    * @Description  - // Method called to make first letter of word as Capital and rest as small
    **************************************************************************************/
    capitalizeFirstLetter(nameField){
        let fieldValue = nameField.value;
        let finalValue = '';

        var Allchars=fieldValue.split(' ');
        
        if(Allchars.length>0 && Allchars.length==1){
            var stringafterfirstcharacter=Allchars[0].slice(1);
            finalValue = Allchars[0].charAt(0).toUpperCase() + stringafterfirstcharacter.toLowerCase();
        }else if(Allchars.length>1){
            for(var i=0;i<Allchars.length;i++){
                var stringafterfirstcharacter=Allchars[i].slice(1);
                finalValue+=Allchars[i].charAt(0).toUpperCase() + stringafterfirstcharacter.toLowerCase()+' ';
            }
        }

        nameField.value = finalValue;
    }

    handleReferredBySelection(event){
        console.log('test@@==='+event.detail.recordId);
        this._contact['Referred_by_Client__c'] = event.detail.recordId
    }

    //We are doing only returning the relvant fields, because if return all felds and then merge the contact on the parent
    // it will affect other components that are getting the data from it.
    @api get contactInformation(){     
        return {
            FirstName: this._contact.FirstName,
            MiddleName: this._contact.MiddleName,
            LastName: this._contact.LastName,
            Suffix: this._contact.Suffix,
            Referred_by_Client__c: this._contact.Referred_by_Client__c,
        }
    }
}