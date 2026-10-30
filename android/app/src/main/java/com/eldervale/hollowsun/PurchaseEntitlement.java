package com.eldervale.hollowsun;

import android.content.Context;
import android.util.Base64;
import org.json.JSONObject;

/** Offline entitlement comes from a signed Play receipt, never an imported save flag. */
final class PurchaseEntitlement {
    private static final String STORE="play_entitlement";
    static boolean configured(Context context){
        try{return PurchaseSignature.validKey(Base64.decode(context.getString(R.string.play_billing_public_key).trim(),Base64.DEFAULT));}
        catch(Exception ignored){return false;}
    }
    static boolean verify(Context context,String json,String signed){
        try {
            String key=context.getString(R.string.play_billing_public_key).trim();
            if(key.isEmpty()||json.isEmpty()||signed.isEmpty())return false;
            JSONObject receipt=new JSONObject(json);
            String product=context.getString(R.string.remove_ads_product_id);
            boolean matches=product.equals(receipt.optString("productId"));
            var products=receipt.optJSONArray("productIds");
            if(products!=null)for(int i=0;i<products.length();i++)if(product.equals(products.optString(i)))matches=true;
            if(!context.getPackageName().equals(receipt.optString("packageName"))||!matches||receipt.optInt("purchaseState",-1)!=0)return false;
            return PurchaseSignature.verify(Base64.decode(key,Base64.DEFAULT),json,Base64.decode(signed,Base64.DEFAULT));
        }catch(Exception ignored){return false;}
    }
    static boolean owns(Context context){
        var prefs=context.getSharedPreferences(STORE,Context.MODE_PRIVATE);
        return verify(context,prefs.getString("receipt",""),prefs.getString("signature",""));
    }
    static void save(Context context,String json,String signed){
        if(verify(context,json,signed))context.getSharedPreferences(STORE,Context.MODE_PRIVATE).edit().putString("receipt",json).putString("signature",signed).apply();
    }
    static void clear(Context context){context.getSharedPreferences(STORE,Context.MODE_PRIVATE).edit().clear().apply();}
}
