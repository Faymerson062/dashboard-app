"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const JANELA = 8000;

type Visita = { id: number; visto_em: number };

export function useOnlineHeartbeat(): number {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    let ativo = true;

    supabase
      .from("visitas_ativas")
      .select("id,visto_em")
      .then(({ data }) => {
        if (ativo && data) setVisitas(data as Visita[]);
      });

    const canal = supabase
      .channel("online-visitas")
      .on("postgres_changes", { event: "*", schema: "public", table: "visitas_ativas" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setVisitas((a) => [payload.new as Visita, ...a]);
        } else if (payload.eventType === "UPDATE") {
          const atu = payload.new as Visita;
          setVisitas((a) => a.map((v) => (v.id === atu.id ? atu : v)));
        } else if (payload.eventType === "DELETE") {
          const rem = payload.old as Visita;
          setVisitas((a) => a.filter((v) => v.id !== rem.id));
        }
      })
      .subscribe();

    const iv = setInterval(() => setTick((t) => t + 1), 3000);

    return () => {
      ativo = false;
      clearInterval(iv);
      supabase.removeChannel(canal);
    };
  }, []);

  const agora = Date.now();
  let total = 0;
  for (const v of visitas) {
    if (agora - v.visto_em < JANELA) {
      total++;
    } else if (agora - v.visto_em > 30000) {
      supabase.from("visitas_ativas").delete().eq("id", v.id).then(() => {});
    }
  }
  return total;
}
