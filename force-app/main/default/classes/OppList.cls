public with sharing class OppList {
    @AuraEnabled(Cacheable=true)
    public static Opportunity[] oList() {
        return [SELECT Id, Name FROM Opportunity WHERE AccountId!=null LIMIT 3];
    }

    @AuraEnabled(Cacheable=true)
    public static Account[] accountDetails(string oId) {
        Account[] aL = [SELECT Id, Name FROM Account LIMIT 1];
        Opportunity[] opp = [SELECT AccountId FROM Opportunity WHERE Id=:oId and AccountId!=null LIMIT 1];
        if(opp.size()>0){
            string aId = opp[0].AccountId;
            aL = [SELECT Id, Name FROM Account WHERE Id =: aId];
        }

        return aL;
    }
}