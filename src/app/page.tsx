'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from "./components/TopNav";
import DashboardContent from "./components/DashboardContent";

export default function Home() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [logins, setLogins] = useState([]);
  const [visitas, setVisitas] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem('dashboard_auth');
    if (!auth) {
      router.push('/login');
      return;
    }

    setIsAuthed(true);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/dashboard-data');
      const data = await response.json();
      setLogins(data.logins || []);
      setVisitas(data.visitas || 0);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthed || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <DashboardContent loginsIniciais={logins} visitasIniciais={visitas} />
    </div>
  );
}
