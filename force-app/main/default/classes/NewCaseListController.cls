public class NewCaseListController {
    public Case[] getNewCases(){
        return [Select Id, CaseNumber from Case Where Status='New'];
    }
}