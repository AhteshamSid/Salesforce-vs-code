public with sharing class relatedListLwc {
    @AuraEnabled(cacheable=true)
    public static List<Contact> getContactsRelatedToAccount(String accId) {
        system.debug('accId >> ' + accId);
        return [SELECT Id, FirstName, LastName, Email, Phone from Contact where AccountId = :accId];
    }
}
