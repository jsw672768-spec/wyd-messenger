package org.wyd.messenger;

import java.net.URI;
import java.util.Locale;
import java.util.regex.Pattern;

/** Pure Java URL validation, shared by navigation and deep-link handling. */
public final class UrlPolicy {
    private static final Pattern ID = Pattern.compile("[A-Za-z0-9_-]{1,100}");
    private UrlPolicy() {}

    public static String normalizeSite(String input) {
        try {
            URI uri = new URI(input.trim());
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
                    || uri.getUserInfo() != null || uri.getRawQuery() != null
                    || uri.getRawFragment() != null || uri.getPort() > 65535
                    || uri.getPort() == 0 || uri.getHost().contains("..")) return null;
            String path = uri.getRawPath();
            if (path != null && !path.isEmpty() && !"/".equals(path)) return null;
            return new URI("https", null, uri.getHost().toLowerCase(Locale.ROOT),
                    uri.getPort() == 443 ? -1 : uri.getPort(), null, null, null).toASCIIString();
        } catch (Exception ignored) { return null; }
    }

    public static String origin(String input) {
        try {
            URI uri = new URI(input);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
                    || uri.getUserInfo() != null || uri.getPort() > 65535 || uri.getPort() == 0)
                return null;
            return new URI("https", null, uri.getHost().toLowerCase(Locale.ROOT),
                    uri.getPort() == 443 ? -1 : uri.getPort(), null, null, null).toASCIIString();
        } catch (Exception ignored) { return null; }
    }

    public static boolean isInternal(String site, String destination) {
        String left = origin(site);
        String right = origin(destination);
        return left != null && left.equals(right);
    }

    public static String internalPath(String raw) {
        try {
            URI uri = new URI(raw);
            String path = uri.getRawPath();
            if ("wyd".equalsIgnoreCase(uri.getScheme())) {
                String host = uri.getHost();
                if (!"event".equals(host) && !"room".equals(host)) return null;
                path = "/" + host + (path == null ? "" : path);
            } else if (!"https".equalsIgnoreCase(uri.getScheme())) return null;
            if (uri.getRawQuery() != null || uri.getRawFragment() != null) return null;
            if (path == null) return null;
            String[] parts = path.split("/", -1);
            if (parts.length != 3 || !("event".equals(parts[1]) || "room".equals(parts[1]))
                    || !ID.matcher(parts[2]).matches()) return null;
            return "/" + parts[1] + "/" + parts[2];
        } catch (Exception ignored) { return null; }
    }

    public static String resolveInvite(String site, String invite) {
        String origin = normalizeSite(site);
        String path = internalPath(invite);
        return origin != null && path != null ? origin + path : null;
    }
}

