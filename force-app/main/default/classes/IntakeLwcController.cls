/*******************************************************************************************
* @Name         IntakeLwcController 
* @Author       Amit Yadav <support@kcloudtechnologies.com>
* @Date         12/09/2021
* @Description  This class will contain the logic for Intake Lead form that is being redone as a lwc.
*******************************************************************************************/
/* MODIFICATION LOG
* Version          Developer          Date               Description
*-------------------------------------------------------------------------------------------
*  1.0              Amit             12/09/2021         Initial Creation  
*  1.1              Ankit            01/02/2022         Changed populateAllPackageOptions method , beacuse We need to filter the package options based on negative Count and status of Contact    
*  1.2              Ankit            22/02/2022         Added condition to mark Charge 2nd Setup Fee true on opportunity , when successfully charged
*  1.3              Saurabh          11/02/2022         Added condition for product hidden on basis of  Authentication Requested checkbox
*  1.4              Ankit            03/15/2022         Make Change in  populateAllPackageOptions method , query negative Count from Contact to get updated value  
*  1.5              Ankit            04/01/2022         Set Charge Date = 'Last Day' if todays day is 31st in getSelectedPackageInformation method
*******************************************************************************************/
public class IntakeLwcController {
    /**************************************************************************************
* @Description  This method will fetch the initial details needed for the intake lead form to load based on the passed record Id.
* @Param        recordId: recordid of a contact or an opportunity.
* @Return       
* @Example      IntakeLwcController.initializeLeadIntakeForm()
**************************************************************************************/ 
    @AuraEnabled    
    Public Static FormUtils.FormData initializeIntakeForm(Id recordId){
        FormUtils.FormData data = new FormUtils.FormData();
        
        if(String.isNotBlank(recordId)){
            Schema.SObjectType sObjectType = recordId.getSObjectType();
            String objectType = sObjectType.getDescribe().getName();
            
            if(objectType == 'Lead__c'){
                Lead__c lead = [select id,status__c, Lead_Credit_Score_c__c,Lead_ID__c, Acuity_id__c,IP_Address__c,Jigsaw__c,HasOptedOutOfFax__c,IsConverted__c,HasOptedOutOfEmail__c,Transunion_Authentication__c,contact__r.id,Company__c,Spanish_Speaker__c,Where_did_the_client_come_from__c,contact__r.name,contact__c,CreatedDate,DB_Lead_Age__c,advertiserName__c,Affiliate_Name__c,Affiliate_Sub_ID_1__c,Affiliate_Sub_ID_2__c,Affiliate_Sub_ID_3__c,Affiliate_Sub_ID_4__c,Affiliate_Sub_ID_5__c,Affiliate_Tier__c,Agent_ID__c,bv__c,Call_Duration__c,Call_Setter_Number__c,Call_Start_Date_and_Time__c,CampaignContent__c,CampaignMedium__c,
                                CampaignName__c,CampaignSource__c,CampaignTerm__c,City__c,Country__c,Credit_Card_CVV__c,Credit_Card_Exp_Month__c,Credit_Card_Exp_Year__c,Credit_Card_Number__c,Credit_Summary_Requested__c,destination_phone_number__c,D_O_B__c,Email__c,Employment_Status__c,FirstName__c,
                                GA_ClientID__c,GCLID__c,GUID_1__c,Referred_By__c,GUID_2__c,GUID_3__c,hasOffersAffID__c,InvocaSource__c,LastName__c,LeadSource__c,Lead_Portal_Email_Activation__c,Lead_Portal_Link__c,MiddleName__c,MobilePhone__c,  OfferID__c,Package__c,
                                Pay_Frequency__c,PhoneExternal__c,Phone__c,Portal_ID__c,User_Rating__c,PostalCode__c,Rent_Own__c,Salutation__c,SSN_Not_Encrypted__c,State__c,Street__c,SubmitterIP__c,Suffix__c,Title__c,transactionID__c,Manual_Input__c,TransUnionAuth_Link__c,UnbouncePageVariant__c,
                                UnbounceSubmissionDate__c,UnbounceSubmissionTime__c,Profile_visibility_to_Rate__c,OwnerId,Website__c,PhoneExternalOther__c,Secondary_Phone__c from lead__c where id=:recordId];
                
                if(Lead__c.Id != null){
                    
                    data.primaryContact = new Contact();
                    
                    for (ConvertLeadMApping__c ConvertLeadMApping: ConvertLeadMApping__c.getall().Values()){
                        if(String.isNotBlank(ConvertLeadMApping.Name) && ConvertLeadMApping.Name == 'PhoneExternal__c' && String.isNotBlank(ConvertLeadMApping.contactField__c) && lead.get(ConvertLeadMApping.Name)!=null){
                            data.primaryContact.put(ConvertLeadMApping.contactField__c,String.valueOf(lead.get(ConvertLeadMApping.Name)).replaceAll('[^0-9]',''));
                        }else if(String.isNotBlank(ConvertLeadMApping.Name) && String.isNotBlank(ConvertLeadMApping.contactField__c) && lead.get(ConvertLeadMApping.Name)!=null){
                            data.primaryContact.put(ConvertLeadMApping.contactField__c,lead.get(ConvertLeadMApping.Name));   
                        }
                    }
                    
                    if(String.isNotBlank(lead.FirstName__c)){
                        data.primaryContact.FirstName = (lead.FirstName__c).toLowerCase().capitalize();
                    }
                    if(String.isNotBlank(lead.MiddleName__c)){
                        data.primaryContact.MiddleName = (lead.MiddleName__c).toLowerCase().capitalize();
                    }
                    
                    if(String.isNotBlank(lead.LastName__c)){
                        data.primaryContact.LastName = (lead.LastName__c).toLowerCase().capitalize();
                    }
                    
                    if(String.isNotBlank(lead.contact__c)){
                        data.primaryContact.id =lead.contact__c;
                    }
                    
                    data.primaryContact.Referred_by_Client__c = lead.Referred_By__c;
                    data.primaryContact.Secondary_Phone__c=lead.Secondary_Phone__c;
                    data.primaryContact.Agent_ID__c = lead.Agent_ID__c;
                    data.primaryContact.User_Rating__c = lead.User_Rating__c;
                    data.primaryContact.Profile_visibility_to_RateContact__c = lead.Profile_visibility_to_Rate__c; 
                    data.primaryContact.SSN_hidden_field__c = lead.SSN_Not_Encrypted__c;
                    data.primaryContact.Active__c = true;
                    data.primaryContact.Status__c = 'Active';
                    data.primaryContact.Contact_Type__c='Warm Lead';
                    data.primaryContact.MailingCountry='United States';
                    data.primaryContact.otherCountry='United States';
                    
                    data.opp = new Opportunity__c(StageName__c = 'Working');
                    data.selectedPackage = new FormUtils.PackageDetail();
                    data.originalPackage = new FormUtils.PackageDetail();
                    data.creditCardInfo = new FormUtils.CreditCardWrap();
                    data.creditCardInfo.isCardSelectedAsRecurring = true;
                    
                    data.secondCreditCardInfo = new FormUtils.CreditCardWrap();
                    
                    FormUtils.FormData partialData = IntakeLwcController.populateAllPackageOptions(data, data.primaryContact.MailingState);
                    data.upgradedPackages = partialData.upgradedPackages;
                    data.selectedPackage = partialData.selectedPackage;
                    
                    
                    if(lead.Status__c == 'Converted' && lead.isConverted__c){
                        data.isLeadConverted = true;
                    }else{
                        data.isLeadConverted = false;
                    }
                }
            }else{
                String opportunityId = null;
                String primaryContactId = null;
                String spouseContactId = null;
                
                if(objectType == 'Contact'){
                    primaryContactId = recordId;
                    for(OpportunityContactRole__c role : [select id, ContactId__r.Spouse__c, IsPrimary__c,ContactId__c from OpportunityContactRole__c where ContactId__c =: recordId and ContactId__r.Spouse__c != null and OpportunityId__r.StageName__c!='Cancelled' limit 1 ]){
                        if(!role.IsPrimary__c){
                            primaryContactId = role.ContactId__r.Spouse__c;
                            spouseContactId = role.ContactId__c;
                        }else{
                            spouseContactId = role.ContactId__r.Spouse__c;
                            primaryContactId = role.ContactId__c;
                        }
                        
                    }
                    
                    for(Contact con : [select id,FirstName,MiddleName,lastName,Opportunity__c, Contact_Type__c, Opportunity__r.stageName__c, Opportunity__r.Net_Balance_Due__c from Contact where Id =:primaryContactId]){
                        if(con.Opportunity__c!=null){
                            opportunityId = con.Opportunity__c;
                            if(String.isNotBlank(con.Opportunity__r.StageName__c) && con.Opportunity__r.StageName__c == 'Cancelled' && con.Opportunity__r.Net_Balance_Due__c <= 0){
                                throw new AuraException('Cancelled');
                            }}else{
                                Opportunity__c opp = new Opportunity__c();
                                if(string.isnotBlank(con.FirstName)){
                                    opp.name = con.FirstName.substring(0,1)+' ';
                                }
                                if(string.isnotBlank(con.MiddleName)){
                                    opp.name += con.MiddleName.substring(0,1)+' ';
                                }
                                if(string.isnotBlank(con.lastName)){
                                    opp.name += con.lastName+'-1-';
                                }
                                opp.name +=system.now().month()+''+system.now().day()+''+system.now().year();
                                opp.StageName__c = 'Working';
                                opp.Contact__c = con.id;
                                try{
                                    insert opp;
                                    opportunityId=opp.id;
                                }Catch(exception e){
                                    throw new AuraException(e.getMessage());
                                }  
                            }
                    }
                }else if(objectType == 'Opportunity__c'){
                    for(Opportunity__c opp : [select id, Contact__c, StageName__c, Net_Balance_Due__c, Contact_Type__c, (Select id, ContactId__c, IsPrimary__c from OpportunityContactRoles__r) from Opportunity__c where Id =: recordId]){
                        if(String.isNotBlank(opp.StageName__c) && opp.stageName__c == 'Cancelled' && opp.Net_Balance_Due__c <= 0){
                            throw new AuraException('Cancelled');
                        }else if(opp.OpportunityContactRoles__r.size() > 0){
                            for(OpportunityContactRole__c contactRole : opp.OpportunityContactRoles__r){
                                if(contactRole.IsPrimary__c && contactRole.ContactId__c == opp.Contact__c){
                                    primaryContactId = contactRole.ContactId__c;
                                }else if(!contactRole.IsPrimary__c){
                                    spouseContactId = contactRole.ContactId__c;
                                }
                            }
                        }
                        
                        opportunityId = recordId;
                        if(String.isBlank(primaryContactId)){
                            primaryContactId = opp.Contact__c;
                        }
                    }
                }
                
                if(String.IsNotBlank(opportunityId) && String.isNotBlank(primaryContactId)){
                    data =  FormUtils.getData(opportunityId, primaryContactId, spouseContactId);
                    
                    FormUtils.FormData partialData = IntakeLwcController.populateAllPackageOptions(data, data.primaryContact.MailingState);
                    
                    data.upgradedPackages = partialData.upgradedPackages;
                    data.selectedPackage = partialData.selectedPackage;
                    
                    
                    data.secondCreditCardInfo = new FormUtils.CreditCardWrap();
                }else{
                    throw new AuraException('Invalid contact or opportunity selected. Record missing critical information.');
                }
            }
        }else{
            throw new AuraException('No valid object found for the intake form to work.');
        }
        
        return data;
    }
    
    
    /**************************************************************************************
* @Description  this method will get a list of products available for selected on certain criterias.
* @Param        selectedPackage: information about the package like if its monthly, individual or couple etc.
primaryMailingState:  state of the primary contact
* @Return       FormUtils.FormData: an instance of form with just upgradedPackages and select package.
* @Example      IntakeLwcController.populateAllPackageOptions()
**************************************************************************************/ 
    @AuraEnabled
    public Static FormUtils.FormData populateAllPackageOptions(FormUtils.FormData formdata, String primaryMailingState){
        // We could have used just one query and then use a lot of if else to decide which product goes where, but i figured it will be just easier to use 2 queries and avoid a lot of cinfusing code.
        
        FormUtils.PackageDetail selectedPackage=formdata.selectedPackage;
            
        FormUtils.FormData data = new FormUtils.FormData();
        List<FormUtils.SelectOption> packagesList = new List<FormUtils.SelectOption>();
        
        
        /*CreditCardWrap creditCardInfo = new CreditCardWrap();
creditCardInfo = allData.creditCardInfo;*/
        
        if(String.isNotBlank(formdata.primaryContact.id)){
            Contact updatedCon=[select id,Negative_Item_Count__c from contact where id =: formdata.primaryContact.id];
            formdata.primaryContact.Negative_Item_Count__c=updatedCon.Negative_Item_Count__c;
        }
        
        if(String.isNotBlank(SelectedPackage.ProductType)){
            packagesList = new List<FormUtils.SelectOption>();
            String Query = 'select id,Sales_Group__c,name,Online_Only__c,Initial_Fee__c,States_Allowed__c,States_Restrictions_Apply__c,X2nd_Setup_Fee_Amount__c,Subtype__c,Authentication_Requested__c from product__c where isActive__c = true AND Admin_Only__c = false AND Authentication_Requested__c = false AND Online_Only__c =\'No\' AND Package_Type__c = \''+'Monthly'+'\' AND ProductType__c = \''+SelectedPackage.ProductType+'\' AND IndividualOrCouple__c =\''+SelectedPackage.IndividualOrCouple+'\' AND ((States_Restrictions_Apply__c = \'Yes\' AND States_Allowed__c INCLUDES (\''+primaryMailingState+'\')) OR States_Restrictions_Apply__c != \'Yes\') order by Name asc';
            
            if(formdata.primaryContact.Negative_Item_Count__c!=null && formdata.primaryContact.Negative_Item_Count__c>0 && formdata.primaryContact.Contact_Type__c=='Warm Lead'){
               // we dont have to show Money Managament Products in this case so we will filter it out
                Query = 'select id,Sales_Group__c,name,Online_Only__c,Initial_Fee__c,States_Allowed__c,States_Restrictions_Apply__c,X2nd_Setup_Fee_Amount__c,Subtype__c,Authentication_Requested__c from product__c where isActive__c = true AND Admin_Only__c = false AND Authentication_Requested__c = false AND Online_Only__c =\'No\' AND Package_Type__c = \''+'Monthly'+'\' AND ProductType__c = \''+SelectedPackage.ProductType+'\' AND IndividualOrCouple__c =\''+SelectedPackage.IndividualOrCouple+'\' AND ((States_Restrictions_Apply__c = \'Yes\' AND States_Allowed__c INCLUDES (\''+primaryMailingState+'\')) OR States_Restrictions_Apply__c != \'Yes\') AND Subtype__c!=\'Money Management\' order by Name asc';   
            }
            
            system.debug('Query== '+Query);
            Map<Id, Set<String>> groupMemberMap = new Map<Id, Set<String>>();
            
            Set<String> allGroupIds = new Set<String>();
            List<Product__c> queriedProducts = new List<Product__c>();
            for(Product__c product : Database.Query(Query)){
                if(String.isNotBlank(product.Sales_Group__c)){
                    for(String groupId : product.Sales_Group__c.split(';')){
                        if(groupId instanceOf Id){
                            allGroupIds.add(Id.valueOf(groupId));
                        }
                    }
                }
                queriedProducts.add(product);
            }
            
            for(GroupMember GroupMem: [Select Id, GroupId, UserOrGroupId From GroupMember where group.id IN :allGroupIds]){
                if(!groupMemberMap.containsKey(GroupMem.GroupId)){
                    groupMemberMap.put(GroupMem.GroupId, new Set<String>());
                }
                groupMemberMap.get(GroupMem.GroupId).add(GroupMem.UserOrGroupId);
            }
            
            List<Id> newAvailableProductIds = new List<Id>();
            for(Product__c product : queriedProducts){
                Boolean userEligibleForSellingThisProduct = false;
                if(String.isNotBlank(product.Sales_Group__c)){
                    for(String groupId : product.Sales_Group__c.split(';')){
                        if(groupId instanceOf Id){
                            if(groupMemberMap.containsKey(Id.valueOf(groupId)) && groupMemberMap.get(Id.valueOf(groupId)).contains(UserInfo.getUserId())){
                                userEligibleForSellingThisProduct = true;
                            }
                        }
                    }
                }
                if(String.isBlank(product.Sales_Group__c) || (String.isNotBlank(product.Sales_Group__c) && userEligibleForSellingThisProduct)){
                    // there was no option for none in selected package and if we were changing product select options, the selected package would automatically be different
                    // when we switched back to the original product select option, original package was lost now and hence i decide to populate it back from wrapper class if it was in the list of relevant products.
                    packagesList.add(new FormUtils.SelectOption(product.id,product.Name)); 
                    newAvailableProductIds.add(product.id);
                }
            }
            
            if(newAvailableProductIds.size() > 0 && (String.isBlank(selectedPackage.ProductId) || !newAvailableProductIds.contains(selectedPackage.ProductId))){
                selectedPackage.ProductId = newAvailableProductIds[0];
            }
        }
        
        if(packagesList.size() == 0 || String.isBlank(SelectedPackage.ProductType)){
            // flow comes here if we select the package type as none on the page.
            // if we come here, we need to set the balance due amount equal to the net balance due and rest balance dues according to that...
            packagesList = new List<FormUtils.SelectOption>();
            selectedPackage.ProductId = null;
            selectedPackage.InitialFee = 0;
            FormUtils.CreditCardWrap creditCardInfo = new FormUtils.CreditCardWrap();
            creditCardInfo.ChargeAmount = 0;
            data.creditCardInfo = creditCardInfo;
            
        }
        
        
        data.upgradedPackages = packagesList;
        data.selectedPackage = selectedPackage;
        return data;
    }
    
    
    /**************************************************************************************
* @Description  this method get information about the package that is selected on the component.
* @Param        ProductId: id of the product for which we need the information.
* @Return       FormUtils.FormData: an instance of form with just upgradedPackages and select package.
* @Example      IntakeLwcController.getSelectedPackageInformation()
**************************************************************************************/ 
    @AuraEnabled
    public Static FormUtils.FormData getSelectedPackageInformation(Opportunity__c opp, FormUtils.PackageDetail selectedPackage, FormUtils.PackageDetail originalPackage, FormUtils.CreditCardWrap creditCardInfo){
        Decimal BalanceDue = 0;
        if(String.isNotBlank(selectedPackage.ProductId)){
            
            Product__c OriginalProduct = new Product__c();
            // First we get the details of the package that is selcted right now on the opportunity so that we can compare it with the new product that is selcted now.
            if(String.isNotBlank(originalPackage.ProductId)){
                for(Product__c product : [select id,Package_Type__c,ProductType__c,X2nd_Setup_Fee_Amount__c,IndividualOrCouple__c,Initial_Fee__c,Enrollment_Fee__c from Product__c where id =: originalPackage.ProductId]){
                    OriginalProduct = product ;
                }
            }
            
            if(String.isNotBlank(OriginalProduct.id)){
                for(Product__c product : [select id,Package_Type__c,ProductType__c,X2nd_Setup_Fee_Amount__c,IndividualOrCouple__c,Initial_Fee__c,Enrollment_Fee__c from Product__c where id =: selectedPackage.ProductId]){
                    if(product.Package_Type__c != 'PFR'){
                        if(opp.SetupFee2_Date__c != null && opp.SetupFee2_Date__c > system.today()){
                            if(opp.stageName__c != 'working' && opp.stageName__c != 'Dead'){
                                if(OriginalProduct.Initial_Fee__c < product.Initial_Fee__c){
                                    BalanceDue = (opp.Net_Balance_Due__c + (product.Initial_Fee__c - OriginalProduct.Initial_Fee__c)) - creditCardInfo.AmountAlreadyChargedToClient;
                                }else{
                                    BalanceDue = opp.Net_Balance_Due__c - creditCardInfo.AmountAlreadyChargedToClient;
                                }
                            }else{
                                BalanceDue = product.Initial_Fee__c;
                            }
                        }else{
                            if(opp.stageName__c != 'working' && opp.stageName__c != 'Dead'){
                                system.debug('OriginalProduct.Enrollment_Fee__c == '+OriginalProduct.Enrollment_Fee__c);
                                system.debug('product.Enrollment_Fee__c == '+product.Enrollment_Fee__c);
                                system.debug('opp.Net_Balance_Due__c == '+opp.Net_Balance_Due__c);
                                if(OriginalProduct.Enrollment_Fee__c < product.Enrollment_Fee__c ){
                                    BalanceDue = (opp.Net_Balance_Due__c + (product.Enrollment_Fee__c - OriginalProduct.Enrollment_Fee__c)) - creditCardInfo.AmountAlreadyChargedToClient;
                                }else{
                                    BalanceDue = opp.Net_Balance_Due__c - creditCardInfo.AmountAlreadyChargedToClient;
                                }
                                system.debug('BalanceDue == '+BalanceDue);
                            }else{
                                BalanceDue = product.Initial_Fee__c;
                            }
                        }
                        creditCardInfo.ChargeAmount = BalanceDue;
                        if(String.isBlank(opp.Charge_Date__c)){
                            opp.Charge_Date__c = string.valueOf(system.today().day());
                            if(opp.Charge_Date__c=='31'){
                                opp.Charge_Date__c='Last Day';
                            }
                        }
                    }else{
                        if(opp.stageName__c != 'working' && opp.stageName__c != 'Dead'){
                            BalanceDue = opp.Net_Balance_Due__c - creditCardInfo.AmountAlreadyChargedToClient;
                        }else{
                            BalanceDue = 0;
                        }
                        creditCardInfo.ChargeAmount = BalanceDue;
                        opp.Charge_Date__c = null;
                    }
                    
                    selectedPackage.InitialFee = product.Initial_Fee__c;
                    selectedPackage.ProductId = product.id;
                    selectedPackage.ProductType = product.ProductType__c;
                    selectedPackage.IndividualOrCouple = product.IndividualOrCouple__c;
                    selectedPackage.PackageType = product.Package_Type__c;
                    selectedPackage.secondSetupAmount = product.X2nd_Setup_Fee_Amount__c;
                }
            }else{
                for(Product__c product : [select id,Package_Type__c,ProductType__c,X2nd_Setup_Fee_Amount__c,IndividualOrCouple__c,Initial_Fee__c,Enrollment_Fee__c from Product__c where id =: selectedPackage.ProductId]){
                    
                    SelectedPackage.InitialFee = product.Initial_Fee__c;
                    SelectedPackage.ProductId = product.id;
                    SelectedPackage.ProductType = product.ProductType__c;
                    SelectedPackage.IndividualOrCouple = product.IndividualOrCouple__c;
                    SelectedPackage.PackageType = product.Package_Type__c;
                    SelectedPackage.secondSetupAmount = product.X2nd_Setup_Fee_Amount__c;
                    
                    if(product.Package_Type__c != 'PFR'){
                        if(opp.stageName__c != 'working' && opp.stageName__c != 'Dead'){
                            BalanceDue = (opp.Net_Balance_Due__c + product.Initial_Fee__c) - creditCardInfo.AmountAlreadyChargedToClient;
                        }else{
                            BalanceDue =product.Initial_Fee__c;
                        }
                        creditCardInfo.ChargeAmount = BalanceDue;
                        if(String.isBlank(opp.Charge_Date__c)){
                            opp.Charge_Date__c = string.valueOf(system.today().day());
                            if(opp.Charge_Date__c=='31'){
                                opp.Charge_Date__c='Last Day';
                            }
                        }
                    }else{
                        // if the selected product is PFR, we dont charge anything to the customer.
                        if(opp.stageName__c != 'working' && opp.stageName__c != 'Dead'){
                            BalanceDue = opp.Net_Balance_Due__c - creditCardInfo.AmountAlreadyChargedToClient;
                        }else{
                            BalanceDue =0;
                        }
                        creditCardInfo.ChargeAmount = BalanceDue;
                        opp.Charge_Date__c = null;
                    }
                }
            }
        }else{
            creditCardInfo.ChargeAmount = 0;
        }
        
        FormUtils.FormData data = new FormUtils.FormData();
        data.opp = opp;
        data.selectedPackage = selectedPackage;
        data.creditCardInfo = creditCardInfo;
        return data;
    }
    
    
    /**************************************************************************************
* @Description  This method will add the spouse record in context as we doing an addon to an individual record
* @Param        selectedPackage: Current package of the opportunity.
originalPackage: original Package of the opportunity.
primaryContact: Primary COntact record.
* @Return       FormUtils.FormData: final wrapper list of data will all relevant objects.
* @Example      IntakeLwcController.confirmFamilyAddOn()
**************************************************************************************/ 
    @AuraEnabled
    Public Static FormUtils.FormData confirmFamilyAddOn(FormUtils.PackageDetail selectedPackage, Contact primaryContact){
        FormUtils.FormData data = new FormUtils.FormData();
        
        // if this method is called that means the record was originally an individual record and now we will be adding a spouse to it.
        // To do this we use the SelectedPackage variable which we will reset and allow it to accept anything we want.
        if(String.isNotBlank(PrimaryContact.Spouse__c)){
            for(contact con : [select id,RecordTypeId,Birthdate,Owner.Name,Portal_Access__c,Client_ID__c,Transunion_Authentication__c,lead_status__c,SMS_Opt_Out__c,Email_Opt_Out__c,Joint_Customer__c,Security_Word__c,Affiliate_ID__c,Income__c,Post_Date__c,Cancel_Date__c,Hutton_Chase_Enrolled__c,Occupation__c,Website__c,HomePhone,MailingStateCode,MailingCountryCode,FirstName, LastName,TransUnionAuth_Link__c, MiddleName,Credit_Summary_Requested__c , Suffix, Contact_Type__c, Status__c,Referred_by_Client__c, Email, MobilePhone, Phone, MailingStreet, MailingCity, MailingState, MailingPostalCode, MailingCountry, opportunity_id__c, Salutation, D_O_B__c,Billing_Status_Code_Hidden__c,spouse__c, accountid,Social_Security_Number__c,SSN_hidden_field__c, OwnerId,Secondary_Phone__c from Contact where Id =: PrimaryContact.Spouse__c]){
                data.SpouseContact = con;
            }
        }else{
            data.SpouseContact = new Contact();
            data.SpouseContact.Contact_Type__c = 'Warm Lead';
            data.SpouseContact.MailingCountry ='United States';
            data.SpouseContact.Spouse__c = primaryContact.Id;
            data.SpouseContact.MailingStreet = PrimaryContact.MailingStreet;
            data.SpouseContact.MailingCity = PrimaryContact.MailingCity;
            data.SpouseContact.MailingState = PrimaryContact.MailingState;
            data.SpouseContact.MailingPostalCode = PrimaryContact.MailingPostalCode;
        }
        
        return data;
    }
    
    
    
