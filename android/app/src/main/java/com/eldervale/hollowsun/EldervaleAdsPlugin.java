package com.eldervale.hollowsun;

import android.graphics.Color;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.annotation.NonNull;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.*;
import com.google.android.gms.ads.interstitial.*;
import com.google.android.gms.ads.rewarded.*;
import com.google.ads.mediation.admob.AdMobAdapter;
import com.google.android.ump.*;
import java.util.UUID;

/** Native Google test/live formats. Full-screen ads are silent and pause the RPG. */
@CapacitorPlugin(name="EldervaleAds")
public class EldervaleAdsPlugin extends Plugin {
    private ConsentInformation consent;
    private AdView banner;
    private FrameLayout dock;
    private InterstitialAd interstitial;
    private RewardedAd rewarded;
    private boolean initialized=false,initializing=false,bannerLoaded=false,bannerWanted=false,fullScreen=false;
    private boolean loadingInterstitial=false,loadingRewarded=false;
    private long started=SystemClock.elapsedRealtime(),lastInterstitial=0;
    private String lastError="";
    private boolean testMode(){return getContext().getResources().getBoolean(R.bool.monetization_test_mode);}
    private boolean owns(){return PurchaseEntitlement.owns(getContext());}
    private boolean canRequest(){return testMode()||consent!=null&&consent.canRequestAds();}
    private JSObject state(){
        JSObject s=new JSObject();s.put("testMode",testMode());s.put("initialized",initialized);s.put("adFree",owns());
        boolean visible=banner!=null&&bannerLoaded&&bannerWanted&&!fullScreen&&!owns()&&canRequest();
        s.put("bannerLoaded",bannerLoaded);s.put("bannerVisible",visible);
        s.put("bannerHeight",visible?banner.getAdSize().getHeight():0);
        s.put("interstitialReady",interstitial!=null&&!owns()&&canRequest());s.put("rewardedReady",rewarded!=null&&!owns()&&canRequest());
        s.put("fullScreen",fullScreen);s.put("privacyRequired",consent!=null&&consent.getPrivacyOptionsRequirementStatus()==ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED);
        s.put("error",lastError);return s;
    }
    private void changed(){notifyListeners("state",state());}
    private AdRequest request(){Bundle options=new Bundle();options.putString("npa","1");return new AdRequest.Builder().addNetworkExtrasBundle(AdMobAdapter.class,options).build();}
    @PluginMethod public void initialize(PluginCall call){getActivity().runOnUiThread(()->{
        if(initialized||initializing){call.resolve(state());return;}
        consent=UserMessagingPlatform.getConsentInformation(getContext());
        if(testMode()){startSdk(call);return;}
        consent.requestConsentInfoUpdate(getActivity(),new ConsentRequestParameters.Builder().build(),()->
            UserMessagingPlatform.loadAndShowConsentFormIfRequired(getActivity(),error->{
                if(consent.canRequestAds())startSdk(call);else{lastError="Privacy choices are needed before ads can load.";changed();call.resolve(state());}
            }),error->{if(consent.canRequestAds())startSdk(call);else{lastError="Ads are unavailable. You can keep playing.";changed();call.resolve(state());}});
    });}
    private void startSdk(PluginCall call){
        initializing=true;
        MobileAds.setRequestConfiguration(new RequestConfiguration.Builder().setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G).build());
        new Thread(()->{
            try{MobileAds.initialize(getContext(),status->getActivity().runOnUiThread(()->{
                MobileAds.setAppMuted(true);MobileAds.setAppVolume(0f);
                initializing=false;initialized=true;lastError="";if(!owns()){createBanner();preload();}changed();call.resolve(state());
            }));}catch(RuntimeException error){getActivity().runOnUiThread(()->{initializing=false;lastError="Ads are unavailable. You can keep playing.";changed();call.resolve(state());});}
        },"eldervale-ad-init").start();
    }
    private void createBanner(){
        if(banner!=null||owns()||!canRequest())return;
        banner=new AdView(getActivity());banner.setAdUnitId(getContext().getString(R.string.admob_banner_id));
        int width=Math.max(320,(int)(getBridge().getWebView().getWidth()/getContext().getResources().getDisplayMetrics().density));
        banner.setAdSize(AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(getActivity(),width));
        dock=new FrameLayout(getActivity());dock.setBackgroundColor(Color.rgb(9,13,23));dock.setVisibility(View.GONE);
        dock.addView(banner,new FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT,FrameLayout.LayoutParams.MATCH_PARENT,Gravity.CENTER));
        FrameLayout root=getActivity().findViewById(android.R.id.content);root.addView(dock);positionBanner();
        banner.setAdListener(new AdListener(){
            @Override public void onAdLoaded(){bannerLoaded=true;lastError="";updateBanner();changed();}
            @Override public void onAdFailedToLoad(@NonNull LoadAdError error){bannerLoaded=false;lastError="Banner unavailable. You can keep playing.";updateBanner();changed();}
        });
        banner.loadAd(request());
    }
    private void positionBanner(){
        if(dock==null||banner==null)return;
        FrameLayout root=getActivity().findViewById(android.R.id.content);View web=getBridge().getWebView();
        int[] a=new int[2],b=new int[2];web.getLocationOnScreen(a);root.getLocationOnScreen(b);
        int height=banner.getAdSize().getHeightInPixels(getContext());
        var params=new FrameLayout.LayoutParams(web.getWidth(),height,Gravity.TOP|Gravity.LEFT);
        var insets=ViewCompat.getRootWindowInsets(root);
        int bottom=insets==null?0:insets.getInsets(WindowInsetsCompat.Type.systemBars()|WindowInsetsCompat.Type.displayCutout()).bottom;
        params.leftMargin=a[0]-b[0];params.topMargin=a[1]-b[1]+web.getHeight()-height-bottom;dock.setLayoutParams(params);
    }
    private void updateBanner(){if(dock!=null){positionBanner();dock.setVisibility(bannerLoaded&&bannerWanted&&!fullScreen&&!owns()&&canRequest()?View.VISIBLE:View.GONE);}}
    @PluginMethod public void setSurface(PluginCall call){getActivity().runOnUiThread(()->{
        String surface=call.getString("surface","none");bannerWanted=surface.equals("title")||surface.equals("pause")||surface.equals("support");
        updateBanner();changed();call.resolve(state());
    });}
    @PluginMethod public void getState(PluginCall call){getActivity().runOnUiThread(()->call.resolve(state()));}
    private void preload(){
        if(!initialized||owns()||!canRequest())return;
        if(interstitial==null&&!loadingInterstitial){loadingInterstitial=true;InterstitialAd.load(getContext(),getContext().getString(R.string.admob_interstitial_id),request(),new InterstitialAdLoadCallback(){
            @Override public void onAdLoaded(@NonNull InterstitialAd ad){loadingInterstitial=false;if(!owns()&&canRequest())interstitial=ad;changed();}
            @Override public void onAdFailedToLoad(@NonNull LoadAdError error){loadingInterstitial=false;lastError="Interstitial unavailable.";changed();}
        });}
        if(rewarded==null&&!loadingRewarded){loadingRewarded=true;RewardedAd.load(getContext(),getContext().getString(R.string.admob_rewarded_id),request(),new RewardedAdLoadCallback(){
            @Override public void onAdLoaded(@NonNull RewardedAd ad){loadingRewarded=false;if(!owns()&&canRequest())rewarded=ad;changed();}
            @Override public void onAdFailedToLoad(@NonNull LoadAdError error){loadingRewarded=false;lastError="Reward ad unavailable. Try again later.";changed();}
        });}
    }
    @PluginMethod public void refresh(PluginCall call){getActivity().runOnUiThread(()->{if(initialized&&canRequest()&&!owns()){if(banner!=null&&!bannerLoaded)banner.loadAd(request());preload();}call.resolve(state());});}
    @PluginMethod public void showInterstitial(PluginCall call){getActivity().runOnUiThread(()->{
        long now=SystemClock.elapsedRealtime();
        if(owns()||!canRequest()||fullScreen||interstitial==null||(!testMode()&&(now-started<300000||now-lastInterstitial<180000))){JSObject r=new JSObject();r.put("shown",false);call.resolve(r);return;}
        InterstitialAd ad=interstitial;interstitial=null;fullScreen=true;updateBanner();changed();
        ad.setFullScreenContentCallback(new FullScreenContentCallback(){
            private void finish(boolean shown){fullScreen=false;if(shown)lastInterstitial=SystemClock.elapsedRealtime();updateBanner();changed();JSObject r=new JSObject();r.put("shown",shown);call.resolve(r);preload();}
            @Override public void onAdDismissedFullScreenContent(){finish(true);}
            @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError error){finish(false);}
        });ad.show(getActivity());
    });}
    @PluginMethod public void showRewarded(PluginCall call){getActivity().runOnUiThread(()->{
        if(owns()){call.reject("Ads have been removed.");return;}
        if(!canRequest()||fullScreen||rewarded==null){preload();call.reject("No reward ad is ready yet. Try again later.");return;}
        RewardedAd ad=rewarded;rewarded=null;fullScreen=true;final boolean[] earned={false};String rewardId=UUID.randomUUID().toString();updateBanner();changed();
        ad.setFullScreenContentCallback(new FullScreenContentCallback(){
            private void finish(){fullScreen=false;updateBanner();changed();JSObject r=new JSObject();r.put("earned",earned[0]);r.put("rewardId",rewardId);call.resolve(r);preload();}
            @Override public void onAdDismissedFullScreenContent(){finish();}
            @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError error){finish();}
        });ad.show(getActivity(),reward->{earned[0]=true;});
    });}
    @PluginMethod public void privacyOptions(PluginCall call){getActivity().runOnUiThread(()->{
        if(consent==null||consent.getPrivacyOptionsRequirementStatus()!=ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED){call.resolve(state());return;}
        UserMessagingPlatform.showPrivacyOptionsForm(getActivity(),error->{if(!consent.canRequestAds()){interstitial=null;rewarded=null;bannerWanted=false;}updateBanner();changed();call.resolve(state());});
    });}
    void refreshEntitlement(){getActivity().runOnUiThread(()->{
        if(owns()){interstitial=null;rewarded=null;if(banner!=null){banner.destroy();banner=null;bannerLoaded=false;}if(dock!=null){((FrameLayout)dock.getParent()).removeView(dock);dock=null;}}
        else if(initialized){createBanner();preload();}changed();
    });}
    @Override protected void handleOnPause(){if(banner!=null)banner.pause();}
    @Override protected void handleOnResume(){if(banner!=null){banner.resume();getActivity().runOnUiThread(this::updateBanner);}}
    @Override protected void handleOnDestroy(){if(banner!=null)banner.destroy();if(dock!=null&&dock.getParent()!=null)((FrameLayout)dock.getParent()).removeView(dock);}
}
