import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CLUBES, type Clube } from "./types";

interface ClubeAtivoContextValue {
  clubeAtivo: Clube;
  setClubeAtivo: (clube: Clube) => void;
}

const ClubeAtivoContext = createContext<ClubeAtivoContextValue | null>(null);

export function ClubeAtivoProvider({ children }: { children: ReactNode }) {
  const [clubeAtivo, setClubeAtivo] = useState<Clube>("flamengo");
  return <ClubeAtivoContext.Provider value={{ clubeAtivo, setClubeAtivo }}>{children}</ClubeAtivoContext.Provider>;
}

export function useClubeAtivo() {
  const ctx = useContext(ClubeAtivoContext);
  if (!ctx) throw new Error("useClubeAtivo precisa estar dentro de <ClubeAtivoProvider>");
  return ctx;
}

export function useClubeParam(): [Clube, (clube: Clube) => void] {
  const { clube } = useParams<{ clube: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { setClubeAtivo } = useClubeAtivo();

  const clubeValido = (CLUBES.some((c) => c.valor === clube) ? clube : "flamengo") as Clube;

  useEffect(() => {
    setClubeAtivo(clubeValido);
  }, [clubeValido, setClubeAtivo]);

  function trocarClube(novoClube: Clube) {
    navigate(location.pathname.replace(`/${clubeValido}`, `/${novoClube}`));
  }

  return [clubeValido, trocarClube];
}

