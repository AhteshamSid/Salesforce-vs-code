public class squareAPI {
	@AuraEnabled(cacheable =true)
    public static Map<String, Object> retriveSquare(){
        HttpRequest httpRequest = new HttpRequest();
        // https://connect.squareupsandbox.com/oauth2/authorize?client_id={YOUR_APP_ID}&scope=CUSTOMERS_WRITE+CUSTOMERS_READ&session=false&state=82201dd8d83d23cc8a48caf52b
        httpRequest.setEndpoint('https://connect.squareupsandbox.com/oauth2/authorize?client_id=sq0idp-D01aDf1Chx0rOpaEkD7MOw&scope=CUSTOMERS_WRITE+CUSTOMERS_READ&session=false&state=82201dd8d83d23cc8a48caf52b');
        httpRequest.setMethod('GET');

        Map<String, Object> squareJsonData = new Map<String, Object>();
        String strResponse = null;

        try{
            Http http = new Http();
            HttpResponse httpResponse = http.send(httpRequest);
            if(httpResponse.getStatusCode() == 200){
                strResponse = httpResponse.getBody();
                system.debug(strResponse);
            } else {
                throw new CalloutException(httpResponse.getBody());
            }

        } catch(Exception ex){
            throw ex;
        }

        if(!String.isBlank(strResponse)){
            squareJsonData = (Map<String, Object>)JSON.deserializeUntyped(strResponse);
        }
        if(!squareJsonData.isEmpty()){
            system.debug('strResponse----------      '+ squareJsonData);
            return squareJsonData;
        } else {
            return null;
        }
    }
}