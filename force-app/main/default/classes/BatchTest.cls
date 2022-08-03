public class BatchTest {
    
    public static id  parentCall(string aid){
        id a = [select Parent.id from Account where id=:aid][0].Parent.id;
        return [select Parent.id from Account where id=:a][0].Parent.id;
    }

}