public with sharing class activityHandler {

    @AuraEnabled(Cacheable=true)
    public static Task[] activityTask(Id aId) {
        return [SELECT Id, AccountId, What.Name, Description, Subject, Status FROM Task WHERE AccountId=: aId];
    }


    @AuraEnabled(Cacheable=true)
    public static Event[] activityEvent(Id aId) {
        return [SELECT Id, AccountId, What.Name, Description, Subject FROM Event WHERE AccountId=: aId];
    }
}