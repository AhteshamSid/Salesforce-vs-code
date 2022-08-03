public with sharing class multiContactSelect {

    @AuraEnabled(Cacheable = true)
    public Static Contact[] multiOption(Id oId) {
        Id aId = [Select AccountId from opportunity where Id=:oId][0].AccountId;
        Contact[] cL = [SELECT Id, LastName, FirstName FROM Contact where AccountId=:aId];
        if(cL.size()<0)
            cL = NULL;
        return cL;
    }
}