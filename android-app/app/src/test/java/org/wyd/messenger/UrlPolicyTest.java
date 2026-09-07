package org.wyd.messenger;

import org.junit.Test;
import static org.junit.Assert.*;

public class UrlPolicyTest {
    @Test public void acceptsSecureSites() {
        assertEquals("https://example.com", UrlPolicy.normalizeSite(" https://EXAMPLE.com/ "));
        assertEquals("https://example.com:3000", UrlPolicy.normalizeSite("https://example.com:3000"));
        assertNull(UrlPolicy.normalizeSite("http://example.com"));
        assertNull(UrlPolicy.normalizeSite("https://example.com@evil.com/path"));
        assertNull(UrlPolicy.normalizeSite("https://example.com/event/abc"));
        assertNull(UrlPolicy.normalizeSite("https://example.com/?token=secret"));
    }
    @Test public void restrictsNavigationToOrigin() {
        assertTrue(UrlPolicy.isInternal("https://example.com", "https://example.com/room/abc"));
        assertFalse(UrlPolicy.isInternal("https://example.com", "https://example.com.evil.org/"));
        assertFalse(UrlPolicy.isInternal("https://example.com", "http://example.com/"));
        assertFalse(UrlPolicy.isInternal("https://example.com", "javascript:alert(1)"));
    }
    @Test public void validatesInvites() {
        assertEquals("/event/abc_123", UrlPolicy.internalPath("wyd://event/abc_123"));
        assertEquals("/room/abc-123", UrlPolicy.internalPath("https://old.example/room/abc-123"));
        assertNull(UrlPolicy.internalPath("wyd://evil/abc"));
        assertNull(UrlPolicy.internalPath("https://old.example/room/%2e%2e"));
        assertNull(UrlPolicy.internalPath("https://old.example/room/abc/extra"));
        assertNull(UrlPolicy.internalPath("https://old.example/room/abc?x=1"));
        assertEquals("https://new.example/event/abc", UrlPolicy.resolveInvite("https://new.example", "wyd://event/abc"));
    }
}
