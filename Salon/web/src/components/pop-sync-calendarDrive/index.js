import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@clerk/clerk-react";

const MAX_Z = 2147483647;

export default function PopSyncCalendarDrive() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [open, setOpen] = useState(false);

  const storageKey = useMemo(
    () => (userId ? `google_sync_prompt_seen_${userId}` : null),
    [userId]
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId || !storageKey) return;
    const alreadySeen = localStorage.getItem(storageKey);
    if (!alreadySeen) setOpen(true);
  }, [isLoaded, isSignedIn, userId, storageKey]);

  const close = () => {
    if (storageKey) localStorage.setItem(storageKey, "1");
    setOpen(false);
  };

  const connect = () => {
    if (!userId) return;
    if (storageKey) localStorage.setItem(storageKey, "1");

    const clientName = `${firstName} ${lastName}`.trim() || "cliente";
    const url =
      `https://salon.fabrisportalhub.com.br/oauth/google/start` +
      `?userId=${encodeURIComponent(userId)}` +
      `&clientName=${encodeURIComponent(clientName)}` +
      `&returnTo=${encodeURIComponent("/agendamentos")}`;
    window.location.href = url;
  };

  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: MAX_Z,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
          fontFamily: "inherit",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee" }}>
          <h3 style={{ margin: 0, fontSize: 20 }}>Sincronizar com Google</h3>
        </div>

        <div style={{ padding: 20, color: "#333", lineHeight: 1.5 }}>
          Deseja sincronizar seu <strong>Google Agenda</strong> e{" "}
          <strong>Google Drive</strong> com o sistema?
        </div>

        <div
          style={{
            padding: 16,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            borderTop: "1px solid #eee",
          }}
        >
          <button
            onClick={close}
            style={{
              border: "1px solid #ccc",
              background: "#fff",
              padding: "10px 14px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Agora não
          </button>
          <button
            onClick={connect}
            style={{
              border: "none",
              background: "#1976d2",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Sincronizar agora
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}