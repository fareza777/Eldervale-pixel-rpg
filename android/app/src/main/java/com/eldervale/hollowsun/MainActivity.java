package com.eldervale.hollowsun;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PlayReviewPlugin.class);
        registerPlugin(EldervaleAdsPlugin.class);
        registerPlugin(PlayBillingPlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        WindowCompat.enableEdgeToEdge(getWindow());
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())
            .setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        installGameInsets();
    }

    private void installGameInsets() {
        View decor = getWindow().getDecorView();
        // The world draws behind cutouts; only interactive UI receives safe-area padding.
        // Native WebView padding would leave an empty strip on older WebViews.
        ViewCompat.setOnApplyWindowInsetsListener(decor, (view, insets) -> {
            Insets safe = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            boolean keyboard = insets.isVisible(WindowInsetsCompat.Type.ime());
            view.setPadding(0, 0, 0, keyboard ? insets.getInsets(WindowInsetsCompat.Type.ime()).bottom : 0);
            float density = getResources().getDisplayMetrics().density;
            String css = String.format(Locale.US,
                "document.documentElement.style.setProperty('--safe-area-inset-top','%.2fpx');" +
                "document.documentElement.style.setProperty('--safe-area-inset-right','%.2fpx');" +
                "document.documentElement.style.setProperty('--safe-area-inset-bottom','%.2fpx');" +
                "document.documentElement.style.setProperty('--safe-area-inset-left','%.2fpx');",
                safe.top / density, safe.right / density, keyboard ? 0 : safe.bottom / density, safe.left / density);
            if (bridge != null && bridge.getWebView() != null) bridge.getWebView().evaluateJavascript(css, null);
            // Avoid a second automatic inset inside WebView; IME resize remains native.
            return new WindowInsetsCompat.Builder(insets)
                .setInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout(), Insets.NONE).build();
        });
        bridge.addWebViewListener(new WebViewListener() {
            @Override public void onPageLoaded(WebView webView) {
                ViewCompat.requestApplyInsets(decor);
            }
        });
        ViewCompat.requestApplyInsets(decor);
    }
}
