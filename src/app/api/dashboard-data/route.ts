import { getLogins, contarVisitas } from "@/lib/logs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [logins, visitas] = await Promise.all([
      getLogins(),
      contarVisitas(),
    ]);

    return NextResponse.json({
      logins,
      visitas,
    });
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados" },
      { status: 500 }
    );
  }
}
