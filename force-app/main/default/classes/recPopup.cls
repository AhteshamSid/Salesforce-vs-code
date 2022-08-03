public class recPopup {
    public recPopup(ApexPages.StandardController acon) { 
    }
    
    Public string recId {get;set;} 
    
    public List<SelectOption> getReco() {
        RecordType[] recList = [select Id, Name, DeveloperName from RecordType where SobjectType='Account' and isActive=true and Id!='0125h000000teSIAAY'];
        
        List<SelectOption> options = new List<SelectOption>();
        for(RecordType rt : recList) {
            options.add(new selectOption(rt.Id, rt.name));
        }
        return options; 
    }
    
    
    public List<SelectOption> getRecoA() {
        RecordType rt = [select Id, Name, DeveloperName from RecordType where Id='0125h000000teSIAAY'][0];
        
        List<SelectOption> options = new List<SelectOption>();
        options.add(new selectOption(rt.Id, rt.name));
        return options; 
    }
    
    //https://creative-impala-uav6h8-dev-ed.lightning.force.com/lightning/o/Opportunity/new?count=2&nooverride=1&useRecordTypeCheck=1&navigationLocation=LIST_VIEW&uid=165891869170537188&backgroundContext=%2Flightning%2Fo%2FOpportunity%2Flist%3FfilterName%3DRecent
    
}