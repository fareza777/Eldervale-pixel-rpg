package com.eldervale.hollowsun;

import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.android.billingclient.api.*;
import java.util.ArrayList;
import java.util.List;

/** One non-consumable product. Google Play supplies price, ownership and checkout. */
@CapacitorPlugin(name="PlayBilling")
public class PlayBillingPlugin extends Plugin {
    private BillingClient client;
    private ProductDetails product;
    private String offerToken="",price="US$4.99",message="Purchases are available through Google Play.";
    private final List<Runnable> connected=new ArrayList<>();
    private boolean connecting=false;
    private PluginCall purchaseCall;

    @Override public void load(){
        client=BillingClient.newBuilder(getContext()).setListener(this::purchasesUpdated)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection().build();
    }
    private JSObject state(){
        JSObject s=new JSObject();s.put("adFree",PurchaseEntitlement.owns(getContext()));s.put("price",price);
        s.put("purchaseAvailable",client.isReady()&&product!=null&&PurchaseEntitlement.configured(getContext()));
        s.put("pending",purchaseCall!=null);s.put("message",message);return s;
    }
    private void changed(){
        notifyListeners("state",state());
        PluginHandle ads=getBridge().getPlugin("EldervaleAds");
        if(ads!=null&&ads.getInstance() instanceof EldervaleAdsPlugin)((EldervaleAdsPlugin)ads.getInstance()).refreshEntitlement();
    }
    private void connect(Runnable action){
        if(client.isReady()){action.run();return;}
        connected.add(action);if(connecting)return;connecting=true;
        client.startConnection(new BillingClientStateListener(){
            @Override public void onBillingSetupFinished(BillingResult result){
                connecting=false;
                if(result.getResponseCode()!=BillingClient.BillingResponseCode.OK)message="Google Play is unavailable for this install.";
                List<Runnable> pending=new ArrayList<>(connected);connected.clear();pending.forEach(Runnable::run);
            }
            @Override public void onBillingServiceDisconnected(){connecting=false;message="Reconnect to Google Play to check purchases.";changed();}
        });
    }
    private void queryProduct(Runnable done){
        if(!client.isReady()){done.run();return;}
        var item=QueryProductDetailsParams.Product.newBuilder().setProductId(getContext().getString(R.string.remove_ads_product_id)).setProductType(BillingClient.ProductType.INAPP).build();
        client.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(List.of(item)).build(),(result,details)->{
            product=null;
            for(ProductDetails p:details.getProductDetailsList()){
                var offers=p.getOneTimePurchaseOfferDetailsList();if(offers==null)continue;
                for(var offer:offers){if(offer.getRentalDetails()!=null)continue;product=p;offerToken=offer.getOfferToken();price=offer.getFormattedPrice();break;}
                if(product!=null)break;
            }
            if(product==null)message="Remove Ads is available in the Google Play edition.";
            else message="One-time purchase. Restore it with the same Google Play account.";
            changed();done.run();
        });
    }
    private void queryOwned(Runnable done){
        if(!client.isReady()){changed();done.run();return;}
        client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),(result,purchases)->{
            if(result.getResponseCode()!=BillingClient.BillingResponseCode.OK){changed();done.run();return;}
            Purchase match=purchases.stream().filter(p->p.getProducts().contains(getContext().getString(R.string.remove_ads_product_id))).findFirst().orElse(null);
            if(match==null){PurchaseEntitlement.clear(getContext());changed();done.run();}
            else process(match,done);
        });
    }
    private void process(Purchase purchase,Runnable done){
        if(purchase.getPurchaseState()==Purchase.PurchaseState.PENDING){message="Payment is pending. Ads are removed after approval.";changed();done.run();return;}
        if(purchase.getPurchaseState()!=Purchase.PurchaseState.PURCHASED||!PurchaseEntitlement.verify(getContext(),purchase.getOriginalJson(),purchase.getSignature())){
            message="Google Play could not verify this purchase.";changed();done.run();return;
        }
        Runnable grant=()->{PurchaseEntitlement.save(getContext(),purchase.getOriginalJson(),purchase.getSignature());message="Ads removed. Thank you for supporting Eldervale.";changed();done.run();};
        if(purchase.isAcknowledged()){grant.run();return;}
        client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(purchase.getPurchaseToken()).build(),result->{
            if(result.getResponseCode()==BillingClient.BillingResponseCode.OK)grant.run();
            else{message="Purchase received. Reconnect to finish verification.";changed();done.run();}
        });
    }
    private void purchasesUpdated(BillingResult result,List<Purchase> purchases){
        Runnable finish=()->{PluginCall call=purchaseCall;purchaseCall=null;changed();if(call!=null)call.resolve(state());};
        if(result.getResponseCode()==BillingClient.BillingResponseCode.OK&&purchases!=null){
            Purchase match=purchases.stream().filter(p->p.getProducts().contains(getContext().getString(R.string.remove_ads_product_id))).findFirst().orElse(null);
            if(match!=null){process(match,finish);return;}
        }
        if(result.getResponseCode()==BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED){queryOwned(finish);return;}
        message=result.getResponseCode()==BillingClient.BillingResponseCode.USER_CANCELED?"Purchase cancelled.":"Google Play could not complete this purchase.";finish.run();
    }
    @PluginMethod public void initialize(PluginCall call){getActivity().runOnUiThread(()->connect(()->queryOwned(()->queryProduct(()->call.resolve(state())))));}
    @PluginMethod public void getState(PluginCall call){call.resolve(state());}
    @PluginMethod public void restore(PluginCall call){getActivity().runOnUiThread(()->connect(()->queryOwned(()->call.resolve(state()))));}
    @PluginMethod public void purchase(PluginCall call){getActivity().runOnUiThread(()->{
        if(purchaseCall!=null){call.reject("A purchase is already in progress.");return;}
        if(PurchaseEntitlement.owns(getContext())){call.resolve(state());return;}
        if(!PurchaseEntitlement.configured(getContext())){call.reject("Purchases are available in the Google Play edition.");return;}
        connect(()->queryProduct(()->{
            if(product==null||!client.isReady()){call.reject("Google Play has no purchase offer for this install.");return;}
            purchaseCall=call;changed();
            var params=BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product).setOfferToken(offerToken).build();
            BillingResult result=client.launchBillingFlow(getActivity(),BillingFlowParams.newBuilder().setProductDetailsParamsList(List.of(params)).build());
            if(result.getResponseCode()!=BillingClient.BillingResponseCode.OK){purchaseCall=null;changed();call.reject("Google Play could not open checkout.");}
        }));
    });}
    @Override protected void handleOnResume(){if(client!=null)getActivity().runOnUiThread(()->connect(()->queryOwned(()->{})));}
    @Override protected void handleOnDestroy(){if(client!=null)client.endConnection();if(purchaseCall!=null)purchaseCall.reject("Checkout was interrupted.");connected.clear();}
}
