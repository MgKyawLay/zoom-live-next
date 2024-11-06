"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import ZoomVideo, {
  type VideoClient,
  VideoQuality,
  type VideoPlayer,
} from "@zoom/videosdk";
import { CameraButton, MicButton } from "./MuteButtons";
import { PhoneOff } from "lucide-react";
import { Button } from "./ui/button";
import MessageBox from "./MessageBox";

const Videocall = (props: { slug: string; JWT: string }) => {
  const session = props.slug;
  const jwt = props.JWT;
  const [inSession, setInSession] = useState(false);
  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const [screenShare, setScreenShare] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState(
    !client.current.getCurrentUserInfo()?.bVideoOn
  );
  const [isAudioMuted, setIsAudioMuted] = useState(
    client.current.getCurrentUserInfo()?.muted ?? true
  );
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    client.current.on("passively-stop-share", (payload) => {
      const stream = client.current.getMediaStream();
      stream.stopShareScreen().then(() => {
        setScreenShare(false);
      });
    });

    return () => {
      client.current.off("passively-stop-share", (payload) => {
        const stream = client.current.getMediaStream();
        stream.stopShareScreen().then(() => {
          setScreenShare(false);
        });
      });
    };
  }, [client]);

  const joinSession = async () => {
    await client.current.init("en-US", "Global", { patchJsMedia: true });
    client.current.on(
      "peer-video-state-change",
      (payload) => void renderVideo(payload)
    );
    await client.current.join(session, jwt, userName).catch((e) => {
      console.log(e);
    });
    setInSession(true);
    const mediaStream = client.current.getMediaStream();
    await mediaStream.startAudio();
    setIsAudioMuted(mediaStream.isAudioMuted());
    // await mediaStream.startVideo();
    setIsVideoMuted(!mediaStream.isCapturingVideo());
    await renderVideo({
      action: "Start",
      userId: client.current.getCurrentUserInfo().userId,
    });
  };

  const handleShare = async () => {
    const stream = client.current.getMediaStream();
    const shareScreen = document.getElementById("screenShareContainer");
    if (!screenShare) {
      try {
        if (stream.isStartShareScreenWithVideoElement()) {
          // Start screen share with the video element
          //@ts-ignore
          await stream.startShareScreen(shareScreen);
          setScreenShare(true);
        } else {
          console.error("Screen sharing with video element is not supported.");
        }
      } catch (error) {
        console.error("Error starting screen share:", error);
        setScreenShare(false);
      }
    } else {
      await stream.stopShareScreen();
      setScreenShare(false);
    }
  };

  const renderVideo = async (event: {
    action: "Start" | "Stop";
    userId: number;
  }) => {
    const mediaStream = client.current.getMediaStream();
    if (event.action === "Stop") {
      const element = await mediaStream.detachVideo(event.userId);
      Array.isArray(element)
        ? element.forEach((el) => el.remove())
        : element.remove();
    } else {
      const userVideo = await mediaStream.attachVideo(
        event.userId,
        VideoQuality.Video_360P
      );
      videoContainerRef.current!.appendChild(userVideo as VideoPlayer);
    }
  };

  const leaveSession = async () => {
    client.current.off(
      "peer-video-state-change",
      (payload: { action: "Start" | "Stop"; userId: number }) =>
        void renderVideo(payload)
    );
    await client.current.leave().catch((e) => console.log("leave error", e));
    // hard refresh to clear the state
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen w-screen">
      <MessageBox client={client} isInSession={inSession} />
      <div className="flex flex-col w-3/4 h-full">
        <h1 className="text-center text-3xl font-bold mb-4 mt-0">
          Parabyte Learning Media
        </h1>
        <div
          className="flex w-full flex-1"
          style={inSession ? {} : { display: "none" }}
        >
          {/* @ts-expect-error html component */}
          <video-player-container ref={videoContainerRef} style={!screenShare ? videoPlayerStyle : videoPlayerStyleWithShare} />
          <video
            id="screenShareContainer"
            style={{
              ...screenSharePlayerContainer,
              display: screenShare ? "block" : "none",
            }}
          />
        </div>
        {!inSession ? (
          <div className="mx-auto flex w-64 flex-col self-center">
            <div className="w-4" />
            <Button
              className="flex flex-1"
              onClick={joinSession}
              title="join session"
            >
              Join
            </Button>
          </div>
        ) : (
          <div className="flex w-full flex-col justify-around self-center">
            <div className="mt-4 flex w-[30rem] flex-1 justify-around self-center rounded-md bg-white p-4">
              <CameraButton
                client={client}
                isVideoMuted={isVideoMuted}
                setIsVideoMuted={setIsVideoMuted}
                renderVideo={renderVideo}
              />
              <MicButton
                isAudioMuted={isAudioMuted}
                client={client}
                setIsAudioMuted={setIsAudioMuted}
              />

              <Button onClick={handleShare}>
                <div>{!screenShare ? "Share" : "Stop Share"}</div>
              </Button>
              <Button onClick={leaveSession} title="leave session">
                <PhoneOff />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Videocall;

const videoPlayerStyle = {
  height: "75vh",
  marginTop: "1.5rem",
  marginLeft: "3rem",
  marginRight: "3rem",
  alignContent: "center",
  borderRadius: "10px",
  overflow: "hidden",
  backgroundColor: "black",
} as CSSProperties;

const videoPlayerStyleWithShare = {
  height: "20vh",
  width: "20vw",
  marginTop: "1.5rem",
  marginLeft: "3rem",
  // marginRight: "3rem",
  alignContent: "center",
  borderRadius: "10px",
  overflow: "hidden",
  backgroundColor: "black",
} as CSSProperties;

const screenSharePlayerContainer = {
  height: "75vh",
  marginTop: "1.5rem",
  marginLeft: "3rem",
  marginRight: "3rem",
  alignContent: "center",
  borderRadius: "10px",
  overflow: "hidden",
  backgroundColor: "skyblue",
} as CSSProperties;

const userName = `User-${new Date().getTime().toString().slice(8)}`;
