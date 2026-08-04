"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const CANAL = "presenca-global";

type Resultado = {
  online: number;
  emails: Set<string>;
};

export function usePresenca(rastrear: boolean, email?: string): Resultado {
  const [online, setOnline] = useState(0);
  const [emails, setEmails] = useState<Set<string>>(new Set());
  const canalRef = useRef<RealtimeChannel | null>(null);
  const inscritoRef = useRef(false);
  const emailRef = useRef<string | undefined>(email);
  emailRef.current = email;

  useEffect(() => {
    const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const channel = supabase.channel(CANAL, {
      config: { presence: { key: id } },
    });
    canalRef.current = channel;

    const trackAtual = () => {
      const e = emailRef.current;
      channel.track({ online_at: new Date().toISOString(), email: e && e.trim() ? e.trim() : null });
    };

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const chaves = Object.keys(state);
        const setEmailsOnline = new Set<string>();
        for (const k of chaves) {
          for (const p of state[k] as Array<{ email?: string }>) {
            if (p.email) setEmailsOnline.add(p.email.trim().toLowerCase());
          }
        }
        setOnline(chaves.length);
        setEmails(setEmailsOnline);
      })
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        inscritoRef.current = true;
        if (rastrear) trackAtual();
      });

    let heartbeat: ReturnType<typeof setInterval> | null = null;
    const aoFocar = () => {
      if (rastrear && inscritoRef.current && document.visibilityState === "visible") trackAtual();
    };
    if (rastrear) {
      heartbeat = setInterval(() => {
        if (inscritoRef.current) trackAtual();
      }, 4000);
      document.addEventListener("visibilitychange", aoFocar);
      window.addEventListener("focus", aoFocar);
    }

    return () => {
      inscritoRef.current = false;
      if (heartbeat) clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", aoFocar);
      window.removeEventListener("focus", aoFocar);
      supabase.removeChannel(channel);
      canalRef.current = null;
    };
  }, [rastrear]);

  useEffect(() => {
    if (!rastrear || !inscritoRef.current || !canalRef.current) return;
    const e = email && email.trim() ? email.trim() : null;
    canalRef.current.track({ online_at: new Date().toISOString(), email: e });
  }, [email, rastrear]);

  return { online, emails };
}
