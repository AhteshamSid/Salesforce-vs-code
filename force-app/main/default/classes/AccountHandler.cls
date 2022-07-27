public with sharing class AccountHandler {
    @AuraEnabled(Cacheable = true)
    public static Account[] AccountList() {
        return [SELECT Id, Name,Rating, Industry FROM Account LIMIT 5];
    }

    @AuraEnabled(Cacheable = true)
    public static Contact[] ContactList(string accId) {
        if (accId==''){
            return [SELECT Id, FirstName, LastName, Email FROM Contact];
        }
        return [SELECT Id, FirstName, LastName, Email, Account.Name FROM Contact where AccountId =: accId];
    }

}
