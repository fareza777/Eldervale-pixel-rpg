package com.eldervale.hollowsun;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.review.ReviewManager;
import com.google.android.play.core.review.ReviewManagerFactory;

/** Google controls review availability and quotas; failure keeps local feedback available. */
@CapacitorPlugin(name = "PlayReview")
public class PlayReviewPlugin extends Plugin {
    @PluginMethod
    public void request(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            ReviewManager manager = ReviewManagerFactory.create(getContext());
            manager.requestReviewFlow().addOnCompleteListener(request -> {
                if (!request.isSuccessful()) {
                    call.reject("Google Play review is unavailable for this install.");
                    return;
                }
                manager.launchReviewFlow(getActivity(), request.getResult()).addOnCompleteListener(flow -> {
                    JSObject result = new JSObject();
                    result.put("requested", true);
                    call.resolve(result);
                });
            });
        });
    }
}
