public with sharing class OppRecordType {
    @AuraEnabled(Cacheable=true)
    public static RecordType[] oppRec(){
        return [select Id, Name from RecordType where SobjectType='Opportunity' and Isactive=true];
    }
    @AuraEnabled(Cacheable=true)
    public static RecordType[] accRec(){
        return [select Id, Name, DeveloperName from RecordType where SobjectType='Account' and Isactive=true];
    }
}