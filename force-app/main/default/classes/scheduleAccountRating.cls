public class scheduleAccountRating implements schedulable{
  
     public void execute(SchedulableContext ctx) {
        List<account> aL = [SELECT Id, Name, Rating FROM account WHERE CreatedDate = TODAY];
         for(account a: aL){
             a.rating = 'Cold';
         }
         update aL;
    }
    
    
}