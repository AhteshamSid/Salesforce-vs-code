public with sharing class FileUploaderClass {

    
    @AuraEnabled(Cacheable = true)
    public Static ContentVersion[] getAllfile(Id recordId){
        List<ContentDocumentLink> cdls = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId =:recordId];
        Set<Id> documentIds = new Set<Id>();
        for (ContentDocumentLink cdl : cdls) {
            documentIds.add(cdl.ContentDocumentId);
        }
        return [SELECT Id, Title, ContentSize, FileExtension, CreatedDate, ContentDocumentId from ContentVersion where ContentDocumentId in:documentIds];
    }

    @AuraEnabled(Cacheable = true)
    public Static ContentVersion[] uploadFile(string val, Id recordId) {
        val = val.trim();
        if (val== '' || val=='All') {
            return getAllfile(recordId);
        }
        val = '%' + val + '%';
        List<ContentDocumentLink> cdls = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId =:recordId];
        Set<Id> documentIds = new Set<Id>();
        for (ContentDocumentLink cdl : cdls) {
            documentIds.add(cdl.ContentDocumentId);
        }
        return [SELECT Id, Title, ContentSize, FileExtension, CreatedDate, ContentDocumentId from ContentVersion where tt_fileupload__c like :val and ContentDocumentId in:documentIds];
    }
}
