import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { useEffect, useState } from 'react';
import { LIVE_KIT_SERVER_URL } from '../env_vars';
import { videoAPI } from '../services/api';
import { useUser } from './UserContext';
import { useTranslation } from "react-i18next";

function MyCustomControls({ roomName }: { roomName: string }) {
  const { t } = useTranslation();
  const [egressId, setEgressId] = useState<string | null>(null);

  const handleStart = async () => {
    try {
      const res = await videoAPI.startRecording(roomName);
      setEgressId(res.egress_id);
    } catch (e) {
      console.error('Start recording failed', e);
    }
  };

  const handleStop = async () => {
    try {
      if (egressId) {
        await videoAPI.stopRecording(egressId);
        setEgressId(null);
      }
    } catch (e) {
      console.error('Stop recording failed', e);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <ControlBar />

      <div
        style={{
          position: 'absolute',
          bottom: '4rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '1rem',
          zIndex: 1000,
        }}
      >
        <button
          onClick={handleStart}
          style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
        >
          {t("Start Recording")}
        </button>

        <button
          onClick={handleStop}
          disabled={!egressId}
          style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
        >
          {t("Stop Recording")}
        </button>
      </div>
    </div>
  );
}

export default function VideoRoom() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useUser();
  const [identity, setIdentity] = useState<string>();
  const [token, setToken] = useState<string>();

  const roomName = window.location.pathname.split('/').pop() || 'default-room';

  useEffect(() => {
    const controller = new AbortController();

    setIdentity(
      isAuthenticated && user
        ? user.username
        : 'guest-' + Math.random().toString(36).substring(2, 15)
    );

    const fetchToken = async (identity: string) => {
      try {
        const r = await videoAPI.getToken(roomName, identity, controller.signal);
        setToken(r.token);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch token:", error);
        }
      }
    };

    identity && fetchToken(identity);

    return () => controller.abort();
  }, [isAuthenticated, user, roomName]);

  if (!token) {
    return <div>{t("Getting token...")}</div>;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={LIVE_KIT_SERVER_URL}
      data-lk-theme="default"
      style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}
      onDisconnected={() => console.log('Disconnected')}
    >
      <div style={{ flex: 1, position: 'relative' }}>
        <MyVideoConference />
        <RoomAudioRenderer />
      </div>
      <MyCustomControls roomName={roomName} />
    </LiveKitRoom>
  );
}

function MyVideoConference() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: true },
  ]);
  return (
    <GridLayout tracks={tracks}>
      <ParticipantTile />
    </GridLayout>
  );
}
