package org.wyd.messenger;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.view.*;
import android.webkit.*;
import android.widget.*;

/** Native host for the existing server-rendered WYD application. */
public class MainActivity extends Activity {
    private static final int CAMERA = 41;
    private static final int PAPER = Color.rgb(255,254,251);
    private String site, invite;
    private WebView web;
    private FrameLayout root, content;
    private ProgressBar progress;
    private PermissionRequest cameraRequest;
    private android.content.SharedPreferences prefs;
    private int dp(int n) { return (int)(n*getResources().getDisplayMetrics().density+.5f); }
    private TextView text(String s, int size) { TextView t=new TextView(this); t.setText(s); t.setTextSize(size); t.setTextColor(Color.rgb(16,24,32)); return t; }
    private LinearLayout column() { LinearLayout l=new LinearLayout(this); l.setOrientation(1); l.setPadding(dp(24),dp(24),dp(24),dp(24)); return l; }
    private void add(LinearLayout l,View v,int h) { l.addView(v,new LinearLayout.LayoutParams(-1,h<0?h:dp(h))); }
    private Button button(String s) { Button b=new Button(this); b.setText(s); b.setAllCaps(false); b.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(255,212,59))); return b; }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(PAPER); getWindow().setNavigationBarColor(PAPER);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        prefs=getSharedPreferences("wyd_settings",MODE_PRIVATE);
        site=UrlPolicy.normalizeSite(prefs.getString("site",BuildConfig.DEFAULT_SITE_URL));
        invite=inviteFrom(getIntent());
        root=new FrameLayout(this); root.setBackgroundColor(PAPER); setContentView(root);
        if(Build.VERSION.SDK_INT>=35) root.setOnApplyWindowInsetsListener((v,i)->{
            android.graphics.Insets b=i.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());
            v.setPadding(b.left,b.top,b.right,b.bottom); return i;
        });
        if(site==null) setup(); else browser(state);
    }
    private void clear() { if(web!=null){ web.stopLoading(); web.setWebChromeClient(null); web.setWebViewClient(null); web.destroy(); web=null; } root.removeAllViews(); content=null; }
    private void setup() {
        clear(); ScrollView scroll=new ScrollView(this); scroll.setFillViewport(true); LinearLayout form=column(); scroll.addView(form); root.addView(scroll);
        TextView logo=text("WYD.",48); logo.setTypeface(null,1); add(form,logo,-2);
        add(form,text("Messenger",26),-2);
        TextView info=text("언어의 벽을 넘어, 마음을 전하세요.\n\n기존 WYD 웹앱의 HTTPS 주소를 입력하세요. Codespaces의 포트 3000 주소도 사용할 수 있습니다. 채팅과 번역을 이용하려면 서버가 실행 중이어야 합니다.",15);
        info.setPadding(0,dp(16),0,dp(20)); add(form,info,-2);
        EditText input=new EditText(this); input.setSingleLine(true); input.setInputType(android.text.InputType.TYPE_TEXT_VARIATION_URI); input.setText(site==null?"":site); input.setHint("https://your-wyd-app.example.com"); add(form,input,56);
        TextView error=text("",13); error.setTextColor(Color.RED); add(form,error,-2);
        Button connect=button("연결하고 시작하기"); add(form,connect,52);
        connect.setOnClickListener(v->{String checked=UrlPolicy.normalizeSite(input.getText().toString()); if(checked==null){error.setText("올바른 HTTPS 주소를 입력하세요. 경로나 비밀번호는 포함하지 마세요.");return;} site=checked; prefs.edit().putString("site",site).apply(); browser(null);});
        if(site!=null){Button back=button("기존 연결로 돌아가기"); add(form,back,52); back.setOnClickListener(v->browser(null));}
        TextView note=text("서버 주소만 기기에 저장합니다. API 비밀키나 계정 비밀번호를 입력하지 마세요.",12); note.setPadding(0,dp(24),0,0); add(form,note,-2);
    }
    private void browser(Bundle state) {
        if(site==null){setup();return;} clear();
        LinearLayout shell=new LinearLayout(this); shell.setOrientation(1); root.addView(shell,new FrameLayout.LayoutParams(-1,-1));
        LinearLayout bar=new LinearLayout(this); bar.setGravity(Gravity.CENTER_VERTICAL); bar.setPadding(dp(16),0,dp(8),0); add(shell,bar,48);
        TextView logo=text("WYD.",22); logo.setTypeface(null,1); logo.setGravity(Gravity.CENTER_VERTICAL); bar.addView(logo,new LinearLayout.LayoutParams(0,dp(48),1)); logo.setOnClickListener(v->home());
        TextView menu=text("⋮",28); menu.setGravity(Gravity.CENTER); bar.addView(menu,new LinearLayout.LayoutParams(dp(48),dp(48))); menu.setOnClickListener(this::menu);
        content=new FrameLayout(this); shell.addView(content,new LinearLayout.LayoutParams(-1,0,1));
        web=new WebView(this); WebSettings s=web.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setAllowFileAccess(false); s.setAllowContentAccess(false); s.setAllowFileAccessFromFileURLs(false); s.setAllowUniversalAccessFromFileURLs(false); s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW); s.setJavaScriptCanOpenWindowsAutomatically(false); s.setSupportMultipleWindows(false); s.setSafeBrowsingEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true); CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        web.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return navigate(r.getUrl().toString());}
            @Override public void onPageStarted(WebView v,String u,android.graphics.Bitmap icon){progress.setVisibility(View.VISIBLE);}
            @Override public void onPageFinished(WebView v,String u){progress.setVisibility(View.GONE);}
            @Override public void onReceivedError(WebView v,WebResourceRequest r,WebResourceError e){if(r.isForMainFrame())connectionError();}
            @Override public void onReceivedHttpError(WebView v,WebResourceRequest r,WebResourceResponse e){if(r.isForMainFrame()&&e.getStatusCode()>=500)connectionError();}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public void onProgressChanged(WebView v,int p){progress.setProgress(p);progress.setVisibility(p>=100?View.GONE:View.VISIBLE);}
            @Override public void onPermissionRequest(PermissionRequest r){runOnUiThread(()->requestCamera(r));}
            @Override public void onPermissionRequestCanceled(PermissionRequest r){if(cameraRequest==r)cameraRequest=null;}
        });
        content.addView(web,new FrameLayout.LayoutParams(-1,-1)); progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal); progress.setMax(100); content.addView(progress,new FrameLayout.LayoutParams(-1,dp(3),Gravity.TOP));
        String destination=invite==null?null:UrlPolicy.resolveInvite(site,invite); invite=null;
        if(destination!=null) web.loadUrl(destination); else if(state==null||web.restoreState(state)==null)home();
    }
    private boolean navigate(String url){
        if(UrlPolicy.isInternal(site,url))return false;
        if(url.startsWith("wyd://")){String dest=UrlPolicy.resolveInvite(site,url);if(dest!=null)web.loadUrl(dest);return true;}
        try{Uri u=Uri.parse(url);String scheme=u.getScheme();if("https".equalsIgnoreCase(scheme)||"mailto".equalsIgnoreCase(scheme)||"tel".equalsIgnoreCase(scheme)||"geo".equalsIgnoreCase(scheme))startActivity(new Intent(Intent.ACTION_VIEW,u).addCategory(Intent.CATEGORY_BROWSABLE));}catch(Exception ignored){} return true;
    }
    private void requestCamera(PermissionRequest r){
        if(!UrlPolicy.isInternal(site,r.getOrigin().toString())){r.deny();return;}
        boolean video=false;for(String resource:r.getResources())if(PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource))video=true;
        if(!video){r.deny();return;}cameraRequest=r;
        if(checkSelfPermission(Manifest.permission.CAMERA)==PackageManager.PERMISSION_GRANTED)grantCamera();else requestPermissions(new String[]{Manifest.permission.CAMERA},CAMERA);
    }
    private void grantCamera(){if(cameraRequest!=null){cameraRequest.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});cameraRequest=null;}}
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] results){super.onRequestPermissionsResult(code,permissions,results);if(code==CAMERA&&cameraRequest!=null){if(results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED)grantCamera();else{cameraRequest.deny();cameraRequest=null;}}}
    private void connectionError(){
        if(content==null||web==null)return;
        for(int i=content.getChildCount()-1;i>=0;i--)if("error".equals(content.getChildAt(i).getTag()))content.removeViewAt(i);
        LinearLayout box=column();box.setTag("error");box.setGravity(Gravity.CENTER);box.setBackgroundColor(PAPER);
        add(box,text("연결할 수 없습니다",23),-2);TextView detail=text("서버와 인터넷 연결을 확인해주세요.\n"+site,14);detail.setPadding(0,dp(16),0,dp(20));add(box,detail,-2);
        Button retry=button("다시 연결");add(box,retry,50);retry.setOnClickListener(v->{content.removeView(box);web.reload();});
        Button change=button("서버 주소 변경");add(box,change,50);change.setOnClickListener(v->setup());content.addView(box,new FrameLayout.LayoutParams(-1,-1));
    }
    private void home(){if(web!=null&&site!=null)web.loadUrl(site+"/");}
    private void menu(View anchor){
        PopupMenu p=new PopupMenu(this,anchor);
        p.getMenu().add("홈").setOnMenuItemClickListener(i->{home();return true;});
        p.getMenu().add("새로고침").setOnMenuItemClickListener(i->{if(web!=null)web.reload();return true;});
        p.getMenu().add("링크 복사").setOnMenuItemClickListener(i->{String u=web==null?site:web.getUrl();if(u!=null)((ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("WYD",u));return true;});
        p.getMenu().add("공유하기").setOnMenuItemClickListener(i->{Intent s=new Intent(Intent.ACTION_SEND);s.setType("text/plain");s.putExtra(Intent.EXTRA_TEXT,web==null?site:web.getUrl());startActivity(Intent.createChooser(s,"WYD 공유"));return true;});
        p.getMenu().add("브라우저에서 열기").setOnMenuItemClickListener(i->{try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(web==null?site:web.getUrl())));}catch(Exception ignored){}return true;});
        p.getMenu().add("서버 설정").setOnMenuItemClickListener(i->{setup();return true;});p.show();
    }
    private String inviteFrom(Intent intent){if(intent==null||intent.getData()==null)return null;String u=intent.getDataString();return UrlPolicy.internalPath(u)==null?null:u;}
    @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);String u=inviteFrom(intent);if(u!=null){if(site==null){invite=u;setup();}else if(web!=null)web.loadUrl(UrlPolicy.resolveInvite(site,u));else{invite=u;browser(null);}}}
    @Override public void onBackPressed(){if(web!=null&&web.canGoBack())web.goBack();else if(web!=null)new AlertDialog.Builder(this).setMessage("WYD Messenger를 종료할까요?").setNegativeButton("취소",null).setPositiveButton("종료",(d,w)->finish()).show();else super.onBackPressed();}
    @Override protected void onSaveInstanceState(Bundle state){if(web!=null)web.saveState(state);super.onSaveInstanceState(state);}
    @Override protected void onDestroy(){if(cameraRequest!=null){cameraRequest.deny();cameraRequest=null;}clear();super.onDestroy();}
}
