'use client';

/**
 * JitsiFrame — Jitsi IFrame API wrapper for the ERP.
 *
 * Uses the official Jitsi IFrame API loaded from the configured Jitsi server.
 * Designed to be migrated to self-hosted Jitsi with JWT by changing the
 * NEXT_PUBLIC_JITSI_DOMAIN env variable and passing a `jwt` prop.
 *
 * Security note: The public meet.jit.si rooms are not access-controlled.
 * Server-side join validation in /api/meetings/[id]/join limits who the ERP
 * directs into a room. When you self-host Jitsi, generate JWT tokens server-side
 * and pass them here via the `jwt` prop.
 */

import React, { useEffect, useRef, useCallback } from 'react';

// Extend Window to include the Jitsi IFrame API constructor
declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: JitsiOptions) => JitsiAPI;
  }
}

interface JitsiOptions {
  roomName: string;
  parentNode: HTMLElement;
  width: string | number;
  height: string | number;
  userInfo: { displayName: string; email?: string };
  configOverwrite: Record<string, unknown>;
  interfaceConfigOverwrite: Record<string, unknown>;
  jwt?: string; // For self-hosted Jitsi with JWT auth
}

interface JitsiAPI {
  addEventListeners: (listeners: Record<string, (e?: unknown) => void>) => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  dispose: () => void;
  getNumberOfParticipants: () => number;
}

export interface JitsiFrameProps {
  domain: string;             // e.g. "meet.jit.si" or "jitsi.yourcompany.com"
  roomId: string;             // The meeting room_id
  displayName: string;        // Current user's display name
  email?: string;
  jwt?: string;               // JWT token for self-hosted Jitsi
  onMeetingEnd?: () => void;
  onParticipantJoined?: (participant: { id: string; displayName: string }) => void;
  onParticipantLeft?: (participant: { id: string }) => void;
  onError?: (message: string) => void;
}

export function JitsiFrame({
  domain,
  roomId,
  displayName,
  email,
  jwt,
  onMeetingEnd,
  onParticipantJoined,
  onParticipantLeft,
  onError,
}: JitsiFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiAPI | null>(null);

  const initJitsi = useCallback(() => {
    if (!containerRef.current || !window.JitsiMeetExternalAPI) {
      onError?.('Jitsi API not loaded. Check your network connection.');
      return;
    }

    // Dispose any existing instance first
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }

    try {
      const options: JitsiOptions = {
        roomName: roomId,
        parentNode: containerRef.current,
        width: '100%',
        height: '100%',
        userInfo: { displayName, email },
        jwt,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,          // Skip the pre-join lobby for ERP flow
          disableDeepLinking: true,
          disableThirdPartyRequests: false,
          toolbarButtons: [
            'microphone', 'camera', 'desktop', 'chat',
            'participants-pane', 'raisehand', 'fullscreen',
            'tileview', 'hangup',
          ],
          buttonsWithNotifyClick: ['hangup'],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          TOOLBAR_ALWAYS_VISIBLE: true,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          MOBILE_APP_PROMO: false,
          HIDE_INVITE_MORE_HEADER: false,
        },
      };

      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      apiRef.current.addEventListeners({
        videoConferenceLeft: () => {
          onMeetingEnd?.();
        },
        participantJoined: (e) => {
          const participant = e as { id: string; displayName: string };
          onParticipantJoined?.(participant);
        },
        participantLeft: (e) => {
          const participant = e as { id: string };
          onParticipantLeft?.(participant);
        },
        errorOccurred: (e) => {
          const error = e as { error?: { name?: string; message?: string }; type?: string };
          const msg = error?.error?.message || error?.error?.name || 'Jitsi connection error';
          onError?.(msg);
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize Jitsi';
      onError?.(message);
    }
  }, [domain, roomId, displayName, email, jwt, onMeetingEnd, onParticipantJoined, onParticipantLeft, onError]);

  // Load the Jitsi IFrame API script dynamically
  useEffect(() => {
    const scriptId = 'jitsi-api-script';
    const existing = document.getElementById(scriptId);

    if (existing) {
      // Script already loaded
      initJitsi();
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://${domain}/external_api.js`;
    script.async = true;
    script.onload = () => initJitsi();
    script.onerror = () => onError?.(`Failed to load Jitsi from ${domain}`);
    document.head.appendChild(script);

    return () => {
      // Don't remove the script on cleanup — it may be shared across navigations
    };
  }, [domain, initJitsi, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: 480 }}
    />
  );
}
