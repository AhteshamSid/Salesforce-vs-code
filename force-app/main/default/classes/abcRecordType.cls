public with sharing class abcRecordType {
    @AuraEnabled(cacheable=true)
    public static RecordType[] recordTypeClass() {
        UserAppInfo userAppInfo = [SELECT Id, AppDefinitionId FROM UserAppInfo WHERE UserId = :UserInfo.getUserId() LIMIT 1];
        AppDefinition appDefinition = [SELECT DurableId, Label FROM AppDefinition Where DurableId = :userAppInfo.AppDefinitionId LIMIT 1];
        
        if(appDefinition.Label == 'Sales')
            return [select Name, DeveloperName from RecordType where SobjectType='Account' and name in ('A', 'B')];
        else 
            return [select Name, DeveloperName from RecordType where SobjectType='Account' and isActive=true];
        
    }
}