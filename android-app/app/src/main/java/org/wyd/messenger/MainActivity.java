package org.wyd.messenger;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Native shell for the existing WYD Next.js application. No JavaScript bridge is exposed. */
public class MainActivity extends Activity {
    private static final int CAMERA_REQUEST = 41;
    private static final int INK = Color.rgb(16, 24, 32);
    private static final int PAPER = Color.rgb(255, 254, 251);
    private static final int YELLOW = Color.rgb(255, 212, 59);
    private SharedPreferences preferences;
    private String site;
    private String pendingInvite;
    private WebView web;
    private FrameLayout root;
    private FrameLayout page;
    private ProgressBar progress;
    private PermissionRequest cameraRequest;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(PAPER);
        getWindow().setNavigationBarColor(PAPER);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        preferences = getSharedPreferences("wyd_settings", MODE_PRIVATE);
        site = UrlPolicy.normalizeSite(preferences.getString("site", BuildConfig.DEFAULT_SITE_URL));
        pendingInvite = inviteFromIntent(getIntent());
        root = new FrameLayout(this);
        root.setBackgroundColor(PAPER);
        setContentView(root);
        if (Build.VERSION.SDK_INT >= 35) {
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        }
        if (site == null) showSetup();
        else showBrowser(state);
    }

    private int dp(float n) { return (int) (getResources().getDisplayMetrics().density * n + 0.5f); }
    private TextView text(String value, int sp, boolean bold) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(sp);
        view.setTextColor(INK);
        if (bold) view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return view;
    }
    private LinearLayout column() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        return box;
    }
    private void add(LinearLayout parent, View child, int height) {
        parent.addView(child, new LinearLayout.LayoutParams(-1, height < 0 ? height : dp(height)));
    }
    private Button button(String label) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextColor(INK);
        b.setAllCaps(false);
        b.setBackgroundTintList(android.content.res.ColorStateList.valueOf(YELLOW));
        return b;
    }
    private void clearPage() {
        if (root != null) root.removeAllViews();
        page = null;
    }
    private void stopBrowser() {
        if (web == null) return;
        web.stopLoading();
        web.setWebChromeClient(null);
        web.setWebViewClient(null);
        web.destroy();
        web = null;
    }

    private void showSetup() {
        stopBrowser();
        clearPage();
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        LinearLayout form = column();
        form.setPadding(dp(26), dp(36), dp(26), dp(32));
        scroll.addView(form);
        root.addView(scroll);
        TextView logo = text("WYD.", 48, true);
        add(form, logo, -2);
        TextView title = text("Messenger", 26, true);
        add(form, title, -2);
        TextView tagline = text("언어의 벽을 넘어, 마음을 전하세요.\nSpeak without borders.", 15, false);
        tagline.setPadding(0, dp(16), 0, dp(28));
        add(form, tagline, -2);
        TextView label = text("WYD 서버 연결", 19, true);
        add(form, label, -2);
        TextView info = text("기존에 만들던 WYD 웹앱의 HTTPS 주소를 입력하세요. Codespaces의 포트 3000 주소도 사용할 수 있습니다. 서버가 실행 중이어야 채팅과 번역이 작동합니다.", 14, false);
        info.setPadding(0, dp(10), 0, dp(12));
        add(form, info, -2);
        EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setTextSize(14);
        input.setInputType(android.text.InputType.TYPE_TEXT_VARIATION_URI);
        input.setHint("https://your-wyd-app.example.com");
        input.setText(site == null ? "" : site);
        add(form, input, 56);
        TextView error = text("", 13, false);
        error.setTextColor(Color.rgb(180, 43, 43));
        error.setPadding(0, dp(6), 0, dp(8));
        add(form, error, -2);
        Button connect = button("연결하고 시작하기");
        add(form, connect, 52);
        connect.setOnClickListener(v -> {
            String checked = UrlPolicy.normalizeSite(input.getText().toString());
            if (checked == null) {
                error.setText("올바른 HTTPS 서버 주소를 입력하세요. 경로나 비밀번호는 포함하지 마세요.");
                return;
            }
            site = checked;
            preferences.edit().putString("site", checked).apply();
            showBrowser(null);
        });
        if (site != null) {
            Button back = button("기존 연결로 돌아가기");
            add(form, back, 52);
            back.setOnClickListener(v -> showBrowser(null));
        }
        TextView notice = text("이 앱은 기존 WYD 웹사이트를 안드로이드 화면에서 실행합니다. 서버 주소만 이 기기에 저장하며, 비밀번호나 API 비밀키를 입력할 필요가 없습니다.", 12, false);
        notice.setPadding(0, dp(24), 0, 0);
        add(form, notice, -2);
    }

    private void showBrowser(Bundle state) {
        if (site == null) { showSetup(); return; }
        stopBrowser();
        clearPage();
        LinearLayout shell = column();
        root.addView(shell, new FrameLayout.LayoutParams(-1, -1));
        LinearLayout bar = new LinearLayout(this);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(12), 0, dp(8), 0);
        bar.setBackgroundColor(PAPER);
        TextView home = text("WYD.", 21, true);
        home.setGravity(Gravity.CENTER_VERTICAL);
        bar.addView(home, new LinearLayout.LayoutParams(0, dp(48), 1));
        home.setOnClickListener(v -> loadHome());
        TextView menuButton = text("⋮", 26, true);
        menuButton.setGravity(Gravity.CENTER);
        bar.addView(menuButton, new LinearLayout.LayoutParams(dp(48), dp(48)));
        menuButton.setOnClickListener(this::showMenu);
        add(shell, bar, 48);
        FrameLayout content = new FrameLayout(this);
        shell.addView(content, new LinearLayout.LayoutParams(-1, 0, 1));
        page = content;
        web = new WebView(this);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSafeBrowsingEnabled(true);
        android.webkit.CookieManager.getInstance().setAcceptCookie(true);
        android.webkit.CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return navigate(request.getUrl().toString());
            }
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap icon) {
                progress.setVisibility(View.VISIBLE);
            }
            @Override public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showConnectionError();
            }
            @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, android.webkit.WebResourceResponse response) {
                if (request.isForMainFrame() && response.getStatusCode() >= 500) showConnectionError();
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
                progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }
            @Override public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> handleCamera(request));
            }
            @Override public void onPermissionRequestCanceled(PermissionRequest request) {
                if (cameraRequest == request) cameraRequest = null;
            }
            @Override public boolean onConsoleMessage(android.webkit.ConsoleMessage message) {
                return true;
            }
        });
        content.addView(web, new FrameLayout.LayoutParams(-1, -1));
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        content.addView(progress, new FrameLayout.LayoutParams(-1, dp(3), Gravity.TOP));
        if (pendingInvite != null) {
            String destination = UrlPolicy.resolveInvite(site, pendingInvite);
            pendingInvite = null;
            web.loadUrl(destination == null ? site + "/" : destination);
        } else if (state == null || web.restoreState(state) == null) {
            web.loadUrl(site + "/");
        }
    }

    private boolean navigate(String url) {
        if (UrlPolicy.isInternal(site, url)) return false;
        if (url.startsWith("wyd://")) {
            String resolved = UrlPolicy.resolveInvite(site, url);
            if (resolved != null) web.loadUrl(resolved);
            return true;
        }
        try {
            Uri uri = Uri.parse(url);
            String scheme = uri.getScheme();
            if ("https".equalsIgnoreCase(scheme) || "mailto".equalsIgnoreCase(scheme)
                    || "tel".equalsIgnoreCase(scheme) || "geo".equalsIgnoreCase(scheme)) {
                startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE));
            }
        } catch (Exception ignored) { }
        return true;
    }

    private void handleCamera(PermissionRequest request) {
        if (site == null || !UrlPolicy.isInternal(site, request.getOrigin().toString())) {
            request.deny(); return;
        }
        boolean video = false;
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) video = true;
        }
        if (!video) { request.deny(); return; }
        cameraRequest = request;
        if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            grantCamera();
        } else requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_REQUEST);
    }
    private void grantCamera() {
        if (cameraRequest != null) {
            cameraRequest.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
            cameraRequest = null;
        }
    }
    @Override public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code == CAMERA_REQUEST && cameraRequest != null) {
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) grantCamera();
            else { cameraRequest.deny(); cameraRequest = null; }
        }
    }

    private void showConnectionError() {
        if (page == null || web == null) return;
        for (int i = page.getChildCount() - 1; i >= 0; i--) {
            if (page.getChildAt(i).getTag() != null && "error".equals(page.getChildAt(i).getTag())) page.removeViewAt(i);
        }
        LinearLayout box = column();
        box.setTag("error");
        box.setGravity(Gravity.CENTER);
        box.setPadding(dp(28), dp(24), dp(28), dp(24));
        box.setBackgroundColor(PAPER);
        TextView title = text("연결할 수 없습니다", 23, true);
        title.setGravity(Gravity.CENTER);
        add(box, title, -2);
        TextView detail = text("서버가 실행 중인지와 인터넷 연결을 확인해주세요.\n" + site, 14, false);
        detail.setGravity(Gravity.CENTER);
        detail.setPadding(0, dp(16), 0, dp(20));
        add(box, detail, -2);
        Button retry = button("다시 연결");
        add(box, retry, 50);
        retry.setOnClickListener(v -> {
            page.removeView(box);
            web.reload();
        });
        Button change = button("서버 주소 변경");
        add(box, change, 50);
        change.setOnClickListener(v -> showSetup());
        page.addView(box, new FrameLayout.LayoutParams(-1, -1));
    }
    private void loadHome() {
        if (web != null && site != null) web.loadUrl(site + "/");
    }
    private void showMenu(View anchor) {
        PopupMenu popup = new PopupMenu(this, anchor);
        popup.getMenu().add("홈").setOnMenuItemClickListener(item -> { loadHome(); return true; });
        popup.getMenu().add("새로고침").setOnMenuItemClickListener(item -> { if (web != null) web.reload(); return true; });
        popup.getMenu().add("링크 복사").setOnMenuItemClickListener(item -> {
            String url = web == null ? site : web.getUrl();
            if (url != null) ((ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("WYD", url));
            return true;
        });
        popup.getMenu().add("공유하기").setOnMenuItemClickListener(item -> {
            Intent share = new Intent(Intent.ACTION_SEND);
            share.setType("text/plain");
            share.putExtra(Intent.EXTRA_TEXT, web == null ? site : web.getUrl());
            startActivity(Intent.createChooser(share, "WYD 공유"));
            return true;
        });
        popup.getMenu().add("브라우저에서 열기").setOnMenuItemClickClickListener(item -> {
            navigateExternal(web == null ? site : web.getUrl()); return true;
        });
        popup.getMenu().add("서버 설정").setOnMenuItemClickListener(item -> { showSetup(); return true; });
        popup.show();
    }
    private void navigateExternal(String url) {
        try { if (url != null) startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); }
        catch (Exception ignored) { }
    }
    private String inviteFromIntent(Intent intent) {
        if (intent == null || intent.getData() == null) return null;
        String value = intent.getDataString();
        return UrlPolicy.internalPath(value) == null ? null : value;
    }
    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String invite = inviteFromIntent(intent);
        if (invite != null) {
            if (site == null) { pendingInvite = invite; showSetup(); }
            else if (web != null) web.loadUrl(UrlPolicy.resolveInvite(site, invite));
            else { pendingInvite = invite; showBrowser(null); }
        }
    }
    @Override public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else if (web != null) new AlertDialog.Builder(this).setMessage("WYD Messenger를 종료할까요?")
                .setNegativeButton("취소", null).setPositiveButton("종료", (d, w) -> finish()).show();
        else super.onBackPressed();
    }
    @Override protected void onSaveInstanceState(Bundle state) {
        if (web != null) web.saveState(state);
        super.onSaveInstanceState(state);
    }
    @Override protected void onDestroy() {
        if (cameraRequest != null) { cameraRequest.deny(); cameraRequest = null; }
        stopBrowser();
        super.onDestroy();
    }
}
