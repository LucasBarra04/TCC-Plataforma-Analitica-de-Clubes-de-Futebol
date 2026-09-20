import type { ReactNode } from "react";
import { SeletorClube } from "./SeletorClube";
import type { Clube } from "../lib/types";
import "./PageHeader.css";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  meta?: string;
  clube?: Clube;
  onClubeChange?: (clube: Clube) => void;
  extra?: ReactNode;
}

export function PageHeader({ eyebrow, title, meta, clube, onClubeChange, extra }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header__texto">
        {eyebrow && <span className="page-header__eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {meta && <span className="page-header__meta">{meta}</span>}
      </div>
      <div className="page-header__controles">
        {extra}
        {clube && onClubeChange && <SeletorClube value={clube} onChange={onClubeChange} />}
      </div>
    </div>
  );
}
