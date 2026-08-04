"use client";

import { useEffect, useRef } from "react";
import { Users } from "lucide-react";
import type { Log } from "@/lib/logs";
import StatCard from "./StatCard";
import ClientesCard from "./ClientesCard";
import VisitantesCard from "./VisitantesCard";
import { usePresenca } from "@/lib/usePresenca";
import { useOnlineHeartbeat } from "@/lib/useOnlineHeartbeat";

export default function DashboardContent({
  loginsIniciais,
  visitasIniciais,
}: {
  loginsIniciais: Log[];
  visitasIniciais: number;
}) {
  const { emails: emailsOnline } = usePresenca(false);
  const usuariosOnline = useOnlineHeartbeat();
  const anteriorRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const liberadoRef = useRef(false);

  useEffect(() => {
    const audio = new Audio("/online.wav");
    audio.volume = 0.8;
    audioRef.current = audio;

    const liberar = () => {
      if (liberadoRef.current) return;
      audio.muted = true;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
          liberadoRef.current = true;
        })
        .catch(() => {});
    };

    window.addEventListener("click", liberar);
    window.addEventListener("keydown", liberar);
    return () => {
      window.removeEventListener("click", liberar);
      window.removeEventListener("keydown", liberar);
    };
  }, []);

  useEffect(() => {
    const anterior = anteriorRef.current;
    if (anterior !== null && usuariosOnline > anterior && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    anteriorRef.current = usuariosOnline;
  }, [usuariosOnline]);

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
      <section
        className="animate-fade-in-up grid grid-cols-1 gap-3 sm:grid-cols-2"
        style={{ animationDelay: "0.1s" }}
      >
        <VisitantesCard inicial={visitasIniciais} />
        <StatCard
          label="Usuários Online"
          value={String(usuariosOnline)}
          change="Ao vivo"
          positive
          icon={Users}
        />
      </section>

      <section className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <ClientesCard logsIniciais={loginsIniciais} emailsOnline={emailsOnline} />
      </section>
    </main>
  );
}
