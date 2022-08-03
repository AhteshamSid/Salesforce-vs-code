import { LightningElement, api, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { CloseActionScreenEvent } from 'lightning/actions';
import { getRecordNotifyChange } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';

import initializeIntakeForm from '@salesforce/apex/IntakeLwcController.initializeIntakeForm';
import populateAllPackageOptions from '@salesforce/apex/IntakeLwcController.populateAllPackageOptions';
import getSelectedPackageInformation from '@salesforce/apex/IntakeLwcController.getSelectedPackageInformation';
import getSelectedSpouseInstance from '@salesforce/apex/FormUtils.getSelectedSpouseInstance';
import markRecordDead from '@salesforce/apex/IntakeLwcController.markRecordDead';
import insertRequiredInfoForChargeOrUpdate from '@salesforce/apex/IntakeLwcController.insertRequiredInfoForChargeOrUpdate';
import captureExistingAuthorizations from '@salesforce/apex/IntakeLwcController.captureExistingAuthorizations';
import authorizeBeforeSubmittingAsSale from '@salesforce/apex/IntakeLwcController.authorizeBeforeSubmittingAsSale';
import updateOnly from '@salesforce/apex/IntakeLwcController.updateOnly';
import confirmFamilyAddOn from '@salesforce/apex/IntakeLwcController.confirmFamilyAddOn';
import MakeSpousePrimary from '@salesforce/apex/FormUtils.MakeSpousePrimary';

import updateContactBeforeTranunion from '@salesforce/apex/FormUtils.updateContactBeforeTranunion';
import makeTransUnionCall from '@salesforce/apex/FormUtils.makeTransUnionCall';

export default class IntakeLead extends NavigationMixin(LightningElement) {

    //this id we use to get the record id where we are using component so this id we can get  lead id or contact id or opportunity id etc.
    @api recordId;
    @api objectApiName;
    isLoading = true;
    isDataLoaded = false;
    isRecordSavedSuccessfully = false;

    // we use this variable to check from where the form has launched
    @api source;

    @api customToastMessage = '';
    @api customToastvariant = '';

    //We use this variable for opportunity info 
    @track formData;
    formDataToBeSubmitted;

    connectedCallback() {
        setTimeout(() => {
            this.init();
        })
    }

    init() {
        this.isLoading = true;
        initializeIntakeForm({
            recordId: this.recordId
        })
            .then((result) => {
                console.log(result);
                this.formData = JSON.parse(JSON.stringify(result));
                this.formDataToBeSubmitted = JSON.parse(JSON.stringify(result));
            })
            .catch((error) => {
                this.handleServerError(error);
            })
            .finally(() => {
                if (this.formData) {
                    this.isDataLoaded = true;
                    this.getSelectedProductDetails(); // Getting the product on load..
                }
                this.isLoading = false;
            })
    }

    get isIntakeLead() {
        if (this.objectApiName && this.objectApiName == 'Lead__c') {
            return true;
        } else {
            return false;
        }
    }

    get isIntakeContact() {
        return !this.isIntakeLead;
    }

    //The family addon button in primary section will only be visble on intakeContact because no one manually change the subscription there
    // so the current form is not intake lead and subscription is not couple, we are good to display the family add on button.
    get isIntakeContactIndividual() {
        if (!this.isIntakeLead && !this.isCoupleSubscription) {
            return true;
        } else {
            return false;
        }
    }


    get isOpportunityActive() {
        if (this.objectApiName && this.objectApiName != 'Lead__c' && this.formData && (this.formData.opp.StageName__c == 'Active' || this.formData.opp.StageName__c == 'Past Due')) {
            return true;
        } else {
            return false;
        }
    }

    get isCoupleSubscription() {
        if (this.formData && this.formData.selectedPackage && this.formData.selectedPackage.IndividualOrCouple && this.formData.selectedPackage.IndividualOrCouple == 'Couple') {
            return true;
        } else {
            return false;
        }
    }

    get productTypeOptions() {
        return [
            { label: 'None', value: '', selected: this.formData.selectedPackage.ProductType == '' ? true : false },
            { label: 'Full Sale', value: 'Sale', selected: this.formData.selectedPackage.ProductType == 'Sale' ? true : false },
            { label: 'Partial', value: 'Partial', selected: this.formData.selectedPackage.ProductType == 'Partial' ? true : false },
            { label: 'ATP Sale', value: 'Post-Date', selected: this.formData.selectedPackage.ProductType == 'Post-Date' ? true : false },
            { label: 'Special Sale', value: 'Special', selected: this.formData.selectedPackage.ProductType == 'Special' ? true : false },
        ];
    }

    get individualOrCoupleOptions() {
        return [
            { label: 'Individual', value: 'Individual', selected: this.selectedIndividualOrCouple == 'Individual' ? true : false },
            { label: 'Family', value: 'Couple', selected: this.selectedIndividualOrCouple == 'Couple' ? true : false },
        ];
    }

    //Spouse search functionality related variables
    get isSpouseSearchButtonVisible() {

        if ((this.formData && this.formData.opp && this.formData.opp.StageName__c && (this.formData.opp.StageName__c == 'Working' || this.formData.opp.StageName__c == 'Dead' || this.formData.opp.StageName__c == 'Active')) || (this.formData && this.formData.originalPackage && this.formData.originalPackage.IndividualOrCouple == 'Individual')) {
            return true;
        } else {
            return false;
        }
    }

    get isProductAtpOrPartial() {
        if (this.formData && this.formData.selectedPackage && (this.formData.selectedPackage.ProductType == 'Partial' || this.formData.selectedPackage.ProductType == 'Post-Date')) {
            return true;
        } else {
            return false;
        }
    }

    get isSecondSetupFeeEnabled() {
        
       if (this.isProductAtpOrPartial) {
            let currentSecondSetupDate = null;
            if (this.formData.opp && this.formData.opp.SetupFee2_Date__c && this.isOpportunityActive) {
                currentSecondSetupDate = new Date(this.formData.opp.SetupFee2_Date__c);
                if (currentSecondSetupDate < new Date()) {
                    return false;
                }else{
                    return true;
                }
            }else{
                 return true;
            }
        } else {
            return false;
        }
    }

    get isChargeSetupFeeButtonEnabled() {
        if (this.isSecondSetupFeeEnabled && this.isIntakeContact && this.isOpportunityActive) {
            return true;
        } else {
            return false;
        }
    }

    get secondSetUpCompoundClass() {
        if (this.isProductAtpOrPartial) {
            return 'slds-size_1-of-3 slds-form-compound-padding';
        } else {
            return 'slds-size_1-of-2 slds-form-compound-padding';
        }
    }

    get isSubmitAsSaleEnabled() {
        if (this.formData && this.formData.creditCardInfo && (this.formData.opp.StageName__c == 'Working' || this.formData.opp.StageName__c == 'Dead' || this.formData.opp.StageName__c == 'Active') && this.formData.creditCardInfo.ChargeAmount > 0) {
            return true;
        } else {
            return false;
        }
    }
    get isSaveEnabled() {
        if (this.formData) {
            return true;
        } else {
            return false;
        }
    }



    recurringChargeDateOptions;
    @wire(getPicklistValues, { recordTypeId: '012000000000000AAA', fieldApiName: 'Opportunity__c.Charge_Date__c' })
    chargeDateValues({ error, data }) {
        console.log(data);
        if (data && data.values) {
            this.recurringChargeDateOptions = [{ label: '--None--', value: '', selected: true }];
            data.values.forEach(pickVal => {
                this.recurringChargeDateOptions.push({
                    label: pickVal.label,
                    value: pickVal.value,
                    selected: false
                })
            })
        }
    };

    closedLostReasons;
    @wire(getPicklistValues, { recordTypeId: '012000000000000AAA', fieldApiName: 'Opportunity__c.Closed_Lost_Reasons__c' })
    closedlostReasonValues({ error, data }) {
        console.log(data);
        if (data && data.values) {
            this.closedLostReasons = [{ label: '--None--', value: '', selected: true }];
            data.values.forEach(pickVal => {
                this.closedLostReasons.push({
                    label: pickVal.label,
                    value: pickVal.value,
                    selected: false
                })
            })
        }
    };

    handleProductTypeOptionChange(event) {
        this.formData.selectedPackage.ProductType = event.currentTarget.value;
        if (!this.isProductAtpOrPartial) {
            this.formData.opp.SetupFee2_Date__c = null;
        }
        this.refreshAvailableProductList();

    }

    handleIndividualOrCoupleChange(event) {
        if (this.formData.selectedPackage.IndividualOrCouple == 'Individual' && event.currentTarget.value == 'Couple') {
            this.packageChangeAction = 'ADD_FAMILY_MEMBER';
        } else {
            this.packageChangeAction = 'REMOVE_FAMILY_MEMBER'
        }
        this.managePackageChangeConfirmation();
    }

    handlePackageChange(event) {
        this.formData.selectedPackage.ProductId = event.currentTarget.value;
        this.getSelectedProductDetails();
    }

    refreshAvailableProductList() {

        //Before making any changes in the ackages, sync the contact data with data that needs to be sent to server.
        let primaryBillingSection = this.template.querySelector('c-billing-information-section[data-cmptype="primary"]');

        if (primaryBillingSection) {
            this.formDataToBeSubmitted.primaryContact = { ...this.formDataToBeSubmitted.primaryContact, ...primaryBillingSection.contact };

        }

        this.isLoading = true;
        populateAllPackageOptions({
            formdata: this.formData,
            primaryMailingState: this.formDataToBeSubmitted.primaryContact.MailingState


        })
            .then(result => {
                //This method is called from multiple places, so we are making sure the next line only executes if this is called from the package change.
                //NOTE: its important to check this at the top, because fields need to enabled for setting the new options, so we enable them as soon as we have new options.
                if (!this.isIntakeLead && (this.packageChangeAction == 'REMOVE_FAMILY_MEMBER' || this.packageChangeAction == 'ADD_FAMILY_MEMBER')) {
                    this.finalisePackageChange();
                    this.packageChangeAction = null; // so it cant come here twice.
                }

                this.formData.upgradedPackages = JSON.parse(JSON.stringify(result.upgradedPackages));
                this.formData.selectedPackage = JSON.parse(JSON.stringify(result.selectedPackage));

                //One of the product would be selected by default when the list refreshes, so we will get all information regarding that product by calling the getSelectedProductDetails.
                this.getSelectedProductDetails();
            })
            .catch(error => {
                this.handleServerError(error);
            })
            .finally(() => {
                this.isLoading = false;
            })

    }

    getSelectedProductDetails() {
        this.isLoading = true;
        getSelectedPackageInformation({
            opp: this.formData.opp,
            selectedPackage: this.formData.selectedPackage,
            originalPackage: this.formData.originalPackage,
            creditCardInfo: this.formData.creditCardInfo
        })
            .then(result => {
                this.formData.selectedPackage = Object.assign({}, result.selectedPackage);
                this.formData.opp.Charge_Date__c = result.opp.Charge_Date__c;

                let creditCardSection = this.template.querySelector('c-credit-card-section[data-type="firstcard"]');
                if (creditCardSection) {
                    creditCardSection.creditCardInfo.ChargeAmount = result.creditCardInfo.ChargeAmount;
                    this.formData.creditCardInfo.ChargeAmount = result.creditCardInfo.ChargeAmount;
                }
            })
            .catch(error => {
                this.handleServerError(error);
            })
            .finally(() => {
                this.isLoading = false;
            })
    }

    get secondSetUpClass() {
        if (this.showSecondSetupFee) {
            return 'slds-size_1-of-3 slds-form-compound-padding';
        } else {
            return 'slds-size_1-of-2 slds-form-compound-padding';
        }
    }

    useSecondCreditCard = false;
    handleSecondCardSelection(event) {
        this.useSecondCreditCard = event.detail;
    }

    handleRecurringCardChange(event) {
        if (this.useSecondCreditCard) {
            if (event.detail.isSecondCard) {
                let creditCardSection = this.template.querySelector('c-credit-card-section[data-type="firstcard"]');
                if (creditCardSection) {
                    creditCardSection.setRecurringValue(!event.detail.isCardRecurring);
                }
            } else {
                let creditCardSection = this.template.querySelector('c-credit-card-section[data-type="secondcard"]');
                if (creditCardSection) {
                    creditCardSection.setRecurringValue(!event.detail.isCardRecurring);
                }
            }
        }
    }

    showMarkDeadModal = false;
    startMarkingDead(event) {
        if (this.source == 'CallScript' && event) {
            event.preventDefault();
        }
        this.showMarkDeadModal = true;
        this.formData.opp.StageName__c = 'Dead';
    }

    cancelMarkingDead() {
        if (this.source == 'CallScript') {
            event.preventDefault();
        }
        this.showMarkDeadModal = false;
        this.formData.opp.StageName__c = 'Working';
        this.formData.opp.Closed_Lost_Reasons__c = null;
        this.formData.opp.Description__c = null;
        this.tempStage = null;
    }

    handleOppClosedReasonChange(event) {
        this.formData.opp.Closed_Lost_Reasons__c = event.currentTarget.value;
    }

    handleOppDescriptionChange(event) {
        this.formData.opp.Description__c = event.currentTarget.value;
        console.log('this.formData.opp.Description__c == ' + this.formData.opp.Description__c);
    }


    commitRecordAsDead() {
        this.isLoading = true;
        markRecordDead({
            leadId: this.isIntakeLead ? this.recordId : null,
            opp: this.isIntakeLead ? null : this.formData.opp,
            spouseContactId: this.isIntakeLead ? null : this.formData.spouseContact.Id,
        })
            .then(result => {
                this.showToast('success', 'Record successfully marked as Dead!');
                getRecordNotifyChange([{ recordId: this.recordId }]);
                if (this.source == 'CallScript') {
                    this.redirectFromCallScript(this.recordId);
                } else {
                    this.dispatchEvent(new CloseActionScreenEvent());
                }
            })
            .catch(error => {
                this.handleServerError();
            })
            .finally(() => {
                this.isLoading = false;
            })
    }


    validate2ndSetupDate() {
        let allValid = true;
        let setup2ndDateInput = this.template.querySelector('lightning-input[data-type="SetupFee2_Date__c"]');
        if (setup2ndDateInput && setup2ndDateInput.value) {

            var setup2ndDateFormatted = setup2ndDateInput.value.split('T')[0];
            setup2ndDateFormatted = this.fixDateFormat(setup2ndDateFormatted);

            let originalSetupDate = this.formData.opp.SetupFee2_Date__c ? new Date(this.formData.opp.SetupFee2_Date__c) : null;
            let secondSetupDate = setup2ndDateFormatted ? new Date(setup2ndDateFormatted) : null;
            if (originalSetupDate != secondSetupDate) {
                let today = new Date();
                if (secondSetupDate <= today) {
                    setup2ndDateInput.setCustomValidity('2nd Setup Fee Date must be greater than today.');
                    allValid = false;
                } else {
                    // 2nd setup date can only be 30 days out from today
                    if (this.formData.selectedPackage.ProductType == 'Post-Date') {
                        let lastDay = today.setDate(today.getDate() + 30);
                        if (secondSetupDate > lastDay) {
                            setup2ndDateInput.setCustomValidity('2nd Setup Fee Date must be within 30 days of opportunity close date for ATP product.');
                            allValid = false;
                        }
                    } else {
                        let lastDay = today.setDate(today.getDate() + 21);
                        if (secondSetupDate > lastDay) {
                            setup2ndDateInput.setCustomValidity('2nd Fee Charge Date can not be more than 21 days from today.');
                            allValid = false;
                        }
                    }
                }
            }
            if (allValid) {
                setup2ndDateInput.setCustomValidity('');
                if (!setup2ndDateInput.validity.valid) {
                    allValid = false;
                } else {
                    this.formData.opp.SetupFee2_Date__c = setup2ndDateInput.value;
                }
            }
            setup2ndDateInput.reportValidity();
        }
        return allValid;
    }

    validateRequired2ndSetupDate() {
        let allValid = true;
        let setup2ndDateInput = this.template.querySelector('lightning-input[data-type="SetupFee2_Date__c"]');
        if (setup2ndDateInput && this.isProductAtpOrPartial) {
            if (!setup2ndDateInput.value) {
                setup2ndDateInput.setCustomValidity('2nd Setup Fee Date is Required.');
                setup2ndDateInput.reportValidity();
                allValid = false;
            } else {
                allValid = this.validate2ndSetupDate();
            }
        }
        return allValid;
    }


    //Added by Aarushi on 09/03/2020
    validateRecurringChargeDate() {
        let recurringDateInput = this.template.querySelector('c-combobox[data-type="chargedate"]');
        let recurringDate = recurringDateInput.value;
        if (recurringDate == "Last Day") {
            recurringDate = "30";
        }
        let allValid = true;
        let setup2ndDateInput = this.template.querySelector('lightning-input[data-type="SetupFee2_Date__c"]');
        if (this.isProductAtpOrPartial && setup2ndDateInput && setup2ndDateInput.value) {
            
            var setup2ndDateInputFormatted = setup2ndDateInput.value.split('T')[0];
            setup2ndDateInputFormatted = this.fixDateFormat(setup2ndDateInputFormatted);

            let selectedSetupDate = new Date(setup2ndDateInputFormatted);
            if (recurringDate > selectedSetupDate.getDate() + 1) {
                recurringDateInput.setCustomValidity('Recurring Charge Date determines the Payment Start Date of the subscription, as a result, it can only be UP to 31 days from the 2nd setup fee arranged date');
                allValid = false;
            } else {
                this.formData.opp.Charge_Date__c = recurringDateInput.value;
                recurringDateInput.setCustomValidity('');
            }
        } else {
            this.formData.opp.Charge_Date__c = recurringDateInput.value;
            recurringDateInput.setCustomValidity('');
        }
        recurringDateInput.reportValidity();
        return allValid;
    }


    copyPrimaryaddressToSpouse(event) {
        let primaryBillingSection = this.template.querySelector('c-billing-information-section[data-cmptype="primary"]');
        console.log('primaryBillingSection == ', primaryBillingSection);
        if (primaryBillingSection) {
            let primaryAddress = primaryBillingSection.getAddressInfo();
            console.log(primaryAddress);

            let spouseBillingSection = this.template.querySelector('c-billing-information-section[data-cmptype="spouse"]');
            console.log('spouseBillingSection == ', spouseBillingSection);
            if (spouseBillingSection) {
                spouseBillingSection.setAddressInfo(primaryAddress);
            }
        }
    }

    /**************************************************************************************
    * @Description  - // This method is called by the event passed from billing info to validate primary against spouse information.
    **************************************************************************************/
    validateContactAgainstEachOther(event) {
        if (event && event.detail) {
            let validatingForInput = null;
            let validatingAgainstInput = null;

            if (event.detail.isPrimary) {
                validatingForInput = this.template.querySelector('c-billing-information-section[data-cmptype="primary"]');
                validatingAgainstInput = this.template.querySelector('c-billing-information-section[data-cmptype="spouse"]');
            } else {
                validatingForInput = this.template.querySelector('c-billing-information-section[data-cmptype="spouse"]');
                validatingAgainstInput = this.template.querySelector('c-billing-information-section[data-cmptype="primary"]');
            }
            /* Here is how the event.detail looks like 
                { isPrimary: this.isPrimary, validationType: 'userSSN', additionalValidation: null,  value: userSSNVal.trim() } 
                validationType tells us the field that needs to be validated, additionalValidation is a special case as we need to match against the secondary phone too.
            */
            if (validatingForInput && validatingAgainstInput) {
                let uniqueFactors = validatingAgainstInput.getUniqueFactorInfo();
                if (uniqueFactors && uniqueFactors[event.detail.validationType] == event.detail.value) {
                    validatingForInput.addErrorFromCounterPart(event);
                } else if (uniqueFactors && event.detail.additionalValidation && uniqueFactors[event.detail.additionalValidation] == event.detail.value) {
                    validatingForInput.addErrorFromCounterPart(event);
                }
            }
        }
    }

    validateRequiredRecurringChargeDate() {
        let allValid = true;
        let recurringDateInput = this.template.querySelector('c-combobox[data-type="chargedate"]');
        if (recurringDateInput && !recurringDateInput.value) {
            recurringDateInput.setCustomValidity('Recurring Charge Date is required.');
            recurringDateInput.reportValidity();
            allValid = false;
        } else {
            allValid = this.validateRecurringChargeDate();
        }
        return allValid;
    }

    submitActionType = null;
    async validateForm(event) {

        if (this.source == 'CallScript' && event) {
            try {
                event.preventDefault();
            }
            catch (e) {
                console.log("An error occurred"); //This will not be executed
            }
        }

        if (event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.actiontype) {
            this.submitActionType = this.formDataToBeSubmitted.finalActionType = event.currentTarget.dataset.actiontype;
        } else {
            // In this case, event is just a button name passed, most probably from Make primary button because we need to enroll spouse and charge the client.
            this.submitActionType = this.formDataToBeSubmitted.finalActionType = event;
        }

        let allValid = true;
        let firstErrorBlock = null;

        /* Contact Information section validation for primary and spouse*/
        let contactInfoSection = this.template.querySelectorAll('c-contact-information-section');
        if (contactInfoSection && contactInfoSection.length > 0) {
            for (let i = 0; i < contactInfoSection.length; i++) {
                let isValid = contactInfoSection[i].isContactInformationValid();
                if (!isValid) {
                    allValid = false;
                    firstErrorBlock = contactInfoSection[i];
                } else {
                    if (contactInfoSection[i].isPrimary) {
                        this.formDataToBeSubmitted.primaryContact = { ...this.formDataToBeSubmitted.primaryContact, ...contactInfoSection[i].contactInformation };
                    } else {
                        this.formDataToBeSubmitted.spouseContact = { ...this.formDataToBeSubmitted.spouseContact, ...contactInfoSection[i].contactInformation };
                    }
                }
            }
        }



        /* Billing Information Section validation for primary and spouse*/
        let billingInfoSections = this.template.querySelectorAll('c-billing-information-section');
        if (billingInfoSections && billingInfoSections.length > 0) {
            for (let i = 0; i < billingInfoSections.length; i++) {
                let valid = this.submitActionType == 'SAVE_AS_LEAD' && !this.isOpportunityActive ? await billingInfoSections[i].validateBillingInformation() : await billingInfoSections[i].validateRequiredBillingInformation();
                if (!valid) {
                    allValid = false;
                    firstErrorBlock = firstErrorBlock ? firstErrorBlock : billingInfoSections[i];
                } else {
                    if (billingInfoSections[i].isPrimary) {
                        this.formDataToBeSubmitted.primaryContact = { ...this.formDataToBeSubmitted.primaryContact, ...billingInfoSections[i].getBillingInformation() };
                    } else {
                        this.formDataToBeSubmitted.spouseContact = { ...this.formDataToBeSubmitted.spouseContact, ...billingInfoSections[i].getBillingInformation() };
                    }
                }
            }
        }

        let isSecondSetupValid = this.submitActionType == 'SAVE_AS_LEAD' && !this.isOpportunityActive ? this.validate2ndSetupDate() : this.validateRequired2ndSetupDate();
        console.log('isSecondSetupValid == ' + isSecondSetupValid);

        let isRecurringChargeDatevalid = this.submitActionType == 'SAVE_AS_LEAD' && !this.isOpportunityActive ? this.validateRecurringChargeDate() : this.validateRequiredRecurringChargeDate();
        console.log('isRecurringChargeDatevalid == ' + isRecurringChargeDatevalid);


        /* Credt card Section validation for first and second caard*/
        let creditCardSections = this.template.querySelectorAll('c-credit-card-section');

        if (creditCardSections && creditCardSections.length > 0) {
            for (let i = 0; i < creditCardSections.length; i++) {
                let valid = this.submitActionType == 'SAVE_AS_LEAD' && !this.isOpportunityActive ? await creditCardSections[i].validateCreditCardInformation() : await creditCardSections[i].validateRequiredCreditCardInformation();
                if (!valid) {
                    allValid = false;
                    firstErrorBlock = firstErrorBlock ? firstErrorBlock : creditCardSections[i];
                } else {
                    valid = await creditCardSections[i].checkCreditCardDuplicacy();
                    if (!valid) {
                        firstErrorBlock = firstErrorBlock ? firstErrorBlock : creditCardSections[i];
                        allValid = false;
                    } else {

                        if (creditCardSections[i].isSecondCard) {
                            this.formDataToBeSubmitted.secondCreditCardInfo = { ...this.formDataToBeSubmitted.secondCreditCardInfo, ...creditCardSections[i].creditCardInfo };
                        } else {
                            this.formDataToBeSubmitted.creditCardInfo = { ...this.formDataToBeSubmitted.creditCardInfo, ...creditCardSections[i].creditCardInfo };
                        }
                    }
                }
            }
        }


        //Once we have checked that at least all the field data on the page is correct, we go ahead and check for functional validations
        if (allValid && isSecondSetupValid && isRecurringChargeDatevalid) {
            this.formDataToBeSubmitted.selectedPackage = Object.assign({}, this.formData.selectedPackage);
            this.formDataToBeSubmitted.originalPackage = Object.assign({}, this.formData.originalPackage);
            this.formDataToBeSubmitted.opp = Object.assign({}, this.formData.opp);

            if (this.isPrimaryTranunionContextOnIntake && this.submitActionType == 'SAVE_AS_LEAD') {
                this.createContactAndOpportunity();
            } else {
                this.showCstOwnerScreen = true;
            }
        } else if (firstErrorBlock != null) {
            firstErrorBlock.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }


        return false;

    }

    showCstOwnerScreen = false;

    cancelCSTSelection() {
        this.showCstOwnerScreen = false;
    }

    //Intake forms are both the same now, so if the context is lead, that would mean contact and opportunity are not inserted into the system yet.
    // to do anything like make charges or anything else from lead, we need to insert them first, this step would be skipped in case of intake contact forms.
    submitCSTAndForm(event) {
        let cstOwnerId = event.detail;
        this.formDataToBeSubmitted.opp['Last_CST_Updated_by__c'] = cstOwnerId;
        //this.formDataToBeSubmitted.opp['Sales_Executive__c'] = cstOwnerId;

        if (this.isIntakeLead) {
            this.createContactAndOpportunity();
        } else {
            if (this.submitActionType == 'SAVE_AS_LEAD') {
                this.finaliseDataUpdate();
            } else if (this.submitActionType == 'SUBMIT_AS_SALE' || this.submitActionType == 'MAKE_SPOUSE_PRIMARY') {
                this.formDataToBeSubmitted.opp.Charge_Amount__c = this.formDataToBeSubmitted.creditCardInfo.ChargeAmount;
                this.captureAnyExistingAuthorizations();
            } else if (this.submitActionType == 'CHARGE_2NDSETUP_FEE') {
                this.formDataToBeSubmitted.opp.Charge_Amount__c = this.formDataToBeSubmitted.opp.SetupFee2_Amount__c;
                this.captureAnyExistingAuthorizations();
            }
        }
        this.cancelCSTSelection();
    }

    createContactAndOpportunity() {
        this.isLoading = true;
        insertRequiredInfoForChargeOrUpdate({
            leadId: this.recordId,
            data: this.formDataToBeSubmitted
        })
            .then((result) => {
                console.log(result);
                this.formData.primaryContact = this.formDataToBeSubmitted.primaryContact = JSON.parse(JSON.stringify(result.primaryContact));
                this.formData['spouseContact'] = this.formDataToBeSubmitted['spouseContact'] = result.spouseContact ? JSON.parse(JSON.stringify(result.spouseContact)) : null;
                this.formData.opp = this.formDataToBeSubmitted.opp = JSON.parse(JSON.stringify(result.opp));

                if (this.submitActionType == 'SAVE_AS_LEAD') {
                    this.finaliseDataUpdate();
                } else if (this.submitActionType == 'SUBMIT_AS_SALE' || this.submitActionType == 'MAKE_SPOUSE_PRIMARY') {
                    this.formDataToBeSubmitted.opp.Charge_Amount__c = this.formDataToBeSubmitted.creditCardInfo.ChargeAmount;
                    this.captureAnyExistingAuthorizations();
                } else if (this.submitActionType == 'CHARGE_2NDSETUP_FEE') {
                    this.formDataToBeSubmitted.opp.Charge_Amount__c = this.formDataToBeSubmitted.opp.SetupFee2_Amount__c;
                    this.captureAnyExistingAuthorizations();
                }
            })
            .catch((error) => {
                this.handleServerError(error);
                this.isLoading = false;
            })
    }

    captureAnyExistingAuthorizations() {

        captureExistingAuthorizations({
            data: this.formDataToBeSubmitted
        })
            .then((result) => {
                this.createAutorizedTransaction();
            })
    }

    wasTransactionAuthorized = false;
    createAutorizedTransaction() {
        this.isLoading = true;
        authorizeBeforeSubmittingAsSale({
            data: this.formDataToBeSubmitted
        })
            .then((result) => {
                this.formData = JSON.parse(JSON.stringify(result));
                this.formDataToBeSubmitted = JSON.parse(JSON.stringify(result));

                if (result.creditCardInfo.isBlockedBinNumber) {
                    this.showBinBlockCardModal = true;
                    this.wasTransactionAuthorized = false;
                    this.isLoading = false;
                } else if (result.creditCardInfo.declineErrorMessage && result.creditCardInfo.declineErrorMessage != '') {
                    this.wasTransactionAuthorized = false;
                    this.isLoading = false;
                    this.finaliseDataUpdate();
                } else {
                    this.wasTransactionAuthorized = true;
                    this.finaliseDataUpdate();
                }
            })
            .catch((error) => {
                this.handleServerError(error);
                this.isLoading = false;
            })
    }

    /*  Here is a list of scenarios covered in the finalise Data update method.
    1. If the form is INtake Lead form.
        A. if we reached because of the tranunion request on primary, we will change the context of the form Lead to Opportunity because we will have an opportunity now.
        B. else if We reached here by clicking on save as lead button, we will just redirect to opportunity detail page.
        C. if we reached here because of Submit as sale and the transaction was successfull, we show them welcome to programme popup.
        D. if SUBMIT_AS_Sale and the transaction failed:- 
            a. If it failed because of DONOTHONUR, we open the don not honur modal if its the first time else we open transaction failed modal.
            b. if it failed because of other reason, just show the reason and opne the transaction fail modal.
    
    2. If the form is Intake COntact form.
        A. 
    */


    finaliseDataUpdate() {

        this.isLoading = true;
        updateOnly({
            leadId: this.isIntakeLead ? this.recordId : null,
            data: this.formDataToBeSubmitted

        })
            .then((result) => {
                this.formData = JSON.parse(JSON.stringify(result));
                this.formDataToBeSubmitted = JSON.parse(JSON.stringify(result));

                if (result.creditCardInfo.isBlockedBinNumber || result.secondCreditCardInfo.isBlockedBinNumber) {
                    this.showBinBlockCardModal = true;
                } else {
                    if (this.isIntakeLead) {
                        if (this.isPrimaryTranunionContextOnIntake && this.submitActionType == 'SAVE_AS_LEAD') {
                            // Comes here if this method was called from intake form transunion for primary...
                            this.isPrimaryTranunionContextOnIntake = false;
                            this.changeContextToIntakeContact();
                        } else {
                            if (this.submitActionType == 'SAVE_AS_LEAD') {
                                if (this.source != 'CallScript') {
                                this.showToast('success', 'Warm lead created successfully!');
                                }
                                this.navigateToOpportunity();

                            } else if (this.submitActionType == 'SUBMIT_AS_SALE') {
                                if (this.wasTransactionAuthorized) {
                                    this.showWelcomeToTheProgrammeModal = true;//If the transaction was authrozed, we just open the welcome to programme modal
                                } else {
                                    this.handlePaymentFailedAfterFinalSubmission();
                                }
                            }
                        }
                    } else { //Actions for intake contact
                        if (this.submitActionType == 'SAVE_AS_LEAD') {
                            if (this.source != 'CallScript') {
                                if (this.isOpportunityActive) {
                                    this.showToast('success', 'Record updated successfully!')    
                                    
                                } else {                           
                                    this.showToast('success', 'Warm lead updated successfully!');
                                    
                                }
                            }
                            getRecordNotifyChange([{ recordId: this.recordId }]);
                            this.navigateToOpportunity();
                        } else if (this.submitActionType == 'MAKE_SPOUSE_PRIMARY') {
                            if (this.wasTransactionAuthorized) {
                                this.makeThePrimarySwitchHappen();
                            } else {
                                this.handlePaymentFailedAfterFinalSubmission();
                            }
                        } else if (this.submitActionType == 'CHARGE_2NDSETUP_FEE') {
                            if (this.wasTransactionAuthorized) {
                                this.showToast('success', '2nd Setup fee charged successfully!');
                                getRecordNotifyChange([{ recordId: this.recordId }]);
                                this.navigateToOpportunity();
                            } else {
                                this.handlePaymentFailedAfterFinalSubmission();
                            }
                        } else if (this.submitActionType == 'SUBMIT_AS_SALE') {
                            if (this.wasTransactionAuthorized) {
                                this.showWelcomeToTheProgrammeModal = true;
                            } else {
                                this.handlePaymentFailedAfterFinalSubmission();
                            }
                        }
                    }
                }
            })
            .catch((error) => {
                this.handleServerError(error);
            })
            .finally(() => {
                this.isLoading = false;
            })
    }

    handlePaymentFailedAfterFinalSubmission() {
        // if the transaction failed, this what will happen...
        if (this.formData.creditCardInfo.isBlockedBinNumber) {
            this.showBinBlockCardModal = true;
        } else if (this.formData.creditCardInfo.declineErrorMessage && this.formData.creditCardInfo.declineErrorMessage != '') {
            if (this.formData.creditCardInfo.declineErrorMessage === 'DoNotHonor') {
                // When the error message is donothonor, we also need to display a popup for this, so we manually take care of this error message.
                if (!this.formData.creditCardInfo.doNotHonurAlreadyFaced) {
                    this.formData.creditCardInfo.doNotHonurAlreadyFaced = true;
                    this.formDataToBeSubmitted.creditCardInfo.doNotHonurAlreadyFaced = true;
                    this.showDoNotHonurModal = true;
                } else {
                    //this.transactionErrorMessage = this.formData.creditCardInfo.declineErrorMessage;
                    //this.showTransactionFailedModal = true;
                    this.agreesTransactionFailedModal();
                }
            } else {
                this.transactionErrorMessage = this.formData.creditCardInfo.declineErrorMessage;
                this.showTransactionFailedModal = true;
            }
        }
    }

    //Bin blocked Card modal popup related work.
    showBinBlockCardModal = false;
    redirectBackToParent() {
        getRecordNotifyChange([{ recordId: this.recordId }]);
        this.dispatchEvent(new CloseActionScreenEvent());
    }

    submitNewCardAfterBlock() {
        this.showBinBlockCardModal = false;
    }


    //Spouse Search related variabled...
    showSpouseSeachComponent = false;
    startSpouseSearchProcess(event) {
        event.preventDefault();
        event.stopPropagation();

        this.showSpouseSeachComponent = true;
    }

    cancelSpouseSearchProcess() {
        this.showSpouseSeachComponent = false;
    }


    //Transaction failed modal up related work.
    showTransactionFailedModal = false;
    transactionErrorMessage = '';
    hideTransactionFailedModal() {
        this.showTransactionFailedModal = false;
        this.changeContextToIntakeContact();
    }

    hideRecordUpdateModal() {
       this.isRecordSavedSuccessfully = false;
    }

    agreesTransactionFailedModal(event) {
        if (this.isIntakeLead) {
            if (this.source == 'CallScript') {
                this.redirectFromCallScript(this.formDataToBeSubmitted.opp.Id);
            } else {
                this.navigateToOpportunity();
            }
        } else {
            if (this.source == 'CallScript') {
                this.redirectFromCallScript(this.recordId);
            } else {
                getRecordNotifyChange([{ recordId: this.recordId }]);
                eval("$A.get('e.force:refreshView').fire();");
                this.dispatchEvent(new CloseActionScreenEvent());
            }
        }
    }

    closeServiceForm() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }


    //Do not honur modal popup related work.
    showDoNotHonurModal = false;
    hideDoNotHonurModal() {
        this.showDoNotHonurModal = false;
        this.changeContextToIntakeContact();
    }

    resendAfterDoNotHonorResponse() {
        this.showDoNotHonurModal = false;
        this.createAutorizedTransaction();
    }

    handleSpouseSelection(event) {
        this.isLoading = true;
        if (event.detail) {
            if (!event.detail.startsWith('003')) {
                this.formDataToBeSubmitted.leadIdFromSpouseSearch = event.detail;
                this.formData.leadIdFromSpouseSearch = event.detail;
            } else {
                this.formDataToBeSubmitted.leadIdFromSpouseSearch = null;
                this.formData.leadIdFromSpouseSearch = null;
            }

            getSelectedSpouseInstance({
                selectedSpouseId: event.detail
            })
                .then(spouseContact => {
                    this.formData['spouseContact'] = Object.assign({}, spouseContact);
                    this.formDataToBeSubmitted['spouseContact'] = Object.assign({}, spouseContact);
                })
                .catch(error => {
                    this.handleServerError(error);
                })
                .finally(() => {
                    this.cancelSpouseSearchProcess();
                    this.isLoading = false;
                })
        }
    }

    //Handle tranunion for primary and spouse...
    async handleMakingTranunionRequest(event) {
        let istransunionForPrimary = event.detail.isPrimary;
        let allValid = true;
        if (istransunionForPrimary) {
            let contactInfoSection = this.template.querySelector('c-contact-information-section[data-cmptype="primary"]');
            let contactBillingInfoSection = this.template.querySelector('c-billing-information-section[data-cmptype="primary"]');

            if (contactInfoSection) {
                let isValid = contactInfoSection.isContactInformationValid();
                if (!isValid) {
                    allValid = false;
                } else {
                    this.formDataToBeSubmitted.primaryContact = { ...this.formDataToBeSubmitted.primaryContact, ...contactInfoSection.contactInformation };
                }
            }

            if (contactBillingInfoSection) {
                let valid = await contactBillingInfoSection.validateRequiredBillingInformation();
                if (!valid) {
                    allValid = false;
                } else {
                    this.formDataToBeSubmitted.primaryContact = { ...this.formDataToBeSubmitted.primaryContact, ...contactBillingInfoSection.getBillingInformation() };
                }
            }

            if (allValid) {
                if (!this.formDataToBeSubmitted.primaryContact.Spouse__c && this.formDataToBeSubmitted.spouseContact && this.formDataToBeSubmitted.spouseContact.Id) {
                    this.formDataToBeSubmitted.primaryContact.Spouse__c = this.formDataToBeSubmitted.spouseContact.Id;
                }

                this.startTheUpsertBeforeTransunion(this.formDataToBeSubmitted.primaryContact, istransunionForPrimary);
            }
        } else {
            let contactInfoSection = this.template.querySelector('c-contact-information-section[data-cmptype="spouse"]');
            let contactBillingInfoSection = this.template.querySelector('c-billing-information-section[data-cmptype="spouse"]');

            if (contactInfoSection) {
                let isValid = contactInfoSection.isContactInformationValid();
                if (!isValid) {
                    allValid = false;
                } else {
                    this.formDataToBeSubmitted.spouseContact = { ...this.formDataToBeSubmitted.spouseContact, ...contactInfoSection.contactInformation };
                }
            }

            if (contactBillingInfoSection) {
                let valid = await contactBillingInfoSection.validateRequiredBillingInformation();
                if (!valid) {
                    allValid = false;
                } else {
                    this.formDataToBeSubmitted.spouseContact = { ...this.formDataToBeSubmitted.spouseContact, ...contactBillingInfoSection.getBillingInformation() };
                }
            }

            if (allValid) {
                if (!this.formDataToBeSubmitted.spouseContact.Spouse__c && this.formDataToBeSubmitted.primaryContact.Id) {
                    this.formDataToBeSubmitted.spouseContact.Spouse__c = this.formDataToBeSubmitted.primaryContact.Id;
                }

                this.startTheUpsertBeforeTransunion(this.formDataToBeSubmitted.spouseContact, istransunionForPrimary);
            }
        }
    }

    startTheUpsertBeforeTransunion(contact, istransunionForPrimary) {
        this.isLoading = true;
        updateContactBeforeTranunion({
            contactRecord: contact
        })
            .then(result => {
                if (istransunionForPrimary) {
                    this.formDataToBeSubmitted.primaryContact = Object.assign({}, result);
                    this.makeTheFinalTransunionCallTogetTheLink(this.formDataToBeSubmitted.primaryContact, istransunionForPrimary);
                } else {
                    this.formDataToBeSubmitted.spouseContact = Object.assign({}, result);
                    this.makeTheFinalTransunionCallTogetTheLink(this.formDataToBeSubmitted.spouseContact, istransunionForPrimary);
                }
            })
            .catch(error => {
                this.handleServerError(error);
                this.isLoading = false;
            })
    }

    //This varible handles a special case where we need to redirect to intake contact if we are doing tranunion primary on intake lead form.
    isPrimaryTranunionContextOnIntake = false;
    makeTheFinalTransunionCallTogetTheLink(contact, istransunionForPrimary) {
        makeTransUnionCall({
            contactRecord: contact
        })
            .then(result => {
                if (istransunionForPrimary) {
                    this.formDataToBeSubmitted.primaryContact = Object.assign({}, result);
                    this.formData.primaryContact = Object.assign({}, result);

                    if (this.formDataToBeSubmitted.primaryContact.TransUnionAuth_Link__c) {
                        window.open(this.formDataToBeSubmitted.primaryContact.TransUnionAuth_Link__c, "_blank");
                    } else {
                        this.showToast('error', 'There was a problem getting the link. Please refer the most recent Api response record for more information.');
                    }

                    //From the intakeformLead, when we make the transunion call, the context is changed from lead to contact and we upsert the opportunity
                    //So here we call the final save and move on to intake contact.
                    if (this.isIntakeLead) {
                        this.isPrimaryTranunionContextOnIntake = true;
                        this.validateForm('SAVE_AS_LEAD');
                    }
                } else {
                    console.log('result transunion == ', result);
                    this.formDataToBeSubmitted.spouseContact = Object.assign({}, result);
                    this.formData.spouseContact = Object.assign({}, result);

                    if (this.formDataToBeSubmitted.spouseContact.TransUnionAuth_Link__c) {
                        window.open(this.formDataToBeSubmitted.spouseContact.TransUnionAuth_Link__c, "_blank");
                    } else {
                        this.showToast('error', 'There was a problem getting the link. Please refer the most recent Api response record for more information.');
                    }
                }
            })
            .catch(error => {
                this.handleServerError(error);
            })
            .finally(() => {
                this.refreshAvailableProductList();
                this.isLoading = false;
            })
    }


    //Package change using button section...
    showPackageChangeConfirmationModal = false;
    packageChangeAction = null;
    showPackageChangeConfirmation(event) {
        this.showPackageChangeConfirmationModal = true;

        if (event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.actiontype) {
            this.packageChangeAction = event.currentTarget.dataset.actiontype;
        }
    }

    hidePackageChangeConfirmation() {
        this.showPackageChangeConfirmationModal = false;
    }

    get packageChangeModalHeader() {
        if (this.isCoupleSubscription) {
            return 'Remove Family Member?'
        } else {
            return 'Family add-on?';
        }
    }

    managePackageChangeConfirmation() {
        //Makings ure this gets calkled only when there is an event in context and not when we call this method manually.
        this.hidePackageChangeConfirmation();
        let allValid = true;
        //Before making any changes in the ackages, sync the contact data with data that needs to be sent to server.
        let primaryBillingSection = this.template.querySelector('c-billing-information-section[data-cmptype="primary"]');
        if (primaryBillingSection) {
            this.formData.primaryContact = { ...this.formData.primaryContact, ...primaryBillingSection.contact };
        }
        let contactInfoSection = this.template.querySelector('c-contact-information-section[data-cmptype="primary"]');
        if (contactInfoSection) {
            this.formData.primaryContact = { ...this.formData.primaryContact, ...contactInfoSection.contactInformation };
        }
        if (this.packageChangeAction == 'ADD_FAMILY_MEMBER') {
            this.commitFamilyAddOn();
        } else if (this.packageChangeAction == 'REMOVE_FAMILY_MEMBER') {
            this.formData.selectedPackage.IndividualOrCouple = 'Individual';
            this.refreshAvailableProductList();
        }
    }

    commitFamilyAddOn() {
        this.formData.selectedPackage.IndividualOrCouple = 'Couple';
        this.isLoading = true;

        confirmFamilyAddOn({
            selectedPackage: this.formData.selectedPackage,
            primaryContact: this.formData.primaryContact
        })
            .then(result => {
                console.log('result.spouseContact == ', result.spouseContact);

                // It need to be added to both the arrays here, otherwise it will not sync as serviceFormDataToBeSubmitted will still have old data.
                this.formData['spouseContact'] = Object.assign({}, result.spouseContact);
                this.formDataToBeSubmitted['spouseContact'] = Object.assign({}, result.spouseContact);

                this.refreshAvailableProductList();

                let spouseSection = this.template.querySelector('.spouse-information_section');
                if (spouseSection) {
                    spouseSection.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
                }
            })
            .catch(error => {
                this.handleServerError(error);
            })
    }

    finalisePackageChange() {
        //From intake form, only family add on is allowed for package change, so we make sure the dropdown stays disabled if package option is changed again

        if (this.formData.selectedPackage.IndividualOrCouple != this.formData.originalPackage.IndividualOrCouple) {
            let packageOptionDropdown = this.template.querySelector('c-combobox[data-type="PackageOptions"]');
            if (packageOptionDropdown) {
                packageOptionDropdown.disabled = false;
            }
        } else {
            let packageOptionDropdown = this.template.querySelector('c-combobox[data-type="PackageOptions"]');
            if (packageOptionDropdown) {
                packageOptionDropdown.disabled = true;
            }
        }
    }

    //When spouse need o be changed to primary, this is what happens...
    showMakePrimaryconfirmation = false;

    get makePrimaryConfirmationBody() {
        if (this.formData.originalPackage.IndividualOrCouple == 'Couple') {
            return 'Confirm Switching Family member to Primary';
        } else {
            return 'Family member is not enrolled as client. Clicking Confirm will charge the client, enroll Family member and then switch them to primary.';
        }
    }

    //Making Primary related variables..
    handleMakingPrimary() {
        this.showMakePrimaryconfirmation = true;
    }

    cancelMakePrimaryconfirmation() {
        this.showMakePrimaryconfirmation = false;
    }

    handleServerError(error) {
        console.log(error);
        if (error && error.body && error.body.message) {
            this.showToast('error', error.body.message);
        } else if (error && error.body && error.body.pageErrors && error.body.pageErrors.length > 0) {
            this.showToast('error', error.body.pageErrors[0].message);
        }
    }


    async confirmMakingPrimary() {
        if (this.formData.originalPackage.IndividualOrCouple == 'Couple') {
            // the spouse can be made primary we check if information on spose is already validated or not. If it is then we directly skip to the primary part, otherwise we validate the spouse first.
            /* Contact Information section validation for primary and spouse*/
            this.isLoading = true;
            let allValid = true;
            let spouseInfoSection = this.template.querySelector('c-contact-information-section[data-cmptype="spouse"]');
            if (spouseInfoSection) {
                let isValid = spouseInfoSection.isContactInformationValid();
                if (!isValid) {
                    allValid = false;
                } else {
                    this.formDataToBeSubmitted.spouseContact = { ...this.formDataToBeSubmitted.spouseContact, ...spouseInfoSection.contactInformation };
                }
            }

            /* Billing Information Section validation for primary and spouse*/
            let spouseBillingInfoSection = this.template.querySelector('c-billing-information-section[data-cmptype="spouse"]');
            if (spouseBillingInfoSection) {
                let valid = await spouseBillingInfoSection.validateRequiredBillingInformation();
                if (!valid) {
                    allValid = false;
                } else {
                    this.formDataToBeSubmitted.spouseContact = { ...this.formDataToBeSubmitted.spouseContact, ...spouseBillingInfoSection.getBillingInformation() };
                }
            }
            this.isLoading = false;
            if (allValid) {
                // Call the method for making the spouse primary.
                this.makeThePrimarySwitchHappen();
            }
        } else {
            // This is a new requirement because if the spouse is not enrolled then we need to make the charge first, enroll the spouse and then make it primary.
            // here if the product was individual at the start but now its spouse that we need to make sure there is extra amount in net balance due. if there is that means we havnt charged the product yet.

            if (this.formData.originalPackage.IndividualOrCouple == 'Individual' && this.formData.selectedPackage.IndividualOrCouple == 'Couple') {
                if (!this.formData.selectedPackage.ProductId || this.formData.selectedPackage.ProductId == this.formData.originalPackage.ProductId) {
                    this.showToast('error', 'Package option was changed. Please selecte a new package.');
                } else {
                    this.validateForm('MAKE_SPOUSE_PRIMARY');
                }
            }
        }
        this.cancelMakePrimaryconfirmation();
    }


    makeThePrimarySwitchHappen() {
        this.isLoading = true;
        MakeSpousePrimary({
            data: this.formDataToBeSubmitted
        })
            .then(result => {
                //Sync both the arrays to make sure they have the updated data.
                //Changes are only made in the primary and spouse contact record so we will just assign the new instances back.
                this.formDataToBeSubmitted.spouseContact = Object.assign({}, result.spouseContact);
                this.formData.spouseContact = Object.assign({}, result.spouseContact);

                this.formDataToBeSubmitted.primaryContact = Object.assign({}, result.primaryContact);
                this.formData.primaryContact = Object.assign({}, result.primaryContact);

                this.formDataToBeSubmitted.opp = Object.assign({}, result.opp);
                this.formData.opp = Object.assign({}, result.opp);

                this.showToast('success', 'Primary contact changed successfully!');
                this.init();
            })
            .catch(error => {
                if (error && error.body && error.body.message) {
                    this.showToast('error', error.body.message);
                }
            })
            .finally(() => {
                this.isLoading = false;
                this.cancelMakePrimaryconfirmation();
            })
    }


    //Welcome to the programme handler...
    showWelcomeToTheProgrammeModal = false;

    changeContextToIntakeContact() {
        this.recordId = this.formData.opp.Id;
        this.objectApiName = 'Opportunity__c';
        this.init();
    }

    redirectToCallScriptOrNot(){
        
        if (this.source == 'CallScript' && this.submitActionType != 'SAVE_AS_LEAD'  && !this.isIntakeLead) {
            showWelcomeToTheProgrammeModal =false;
        }else{
            this.navigateToOpportunity();
        }
    }

    navigateToOpportunity() {
        // Navigate to the opportunity home page
        if (this.source == 'CallScript' && this.submitActionType != 'SAVE_AS_LEAD') {
            if (event) {
                console.log('preventing event idddd====');
                event.preventDefault();

            }
            this.redirectFromCallScript(this.formDataToBeSubmitted.opp.Id);
            //this.isRecordSavedSuccessfully =true;


        } else if (this.source == 'CallScript' && this.submitActionType == 'SAVE_AS_LEAD' && this.isIntakeLead ) {
            if (event) {
                event.preventDefault();
            }
            this.isRecordSavedSuccessfully =true;
            /*var baseurrrl = window.location.origin;
            var recordpageurl = baseurrrl + '/apex/call_Script_App_New?id=' + this.formDataToBeSubmitted.opp.Id;
            console.log('recordpageurlll' + recordpageurl);
            window.open(recordpageurl, "_parent");*/

        }else if (this.source == 'CallScript' && this.submitActionType == 'SAVE_AS_LEAD' && !this.isIntakeLead ) {
            if (event) {
                event.preventDefault();
            }
            this.isRecordSavedSuccessfully =true;
            /*var baseurrrl = window.location.origin;
            var recordpageurl = baseurrrl + '/apex/call_Script_App_New?id=' + this.formDataToBeSubmitted.opp.Id;
            console.log('recordpageurlll' + recordpageurl);
            window.open(recordpageurl, "_parent");*/

        } else {
            eval("$A.get('e.force:refreshView').fire();");
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.formDataToBeSubmitted.opp.Id,
                    actionName: 'view',
                },
            });
        }
    }

    navigateToContact(event) {
        // Navigate to the Contact home page
        if (this.source == 'CallScript') {

            if (event) {
                console.log('preventing event idddd====');
                event.preventDefault();
            }
            this.redirectFromCallScript(this.formDataToBeSubmitted.primaryContact.Id);
        }
        else {
            this[NavigationMixin.Navigate]({
                type: 'standard__recordPage',
                attributes: {
                    recordId: this.formDataToBeSubmitted.primaryContact.Id,
                    actionName: 'view',
                },
            });
        }
    }

    toggleSection(event) {
        if (this.source == 'CallScript') {

            if (event) {
                console.log('preventing event idddd====');
                event.preventDefault();
            }

        }




        let parentDiv = event.currentTarget.parentElement;
        if (parentDiv.classList.contains('slds-is-open')) {
            parentDiv.classList.remove('slds-is-open');
        } else {
            parentDiv.classList.add('slds-is-open');
        }
    }

    showToast(variant, content) {

        if (this.source == 'CallScript') {
            this.customToastvariant = variant;
            this.customToastMessage = content;
            this.template.querySelector('c-custom-Toast').showCustomNotice();

            const topDiv = this.template.querySelector('[data-id="redDiv"]');
            topDiv.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

        }
        else {
            const event = new ShowToastEvent({
                variant: variant,
                message: content,
            });
            this.dispatchEvent(event);
        }
    }


    redirectFromCallScript(recid) {
        var baseurrrl = window.location.origin;
        var recordpageurl = baseurrrl + '/' + recid;
        console.log('recordpageurlll' + recordpageurl);
        window.open(recordpageurl, "_parent");
    }

    fixDateFormat(dateFieldValue) {
        //var dateField = $(dateField);
        //var dateFieldValue =$(dateField).val();
        if (dateFieldValue != "") {
            // This confirms that the format of the date entered is a valid one and date is correct so we can check we need to add any leading zeros in the field.
            var existingdate = new Date(dateFieldValue);

            if (dateFieldValue.trim() != "" && existingdate != 'Invalid Date') {
                var splittedDate = dateFieldValue.split('/');
                var newDate = '';

                for (var i = 0; i < splittedDate.length; i++) {
                    if (splittedDate[i].length == 1) {
                        newDate += '0' + splittedDate[i] + '/';
                    } else if (splittedDate[i].length == 4) {
                        newDate += '' + splittedDate[i];
                    } else {
                        newDate += '' + splittedDate[i] + '/';
                    }
                }
                return newDate;
                //$(dateField).val(newDate);
            }
        }
    }

    handlePrimaryCardSelect(event){
        this.formData.creditCardInfo.CardNumber=event.detail;
    }

}