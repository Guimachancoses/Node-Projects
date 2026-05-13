// src/components/SplashScreen/index.jsx
import { useEffect, useRef, useState } from "react";
import { Box, IconButton, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";

import { animate } from "animejs";
import { useDispatch } from "react-redux";
import { useUser } from "@clerk/clerk-react";

import { checkUser } from "../../store/modules/colaborador/actions";
import splashVideo from "../../assets/splash/video.mp4";

export default function SplashScreen() {
  const dispatch = useDispatch();
  const videoRef = useRef(null);
  const bgVideoRef = useRef(null);
  const checkedEmailRef = useRef("");
  const [muted, setMuted] = useState(false);

  const { isLoaded, isSignedIn, user } = useUser();
  const emailAddress = user?.primaryEmailAddress?.emailAddress
    || user?.emailAddresses?.[0]?.emailAddress
    || "";

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const email = emailAddress.trim();

    if (!email) return;
    if (checkedEmailRef.current === email) return;

    checkedEmailRef.current = email;
    dispatch(checkUser(email));
  }, [dispatch, emailAddress, isLoaded, isSignedIn]);

  useEffect(() => {
    animate("#splash-stage", {
      opacity: [{ from: 0, to: 1 }],
      scale: [{ from: isMobile ? 0.98 : 0.94, to: 1 }],
      duration: 700,
      ease: "easeOutExpo",
    });

    const playMainVideo = async () => {
      if (!videoRef.current) return;

      try {
        videoRef.current.muted = false;
        videoRef.current.volume = 1;
        await videoRef.current.play();
        setMuted(false);
      } catch {
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => { });
        setMuted(true);
      }
    };

    const playBgVideo = async () => {
      if (!bgVideoRef.current) return;

      bgVideoRef.current.muted = true;
      await bgVideoRef.current.play().catch(() => { });
    };

    playMainVideo();
    playBgVideo();
  }, [isMobile]);

  const handleToggleSound = async () => {
    if (!videoRef.current) return;

    const nextMuted = !videoRef.current.muted;

    videoRef.current.muted = nextMuted;
    setMuted(nextMuted);

    if (!nextMuted) {
      try {
        videoRef.current.volume = 1;
        await videoRef.current.play();
      } catch {
        videoRef.current.muted = true;
        setMuted(true);
      }
    }
  };


  return (
    <Box
      sx={{
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        bgcolor: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {!isMobile && (
        <>
          <Box
            component="video"
            ref={bgVideoRef}
            src={splashVideo}
            autoPlay
            muted
            playsInline
            preload="auto"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(28px)",
              transform: "scale(1.18)",
              opacity: 0.42,
              userSelect: "none",
              pointerEvents: "none",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at center, rgba(0,180,190,.18) 0%, rgba(0,0,0,.12) 34%, rgba(0,0,0,.84) 100%)",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,.65) 0%, rgba(0,0,0,.12) 42%, rgba(0,0,0,.72) 100%)",
            }}
          />
        </>
      )}

      {isMobile && (
        <Box
          component="video"
          ref={bgVideoRef}
          src={splashVideo}
          autoPlay
          muted
          playsInline
          preload="auto"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(18px)",
            transform: "scale(1.12)",
            opacity: 0.28,
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      )}

      <Box
        id="splash-stage"
        sx={{
          position: "relative",
          width: isMobile
            ? {
              xs: "86vw",
            }
            : {
              sm: "92vw",
              md: "86vw",
              lg: "78vw",
            },
          height: isMobile ? "76dvh" : "auto",
          maxWidth: isMobile ? "420px" : "1480px",
          maxHeight: isMobile ? "760px" : "none",
          aspectRatio: isMobile ? "9 / 16" : "16 / 9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          opacity: 0,
          borderRadius: isMobile ? "22px" : 0,
          boxShadow: isMobile
            ? "0 0 48px rgba(0,220,240,.22)"
            : "0 0 80px rgba(0,220,240,.22), 0 24px 90px rgba(0,0,0,.65)",
        }}
      >
        <Tooltip title={muted ? "Ativar som" : "Silenciar"}>
          <IconButton
            onClick={handleToggleSound}
            sx={{
              position: "absolute",
              right: { xs: 18, md: 32 },
              bottom: { xs: 18, md: 32 },
              zIndex: 3,
              color: "#fff",
              bgcolor: "rgba(255,255,255,.12)",
              border: "1px solid rgba(255,255,255,.25)",
              backdropFilter: "blur(8px)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,.2)",
              },
            }}
          >
            {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>
        </Tooltip>


        <Box
          component="video"
          ref={videoRef}
          src={splashVideo}
          autoPlay
          muted={muted}
          playsInline
          preload="auto"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: isMobile ? "cover" : "contain",
            objectPosition: "center",
            display: "block",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      </Box>
    </Box>
  );
}
