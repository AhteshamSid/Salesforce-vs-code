public class taskOppList {
    public static void oppL(opportunity[] opp){
        list<opportunity> oL = new list<Opportunity>();
        for(opportunity o: opp){
            if(o.StageName == 'Closed Won')
            {
                 oL.add(o.clone());
            }
        }
        if(!oL.isEmpty())
    		insert oL;
    }
}