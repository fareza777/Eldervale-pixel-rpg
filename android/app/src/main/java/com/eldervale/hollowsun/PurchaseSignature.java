package com.eldervale.hollowsun;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;

/** Pure signature check, also exercised by JVM tests without a store account. */
final class PurchaseSignature {
    static boolean validKey(byte[] key){
        try{return KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(key))!=null;}
        catch(Exception ignored){return false;}
    }
    static boolean verify(byte[] key,String json,byte[] signed){
        try{
            Signature verifier=Signature.getInstance("SHA1withRSA");
            verifier.initVerify(KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(key)));
            verifier.update(json.getBytes(StandardCharsets.UTF_8));return verifier.verify(signed);
        }catch(Exception ignored){return false;}
    }
}
