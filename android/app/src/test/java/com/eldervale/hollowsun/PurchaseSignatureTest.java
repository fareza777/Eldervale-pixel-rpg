package com.eldervale.hollowsun;
import org.junit.Test;
import java.security.*;
import java.nio.charset.StandardCharsets;
import static org.junit.Assert.*;

public class PurchaseSignatureTest {
    private final String receipt="{\"packageName\":\"com.eldervale.hollowsun\",\"productId\":\"remove_ads\",\"purchaseState\":0}";
    private KeyPair pair()throws Exception{var generator=KeyPairGenerator.getInstance("RSA");generator.initialize(2048);return generator.generateKeyPair();}
    private byte[] sign(KeyPair key,String data)throws Exception{var s=Signature.getInstance("SHA1withRSA");s.initSign(key.getPrivate());s.update(data.getBytes(StandardCharsets.UTF_8));return s.sign();}
    @Test public void acceptsAnIntactSignedReceipt()throws Exception{var key=pair();assertTrue(PurchaseSignature.verify(key.getPublic().getEncoded(),receipt,sign(key,receipt)));}
    @Test public void rejectsChangedProductAndPendingState()throws Exception{var key=pair();var sig=sign(key,receipt);assertFalse(PurchaseSignature.verify(key.getPublic().getEncoded(),receipt.replace("remove_ads","other_product"),sig));assertFalse(PurchaseSignature.verify(key.getPublic().getEncoded(),receipt.replace(":0",":4"),sig));}
    @Test public void rejectsAnotherPublishersKey()throws Exception{var key=pair();assertFalse(PurchaseSignature.verify(pair().getPublic().getEncoded(),receipt,sign(key,receipt)));}
    @Test public void rejectsMalformedProofs(){assertFalse(PurchaseSignature.verify(new byte[]{1,2},receipt,new byte[]{4,5}));assertFalse(PurchaseSignature.verify(new byte[0],receipt,new byte[0]));}
    @Test public void checkoutNeedsAValidPublicKey()throws Exception{assertTrue(PurchaseSignature.validKey(pair().getPublic().getEncoded()));assertFalse(PurchaseSignature.validKey(new byte[0]));assertFalse(PurchaseSignature.validKey(new byte[]{1,2,3}));}
}