    /**************************************************************************************
* @Description  This method will insert contact, spouse contact and opportunity according to the need as we are going to save the lead as warm lead
and right now no contact or opportunity exists.
* @Param        leadId: id of lead for which its working right now.
data : An instance of the wrapper class with all the relevant data.
* @Return       FormUtils.FormData: return the inserted and updated form back to the component so its aware of context.
* @Example      IntakeLwcController.insertRequiredInfoForChargeOrUpdate()
**************************************************************************************/ 
    @AuraEnabled
    Public Static FormUtils.FormData insertRequiredInfoForChargeOrUpdate(String leadId, FormUtils.FormData data){
        Savepoint sp = Database.setSavepoint();
        
        try{
            if(String.isNotBlank(data.primaryContact.Id)){
                //This could also be one of the rare cases where a lead is already connected to a contact, so we need to make sure there is not an opportunity connected as well.
                for(Contact con : [select id, Opportunity__c from Contact where Id =: data.primaryContact.Id]){
                    if(String.isNotBlank(con.Opportunity__c)){
                        data.opp.id = con.Opportunity__c;
                    }
                }
            }
            
            
            if(String.isNotBlank(data.primaryContact.LastName)){   
                data.primaryContact.otherCountry='United States';
                data.primaryContact.ownerId = UserInfo.getUserId();
                data.primaryContact.Active__c = true;
                upsert data.PrimaryContact;
            }
            
            if(data.spouseContact != null && String.isNotBlank(data.spouseContact.LastName)){   
                data.spouseContact.otherCountry='United States';
                data.spouseContact.ownerId = UserInfo.getUserId();
                data.spouseContact.Active__c = true;
                upsert data.spouseContact;
            }
            
            if(String.isNotBlank(data.primaryContact.Id)){
                
                //There might be  case where an opportunity could already exist on the contact
                
                if(string.isnotBlank(data.primaryContact.FirstName)){
                    data.opp.name = data.primaryContact.FirstName.substring(0,1)+' ';
                }
                
                if(string.isnotBlank(data.primaryContact.middleName)){
                    data.opp.name += data.primaryContact.middleName.substring(0,1)+' ';
                }
                
                if(string.isnotBlank(data.primaryContact.lastName)){
                    data.opp.name += data.primaryContact.lastName+'-1-';
                }
                
                data.opp.name += system.now().month()+''+system.now().day()+''+system.now().year(); 
                data.opp.Contact__c = data.primaryContact.Id;
                data.opp.StageName__c = 'Working';
                
                //Insert the opportunity with the contact.
                upsert data.opp;
                
                Lead__c lead = new Lead__c(id = leadId);
                lead.contact__c = data.primaryContact.Id;
                lead.FirstName__c = data.primaryContact.FirstName;
                lead.MiddleName__c = data.primaryContact.MiddleName;
                lead.LastName__c = data.primaryContact.LastName;
                lead.Suffix__c = data.primaryContact.Suffix;
                lead.Referred_By__c = data.primaryContact.Referred_by_Client__c ;
                lead.Street__c = data.primaryContact.MailingStreet;
                lead.City__c = data.primaryContact.MailingCity;
                lead.State__c =  data.primaryContact.MailingState;                
                lead.PostalCode__c = data.primaryContact.MailingPostalCode;
                lead.MobilePhone__c = data.primaryContact.MobilePhone;
                lead.PhoneExternalOther__c= data.primaryContact.Secondary_Phone__c;
                lead.Secondary_Phone__c= data.primaryContact.Secondary_Phone__c;
                lead.SSN_Not_Encrypted__c= data.primaryContact.SSN_hidden_field__c;
                lead.PhoneExternal__c = data.primaryContact.MobilePhone;
                lead.Email__c = data.primaryContact.Email;
                lead.D_O_B__c = data.primaryContact.D_O_B__c;   
                lead.Country__c='United States';
                
                //All the information that was entered on the form, foes back to the lead as well.
                update lead;
            }
        }Catch(exception e){
            Database.rollback(sp) ;          
            throw new AuraException(e.getMessage());
        }  
        return data; 
    }
    
    
    /**************************************************************************************
* @Description  This method will be called when someone clicks on charge and update button to make sure any authorized transactions are charged before we attempt a charge.
* @Param        data: FormUtils.FormData will have all the data in the context that we would need, ever.
* @Return       void: No return type.
* @Example      IntakeLwcController.captureExistingAuthorizations()
**************************************************************************************/ 
    @AuraEnabled
    Public Static void captureExistingAuthorizations(FormUtils.FormData data){
        // we are checking for any authorised transactions in the opportunity, if they exists we charge them first and then update the new amount on chargent order....
        list<String> responseStatusSuccessList = Label.TransactionStatusLabel.split(',');
        Transaction__c transact;
        for(Transaction__c authTransaction : [select id,Order_Id__c from Transaction__c where Opportunity__c =: data.opp.ID AND Type__c = 'Authorization' AND Response_Status__c ='Approved']){
            transact =  authTransaction;
        }
        
        if(transact != null){
            try{
                Map<String, String> response = GatewayUtils.captureTransaction(transact.Order_Id__c);
                
                transact.Type__c='Charge';
                //transact.Source__c = 'ServiceForm';
                
                if(response != null){
                    if(response.containsKey('responsetext') && String.isNotBlank(response.get('responsetext')) && responseStatusSuccessList.contains(response.get('responsetext')) ){
                        transact.Response_Status__c='Approved';
                        transact.Response_Message__c = 'Transaction Approved';
                        transact.Order_Id__c = response.get('transactionid');
                    }else if(response.containsKey('responsetext')  && String.isNotBlank(response.get('responsetext'))){
                        transact.Response_Status__c='Declined';
                        transact.Response_Message__c = response.get('responsetext');
                    }
                    else{
                        transact.Response_Status__c='Declined';
                        transact.Response_Message__c = 'Transaction Declined';
                    }
                    transact.Gateway_Response__c=JSON.serialize(response);
                    SYstem.debug('===SERIALISE=='+JSON.serialize(response));
                    transact.AVS_Response_Code__c=String.isNotBlank(response.get('avsresponse')) ? response.get('avsresponse') : '';
                    transact.Response_Code__c=String.isNotBlank(response.get('response_code')) ? response.get('response_code') : '';
                    transact.Response__c=String.isNotBlank(response.get('response')) ? response.get('response') : ''; 
                    transact.Authorization__c=String.isNotBlank(response.get('authcode')) ? response.get('authcode') : '';
                    transact.Order_Id__c=String.isNotBlank(response.get('transactionid')) ? response.get('transactionid') : ''; 
                }else{
                    transact.Response_Status__c='Declined';
                    transact.Response_Message__c = 'Transaction Declined';
                }
                
                update transact;
            }catch(exception e){
                throw new AuraException(e.getMessage());
            }
        }
    }
    
    
    /**************************************************************************************
* @Description  This method will create an authorized transaction before submitting the sale.
* @Param        data: FormUtils.FormData will have all the data in the context that we would need, ever.
* @Return       FormUtils.FormData: the instnace for the data is retured back.
* @Example      IntakeLwcController.authorizeBeforeSubmittingAsSale()
**************************************************************************************/ 
    @AuraEnabled
    Public Static FormUtils.FormData authorizeBeforeSubmittingAsSale(FormUtils.FormData data){
        //By this time, we have already captured eny existing authorised transactions and we can go ahead.
        if(data.Opp.Charge_Amount__c > 0){
            list<String> BlockedBinNumbers = Label.BlockedBinNumbers.split(',');
            String CardBinNumber ='';
            Credit_Card__c cc = new Credit_Card__c();
            
            if(String.isNotBlank(data.creditCardInfo.CardNumber)){
                CardBinNumber = data.creditCardInfo.CardNumber.substring(0, 6);
            }
            
            
            for(Credit_Card__c cardInfo : [select id from Credit_Card__c where card_number_hidden__c =: data.creditCardInfo.CardNumber AND Opportunity_New__c =: data.opp.Id]){
                cc = cardInfo;
            }
            
            if(String.isNotBlank(CardBinNumber) && BlockedBinNumbers.contains(CardBinNumber) && String.isBlank(cc.id)){
                Transaction__c transact = GeneralUtils.createTransactionInstance(data.opp);
                transact.Order_Id__c = data.primaryContact.id +'- BIN Blocked ' + String.valueOf(data.opp.Count_Blocked_Transaction__c);
                transact.Gateway_Date__c=Datetime.now();
                transact.Credit_Card_Number__c=data.creditCardInfo.CardNumber;
                transact.Card_Expiration_Month__c = data.creditCardInfo.CardExpMonth;
                transact.Card_Expiration_Month_Indicator__c = data.creditCardInfo.CardExpMonth;
                transact.Card_Expiration_Year__c = data.creditCardInfo.CardExpYear;
                transact.Card_Expiration_Year_Indicator__c = data.creditCardInfo.CardExpYear;
                transact.Response_Status__c='BlockedBin';
                transact.Response_Message__c ='DECLINE';
                transact.Amount__c = data.creditCardInfo.ChargeAmount;
                transact.Reason_Text__c='This transaction has been declined.';
                
                try{
                    insert transact;
                    data.creditCardInfo.isBlockedBinNumber = true;
                    
                    //Because it was blocked by bin, we will just throw an error from here itrself and go back to the component.
                    // in the component will will check if isBlockedBinNumber is true we display the needed ppup.
                    return data;
                }catch(exception e){
                    throw new AuraException(e.getMessage());
                }
            }else{
                data.creditCardInfo.isBlockedBinNumber = false;
                data.opp.Card_Month__c = data.creditCardInfo.CardExpMonth;
                data.opp.Card_Year__c = data.creditCardInfo.CardExpYear;
                data.opp.Card_Number__c = data.creditCardInfo.CardNumber;
                data.opp.Billing_First__c = data.PrimaryContact.FirstName;
                data.opp.Billing_Last__c = data.PrimaryContact.LastName;
                data.opp.Billing_Address__c = data.PrimaryContact.MailingStreet;
                data.opp.Billing_State__c = data.PrimaryContact.MailingState;
                data.opp.Billing_City__c = data.PrimaryContact.MailingCity;
                data.opp.Billing_Zip__c = data.PrimaryContact.MailingPostalCode;
                data.opp.Billing_Phone__c = data.PrimaryContact.MobilePhone;
                data.opp.Billing_Email__c = data.PrimaryContact.Email;
                system.debug('data.opp.Billing_First__c'+data.opp.Billing_First__c);
                system.debug('data.opp.Billing_Last__c'+data.opp.Billing_Last__c);
                
                
                // Here the real chrage part of the process starts, from here we make the actual charge on the opportunity needed.
                if(data.finalActionType == 'CHARGE_2NDSETUP_FEE' || ( data.finalActionType != 'CHARGE_2NDSETUP_FEE' && data.creditCardInfo.ChargeAmount > data.creditCardInfo.AmountAlreadyChargedToClient)){
                    // calling NMI charge method and getting response 
                    Map<String, String> response = data.finalActionType == 'CHARGE_2NDSETUP_FEE' ? GatewayUtils.chargeTransaction(data.opp) : GatewayUtils.authorizeTransaction(data.opp);
                    
                    // creating a charge transaction 
                    Transaction__c transToBeInserted = GeneralUtils.createTransactionInstance(data.Opp);
                    transToBeInserted.Type__c= data.finalActionType == 'CHARGE_2NDSETUP_FEE' ? 'Charge' : 'Authorization';
                    transToBeInserted.Source__c = 'IntakeLead';
                    transToBeInserted.CST_Owner__c = data.opp.Last_CST_Updated_by__c;
                    transToBeInserted.X2nd_Fee_Transaction__c = data.finalActionType == 'CHARGE_2NDSETUP_FEE' ? true : false; 
                    list<String> responseStatusSuccessList = Label.TransactionStatusLabel.split(',');
                    data.creditCardInfo.declineErrorMessage = null;
                    if(response != null ){
                        if(response.containsKey('responsetext') && String.isNotBlank(response.get('responsetext')) && responseStatusSuccessList.contains(response.get('responsetext')) ){
                            transToBeInserted.Response_Status__c='Approved';
                            transToBeInserted.Response_Message__c = 'SUCCESS';
                            if(data.opp.stagename__C =='working'){
                                 data.opp.Sales_Executive__c =data.opp.Last_CST_Updated_by__c;
                            }
                            if(data.finalActionType == 'CHARGE_2NDSETUP_FEE'){
                                Monthly_Balance_Due__c MBD = new Monthly_Balance_Due__c();
                                MBD.Amount__c = data.opp.SetupFee2_Amount__c; 
                                MBD.Opportunity_New__c= data.opp.id;
                                MBD.Subscription_Date__c = System.today();
                                insert MBD;
                                data.opp.Charge_2nd_Setup_Fee__c=True;
                                data.opp.SetupFee2_Date__c = system.today();
                            }else{
                                Monthly_Balance_Due__c MBD = new Monthly_Balance_Due__c();
                                MBD.Amount__c = data.creditCardInfo.ChargeAmount; 
                                MBD.Opportunity_New__c= data.opp.id;
                                MBD.Subscription_Date__c = System.today();
                                MBD.Initial_Fee__c = true;
                                insert MBD;
                                
                                
                                data.creditCardInfo.AmountAlreadyChargedToClient = data.creditCardInfo.ChargeAmount; 
                            }
                        }else if(response.containsKey('responsetext') && ('Do Not Honor'.equalsIgnoreCase(response.get('responsetext')))){
                            transToBeInserted.Response_Status__c='Declined';
                            transToBeInserted.Response_Message__c = 'Do Not Honor';
                            data.creditCardInfo.declineErrorMessage ='DoNotHonor';
                        }else if(response.containsKey('responsetext')  && String.isNotBlank(response.get('responsetext'))){
                            transToBeInserted.Response_Status__c='Declined';
                            transToBeInserted.Response_Message__c = response.get('responsetext');
                            data.creditCardInfo.declineErrorMessage =response.get('responsetext');
                        }else{
                            transToBeInserted.Response_Status__c='Declined';
                            transToBeInserted.Response_Message__c = 'Transaction Declined';
                            data.creditCardInfo.declineErrorMessage =String.isNotBlank(response.get('responsetext')) ? response.get('responsetext') : 'ERRROR FROM SERVER';
                        }
                        transToBeInserted.Gateway_Response__c=JSON.serialize(response);
                        transToBeInserted.AVS_Response_Code__c=String.isNotBlank(response.get('avsresponse')) ? response.get('avsresponse') : '';
                        transToBeInserted.Response_Code__c=String.isNotBlank(response.get('response_code')) ? response.get('response_code') : '';
                        transToBeInserted.Response__c=String.isNotBlank(response.get('response')) ? response.get('response') : ''; 
                        transToBeInserted.Authorization__c=String.isNotBlank(response.get('authcode')) ? response.get('authcode') : '';
                        transToBeInserted.Order_Id__c=String.isNotBlank(response.get('transactionid')) ? response.get('transactionid') : ''; 
                    }else{
                        transToBeInserted.Response_Status__c='Declined';
                        transToBeInserted.Response_Message__c = 'Transaction Declined';
                        transToBeInserted.Gateway_Response__c='No Response From server';
                        data.creditCardInfo.declineErrorMessage ='No response from Server !!!!';
                    }
                    
                    
                    if(transToBeInserted!=null){
                        try{
                            insert transToBeInserted;
                            
                        }catch(Exception e){
                            data.creditCardInfo.declineErrorMessage = 'Error at : '+e.getLineNumber()+' Reason : '+e.getMessage();
                        }
                    }
                }
            }
        }
        return data;
    }
    
    
    
