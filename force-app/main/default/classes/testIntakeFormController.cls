public with sharing class testIntakeFormController {
    @AuraEnabled(cacheable = true)    
    Public Static FormUtils.FormData initializeIntakeForm(Id recordId){
        FormUtils.FormData data = new FormUtils.FormData();
        
        if(String.isNotBlank(recordId)){
            Schema.SObjectType sObjectType = recordId.getSObjectType();
            String objectType = sObjectType.getDescribe().getName();
            
            if(objectType == 'Lead'){
                Lead lead = [select id, Name, First_Name__c, Last_Name__c from Lead where id=:recordId];
                if(String.isNotBlank(lead.First_Name__c)){
                    data.primaryContact.FirstName = (lead.First_Name__c).toLowerCase().capitalize();
                }

                if(String.isNotBlank(lead.Last_Name__c)){
                    data.primaryContact.LastName = (lead.Last_Name__c).toLowerCase().capitalize();
                }
                
            }
        }else{
            throw new AuraException('No valid object found for the intake form to work.');
        }
        return data;
    }
}