    /**************************************************************************************
* @Description  This method will insert contact, spouse contact and opportunity according to the need as we are going to save the lead as warm lead
and right now no contact or opportunity exists.
* @Param        leadId: id of lead for which its working right now.
data : An instance of the wrapper class with all the relevant data.
* @Return       FormUtils.FormData: return the inserted and updated form back to the component so its aware of context.
* @Example      IntakeLwcController.updateOnly()
**************************************************************************************/ 
    @AuraEnabled
    Public Static FormUtils.FormData updateOnly(String leadId, FormUtils.FormData data){
        Savepoint sp = Database.setSavepoint();
        pricebookentry__c priceBookEntry; // initilising here, might be used or might not be used, but its important it stays here.
        
        //If the package selected is apouse, we need to first insert the spouse or update if already inserted.
        if(data.selectedPackage.IndividualOrCouple == 'Couple' && String.isNotBlank(data.opp.id) && String.isNotBlank(data.primaryContact.id)){
            if(Test.isRunningTest()) {
                data.spouseContact.LastName='test';
            }    
            data.spouseContact.Opportunity__c = data.opp.id;
            data.spouseContact.opportunity_id__c = data.opp.id;
            data.spouseContact.MailingCountry='United States';
            data.spouseContact.otherCountry='United States';
            data.spouseContact.ownerId = UserInfo.getUserId();
            data.spouseContact.Active__c = true;
            data.spouseContact.Status__c = 'Active';
            data.spouseContact.Original_Lead_ID__c = data.primaryContact.Original_Lead_ID__c;
            data.spouseContact.Agent_ID__c = data.primaryContact.Agent_ID__c;
            data.spouseContact.User_Rating__c = data.primaryContact.User_Rating__c;
            data.spouseContact.Spouse__c = data.primaryContact.id;
            data.spouseContact.Profile_visibility_to_RateContact__c = data.primaryContact.Profile_visibility_to_RateContact__c; 
            try{                
                upsert data.spouseContact;
                data.primaryContact.Spouse__c = data.spouseContact.Id;
            }Catch(exception e){
                Database.rollback(sp);
                throw new AuraException(e.getMessage());
            } 
            
        }
        
        if(String.isNotBlank(leadId)){
            //Whenver the leadId is not blank, we are coming the lead context and we need to update this lead to be converted.
            List<Lead__c>    leadsToBeUpdated = new List<Lead__c>();
            
            Lead__c primaryLead = new Lead__c(id = leadId);
            primaryLead.isConverted__c = true;
            primaryLead.Status__c ='Converted';
            primaryLead.Contact__c = data.primaryContact.id;
            primaryLead.Email__c = data.primaryContact.Email;
            primaryLead.PhoneExternal__c = data.primaryContact.MobilePhone;
            primaryLead.PhoneExternalOther__c= data.primaryContact.Secondary_Phone__c;
            primaryLead.D_O_B__c = data.primaryContact.D_O_B__c;
            primaryLead.SSN_Not_Encrypted__c = data.primaryContact.SSN_hidden_field__c;
            primaryLead.Street__c = data.primaryContact.MailingStreet;
            primaryLead.PostalCode__c = data.primaryContact.MailingPostalCode;
            primaryLead.City__c = data.primaryContact.MailingCity;
            primaryLead.State__c = data.primaryContact.MailingState;                    
            leadsToBeUpdated.add(primaryLead);
            
            //If the spouse was found using search spouse, we need to convert that lead too.
            if(String.isNotBlank(data.leadIdFromSpouseSearch) && leadId != data.leadIdFromSpouseSearch && String.isNotBlank(data.spouseContact.id)){
                Lead__c spouseLead = new Lead__c();
                spouseLead.isConverted__c = true;
                spouseLead.Status__c ='Converted';
                spouseLead.Contact__c = data.spouseContact.id;
                spouseLead.Email__c = data.spouseContact.Email;
                spouseLead.PhoneExternal__c = data.spouseContact.MobilePhone;
                spouseLead.PhoneExternalOther__c= data.spouseContact.Secondary_Phone__c;
                spouseLead.D_O_B__c = data.spouseContact.D_O_B__c;
                spouseLead.SSN_Not_Encrypted__c = data.spouseContact.SSN_hidden_field__c;
                spouseLead.Street__c = data.spouseContact.MailingStreet;
                spouseLead.PostalCode__c = data.spouseContact.MailingPostalCode;
                spouseLead.City__c = data.spouseContact.MailingCity;
                spouseLead.State__c = data.spouseContact.MailingState;                    
                leadsToBeUpdated.add(spouseLead);
            }
            
            if(!leadsToBeUpdated.isEmpty() && !data.creditCardInfo.doNotHonurAlreadyFaced){
                update leadsToBeUpdated;
            }
        }
        
        
        //Manage the product, if in the lead context originalPackage.ProductId would be null and selectedPackage.ProductId would have the new product that needs to be added,
        //If the originalPackage.ProductId is not blank and selectedPackage.ProductId is fifferent then we need to change the existing package.
        if(String.isNotBlank(data.selectedPackage.ProductId)){
            
            
            
            // if the product was changed or there was no product selected before, we needd to add the product.
            if(String.isNotBlank(data.selectedPackage.ProductId)  && (((data.opp.StageName__c == 'Working' || data.opp.StageName__c == 'Dead'))|| (data.selectedPackage.ProductId != data.originalPackage.ProductId))){   
                
                //Delete the existing line Item if there was and productId is now different in selected and original Package.
                if(String.isNotBlank(data.originalPackage.OpportunityLineItemId)){
                    // Now we know that product was definately changed, so we delete the existing opportunity line item on the opportunity and create a new one.
                    Opportunitylineitem__c existingLineItem = new Opportunitylineitem__c(id=data.originalPackage.OpportunityLineItemId);
                    delete existingLineItem;
                }
                
                // we get the pricebook related to the new product selected by using soql query.
                for(pricebookentry__c priceBook : [select id, name,Product1__c, UnitPrice__c,pricebook__c,pricebook__r.name, Product1__r.name,Product1__r.X2nd_Setup_Fee_Amount__c,Product1__r.Contact_Type__c,Product1__r.Package_Type__c,Product1__r.Online_Reference__c,product1__r.productCode__c,Product1__r.Charged_Monthly__c, product1__r.ProductType__c, Product1__r.Initial_Fee__c,product1__r.IndividualOrCouple__c from pricebookentry__c where Product1__r.Id =: data.selectedPackage.ProductId and pricebook__r.name='Standard Price Book' limit 1]){
                    priceBookEntry = priceBook;
                }
                
                if(String.isBlank(priceBookEntry.Id)){
                    Database.rollback(sp);
                    throw new AuraException('Pricebookentry for selected product not found. Please contact your administrator.');
                }
                
                Opportunitylineitem__c newLineItem =new Opportunitylineitem__c();
                newLineItem.Product2Id__c = priceBookEntry.Product1__c;
                newLineItem.PricebookEntryId__c= priceBookEntry.id;
                newLineItem.ProductCode__c = priceBookEntry.product1__r.productCode__c;
                newLineItem.Unitprice__c= priceBookEntry.UnitPrice__c;
                newLineItem.opportunityid__c = data.opp.id;                
                newLineItem.Quantity__c=1;  
                newLineItem.CST_Owner__c = data.opp.Last_CST_Updated_by__c; 
                
                OpportunityLineItemTriggerHandler.isAfterUpdateRecursion = true;
                OpportunityLineItemTriggerHandler.isBeforeUpdateRecursion = true;
                insert newLineItem;
                
                // update the new product's name on opportunity and some general fields on opportunity because the trigger on opportunityLineitem was turned off manually
                data.originalPackage.OpportunityLineItemId=newLineItem.id;
                data.originalPackage.ProductId=priceBookEntry.Product1__c;
                data.opp.ProductName__c = priceBookEntry.Product1__r.name;
                data.opp.Product_Changed__c = system.now();
                data.opp.Old_Product_Changed__c = data.opp.Old_Product_Changed__c == null ? system.now() : data.opp.Old_Product_Changed__c;
                data.opp.pricebook__c = priceBookEntry.pricebook__c;
                
                data.opp.Contact_Type_On_Product__c=priceBookEntry.Product1__r.Contact_Type__c;
                data.opp.Service_Package_Code__c = priceBookEntry.Product1__r.Online_Reference__c;
                data.opp.recurring_monthy_fee__c = priceBookEntry.Product1__r.Charged_Monthly__c;
                data.opp.SetupFee2_Amount__c = priceBookEntry.Product1__r.X2nd_Setup_Fee_Amount__c;
                if(data.opp.StageName__c == 'Working' || data.opp.StageName__c == 'Dead'){
                    data.opp.Amount__c = priceBookEntry.Product1__r.Initial_Fee__c;
                }
                
                if(priceBookEntry.Product1__r.Package_Type__c == 'PFR'){
                    data.opp.Stage_Sub_type__c = 'PFR';
                    data.opp.Payment_End_Date__c = system.today();
                    data.opp.Payment_Status__c= 'Complete';
                    data.opp.Next_Transaction_Date__c = null;
                }else{
                    data.opp.Stage_Sub_type__c = null;
                    data.opp.Payment_End_Date__c = null;
                    data.opp.Payment_Status__c= 'Recurring';
                }
                
                
                // Contact field supposed to be updated from opportunity line item trigger....
                data.primaryContact.Product_Name__c = priceBookEntry.Product1__r.name;
                data.primaryContact.Billing_Status_Code_Hidden__c=priceBookEntry.Product1__r.ProductCode__c;
                if(data.finalActionType == 'SUBMIT_AS_SALE' && String.isBlank(data.creditCardInfo.declineErrorMessage)){
                    data.opp.Contact_Type_On_Product__c = priceBookEntry.Product1__r.Contact_Type__c;
                    data.primaryContact.Contact_Type__c = priceBookEntry.Product1__r.Contact_Type__c;
                }
                
                date nextMonthDate = null;
                if(data.opp.SetupFee2_Date__c != null && (priceBookEntry.product1__r.ProductType__c == 'Post-Date' || priceBookEntry.product1__r.ProductType__c == 'Partial')){
                    data.opp.SetupFee2_Amount__c = priceBookEntry.Product1__r.X2nd_Setup_Fee_Amount__c;
                    nextMonthDate = data.opp.SetupFee2_Date__c.addMonths(1);
                }else{
                    nextMonthDate = system.today().addMonths(1);
                }
                
                if(data.opp.Charge_Date__c == 'Last Day'){
                    Integer numberOfDays = Date.daysInMonth(nextMonthDate.year(), nextMonthDate.month());
                    data.opp.Payment_Start_Date__c = Date.newInstance(nextMonthDate.year(), nextMonthDate.month(), numberOfDays);
                    date nextMonthDateForNextSubscription = data.opp.Payment_Start_Date__c.addMonths(1);
                    Integer numberOfDaysNextMonth = Date.daysInMonth(nextMonthDateForNextSubscription.year(), nextMonthDateForNextSubscription.month());
                    data.opp.Next_Transaction_Date__c = Date.newInstance(nextMonthDateForNextSubscription.year(), nextMonthDateForNextSubscription.month(), numberOfDaysNextMonth);
                }else if(data.opp.Charge_Date__c != null){
                    Integer numberOfDaysForCharge = Integer.valueOf(data.opp.Charge_Date__c);
                    data.opp.Payment_Start_Date__c = Date.newInstance(nextMonthDate.year(), nextMonthDate.month(), numberOfDaysForCharge); 
                    data.opp.Next_Transaction_Date__c = data.opp.Payment_Start_Date__c.addMonths(1);
                }
            }
        }
        
        Map<String,Credit_Card__c> existingCards = new Map<String,Credit_Card__c>();
        for(Credit_Card__c cardInfo : [select id,Card_number__c from Credit_Card__c where Opportunity_New__c =: data.opp.Id]){
            existingCards.put(cardInfo.Card_number__c,cardInfo);
        }
        List<Credit_Card__c> newCreditCards = new List<Credit_Card__c>();
        list<String> BlockedBinNumbers = Label.BlockedBinNumbers.split(',');
        
        if(String.isNotBlank(data.creditCardInfo.CardNumber) && String.isNotBlank(data.creditCardInfo.CardExpMonth) && String.isNotBlank(data.creditCardInfo.CardExpYear)){
            String CardBinNumber = data.creditCardInfo.CardNumber.substring(0, 6);
            if(!BlockedBinNumbers.contains(CardBinNumber)){
                Credit_Card__c cc = IntakeLwcController.getCreditCardInstance(existingCards, data.creditCardInfo);
                
                if(existingCards.containsKey(data.creditCardInfo.CardNumber)){
                    cc = existingCards.get(data.creditCardInfo.CardNumber);
                }else{
                    cc.Creation_Source__c = 'FinalSaveFirstCard-IntakeForm';
                    cc.Opportunity_New__c = data.opp.id;
                }
                
                // update the opportunity back with the updated credit card....
                if(data.creditCardInfo.isCardSelectedAsRecurring){
                    data.opp.Card_Number__c = data.creditCardInfo.CardNumber ;
                    data.opp.Card_Month__c = data.creditCardInfo.CardExpMonth;
                    data.opp.Card_Year__c = data.creditCardInfo.CardExpYear;
                }
                cc.Contact_Owner__c = data.opp.Contact__c;
                newCreditCards.add(cc);
            }else{
                data.creditCardInfo.isBlockedBinNumber = true;
            }
        }
        
        
        if(String.isNotBlank(data.secondCreditCardInfo.CardNumber) && String.isNotBlank(data.secondCreditCardInfo.CardExpMonth) && String.isNotBlank(data.secondCreditCardInfo.CardExpYear)){
            String CardBinNumber = data.secondCreditCardInfo.CardNumber.substring(0, 6);
            if(!BlockedBinNumbers.contains(CardBinNumber)){
                Credit_Card__c cc = IntakeLwcController.getCreditCardInstance(existingCards, data.secondCreditCardInfo);
                
                if(existingCards.containsKey(data.secondCreditCardInfo.CardNumber)){
                    cc = existingCards.get(data.secondCreditCardInfo.CardNumber);
                }else{
                    cc.Creation_Source__c = 'FinalSaveSecondCard-IntakeForm';
                    cc.Opportunity_New__c = data.opp.id;
                }
                
                // update the opportunity back with the updated credit card....
                if(data.secondCreditCardInfo.isCardSelectedAsRecurring){
                    data.opp.Card_Number__c = data.secondCreditCardInfo.CardNumber ;
                    data.opp.Card_Month__c = data.secondCreditCardInfo.CardExpMonth;
                    data.opp.Card_Year__c = data.secondCreditCardInfo.CardExpYear;
                }
                cc.Contact_Owner__c = data.opp.Contact__c;
                newCreditCards.add(cc);
            }else{
                data.secondCreditCardInfo.isBlockedBinNumber = true;
            }
        }
        
        
        if(newCreditCards.size() > 0){
            try{
                system.debug('no of cards--'+newCreditCards.size());
                upsert newCreditCards;
            }catch(exception e){
                Database.rollback(sp);
                throw new AuraException(e.getMessage());
            }
        }
        
        
        // query both the contact roles or any existing contact roles for the opportunity. If there is contact role for primary contact, we need to create that too just in case.
        Map<String,OpportunityContactRole__c> contactRolesMap = new Map<String,OpportunityContactRole__c>();
        for(OpportunityContactRole__c role : [select id,ContactId__c,IsPrimary__c from OpportunityContactRole__c where OpportunityId__c =: data.opp.Id]){
            contactRolesMap.put(role.ContactId__c,role);
        }
        
        List<OpportunityContactRole__c> contactRoles = new List<OpportunityContactRole__c>();
        // Contact role map should also contain the primary contact role. if not then we create one for it...
        if(!contactRolesMap.containsKey(data.primaryContact.id)){
            // Primary role for opportunity...
            OpportunityContactRole__c primaryRole = new OpportunityContactRole__c();
            primaryRole.Role__c = 'Decision Maker';
            primaryRole.IsPrimary__c = true;
            primaryRole.ContactID__c = data.PrimaryContact.id;
            primaryRole.OpportunityId__c = data.opp.id;
            contactRoles.add(primaryRole);
        }
        
        
        OpportunityContactRole__c spouseRole;
        for(OpportunityContactRole__c role : contactRolesMap.values()){
            if(!role.IsPrimary__c){
                spouseRole = role;
            }
        }
        
        if(spouseRole != null){
            Delete spouseRole;
        }
        
        if(data.selectedPackage.IndividualOrCouple == 'Couple'){
            // Spouse was added, create a new opportunity role for spouse...
            spouseRole = new OpportunityContactRole__c();
            SpouseRole.Role__c = 'Other';
            SpouseRole.IsPrimary__c = false;
            SpouseRole.ContactID__c = data.spouseContact.id;
            SpouseRole.OpportunityId__c = data.opp.id;
            contactRoles.add(SpouseRole);
            
            data.spouseContact.Enroll_Date__c = data.finalActionType == 'SUBMIT_AS_SALE' && String.isBlank(data.creditCardInfo.declineErrorMessage) ?  System.today() : data.spouseContact.Enroll_Date__c;
        }
        
        
        if(contactRoles.size() > 0){
            upsert contactRoles;
        }
        
        // Finally once everything is done, we just update the primary, spouse and opportunity records....
        List<Contact> contacts = new List<Contact>();
        if(data.selectedPackage.IndividualOrCouple == 'Couple' && data.spouseContact != null && String.isNotBlank(data.spouseContact.id) ){
            data.spouseContact.Spouse__c = data.primaryContact.id;
            data.primaryContact.Spouse__c = data.spouseContact.id;
            data.spouseContact.Contact_Type__c = data.primaryContact.Contact_Type__c;
            data.spouseContact.Product_Name__c = data.primaryContact.Product_Name__c;
            data.spouseContact.Billing_Status_Code_Hidden__c = data.primaryContact.Billing_Status_Code_Hidden__c;
            data.spouseContact.opportunity_id__c = data.opp.id;                                    
            data.spouseContact.Active__c = true;
            
            contacts.add(data.primaryContact);
            contacts.add(data.spouseContact);
        }else if(data.selectedPackage.IndividualOrCouple == 'Individual'){
            contacts.add(data.primaryContact);
            
            if(data.spouseContact != null && String.isNotBlank(data.spouseContact.id)){
                data.spouseContact.Status__c = 'Cancelled';
                contacts.add(data.spouseContact);
            }
        }
        
        
        try{
            
            if(contacts.size() > 0){
                update contacts;
            }
            
           
            
            if(data.finalActionType == 'SUBMIT_AS_SALE' && String.isBlank(data.creditCardInfo.declineErrorMessage)){
                data.opp.StageName__c = 'Active';
                data.opp.Active__c = true;
                
            }
            
            if(data.finalActionType == 'SAVE_AS_LEAD' && data.opp.StageName__c == 'Working'){
                data.opp.Sales_Executive__c =data.opp.Last_CST_Updated_by__c;
                
            }
            data.opp.Billing_First__c = data.PrimaryContact.FirstName;
            data.opp.Billing_Last__c = data.PrimaryContact.LastName;
            data.opp.Billing_Address__c = data.PrimaryContact.MailingStreet;
            data.opp.Billing_State__c = data.PrimaryContact.MailingState;
            data.opp.Billing_City__c = data.PrimaryContact.MailingCity;
            data.opp.Billing_Zip__c = data.PrimaryContact.MailingPostalCode;
            data.opp.Billing_Phone__c = data.PrimaryContact.MobilePhone;
            data.opp.Billing_Email__c = data.PrimaryContact.Email;
            
            OpportunityTriggerHandler.DonotchargesecondsetupFee =true;
            upsert data.opp;
            OpportunityTriggerHandler.DonotchargesecondsetupFee =false;
        }catch(exception e){
            Database.rollback(sp);
            throw new AuraException(e.getMessage());
        }
        
        return data;
    }
    
    
    /**************************************************************************************
* @Description  Just a helper method which create a new instance of credit card based on the information passed from teh form.
* @Param        existingCards: A map of existing credit card that already exists for this opportunity.
creditCardInfo: Credit card info instance with data from the component.
* @Return       Credit_Card__c: an instance of the credit card object.
* @Example      IntakeLwcController.getCreditCardInstance()
**************************************************************************************/ 
    Public Static Credit_Card__c getCreditCardInstance(Map<String,Credit_Card__c> existingCards, FormUtils.CreditCardWrap creditCardInfo){
        Credit_Card__c cc = new Credit_Card__c();
        cc.Card_number__c = creditCardInfo.CardNumber;
        cc.card_number_hidden__c = creditCardInfo.CardNumber;
        cc.expiration_month__c = creditCardInfo.CardExpMonth;
        cc.expiration_month_hidden__c = creditCardInfo.CardExpMonth;
        cc.expiration_year__c = creditCardInfo.CardExpYear ;
        cc.expiration_year_hidden__c = creditCardInfo.CardExpYear ;
        
        if(creditCardInfo.isCardSelectedAsRecurring){
            cc.Active__c = true;
        }
        return cc;
    }
    
    
    /**************************************************************************************
* @Description  this method get information about the package that is selected on the component.
* @Param        leadId: Id of the lead that needs to be marked as dead. If null that would mean, the component was open in opportunityContext.
opp: opportunity that needs to be marked as dead, if null that would mean we are in lead context. One of them would be null.
spouseContactId: just in case there is a spouse record as well in context.
* @Return       FormUtils.FormData: an instance of form with just upgradedPackages and select package.
* @Example      IntakeLwcController.markRecordDead()
**************************************************************************************/ 
    @AuraEnabled
    public Static void markRecordDead(String leadId, Opportunity__c opp, String spouseContactId){
        Savepoint sp = Database.setSavepoint();
        try{
            if(String.isNotBlank(leadId)){
                Lead__c lead = new Lead__c(id = leadId, status__c = 'Dead');
                update lead;
            }else if(opp != null){
                Map<String,Contact> contacts = new Map<String,Contact>();
                if(String.isNotBlank(opp.Contact__c)){
                    contact con = new contact(Id = opp.contact__c);
                    con.Status__c = 'Cancelled';
                    con.Active__c= false;
                    con.Contact_type__c = 'Warm Lead';
                    contacts.put(con.id,con);
                }   
                
                if(String.isNotBlank(spouseContactId)){
                    contact con = new contact(Id = spouseContactId);
                    con.Status__c = 'Cancelled';
                    con.Active__c= false;
                    contacts.put(con.id,con);
                }
                
                if(contacts.size() > 0){
                    update contacts.values();
                }
                
                update opp;
            }
        }catch(exception e){
            Database.rollback(sp);
            throw new AuraException(e.getMessage());
        }
    }
}