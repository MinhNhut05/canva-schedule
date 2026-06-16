"use client";

import { useState } from "react";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  display: "swap",
  variable: "--font-playfair",
});

type Mode = "both" | "aurora" | "blueprint";

const styles = `
.ffcompare{
  --navy:#1C3F60; --sky:#5DA9D6; --accent:#5FB8FF; --cyan:#86ecff;
  --ink:#EAF3FF; --muted:#9FB6D2; --faint:#6E86A6;
  --ease:cubic-bezier(.16,1,.3,1);
  --font-head:var(--font-playfair),Georgia,serif;
  --font-body:var(--font-inter),system-ui,sans-serif;
  height:100vh;display:flex;flex-direction:column;overflow:hidden;
  font-family:var(--font-body);color:var(--ink);-webkit-font-smoothing:antialiased;
}
.ffcompare *{box-sizing:border-box;margin:0;padding:0;}
.ffcompare .field{position:fixed;inset:0;z-index:0;pointer-events:none;
  background:
   radial-gradient(110% 80% at 80% -10%, rgba(95,184,255,.18), transparent 55%),
   radial-gradient(90% 70% at 6% 110%, rgba(28,63,96,.5), transparent 60%),
   linear-gradient(160deg,#0b1d33,#060d1a 70%);}

/* topbar */
.ffcompare .bar{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;
  gap:18px;padding:16px clamp(18px,3vw,34px);border-bottom:1px solid rgba(170,205,245,.12);
  background:rgba(8,15,26,.6);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);flex-wrap:wrap;}
.ffcompare .bar .lead{display:flex;align-items:center;gap:14px;min-width:0;}
.ffcompare .bar img{width:38px;height:38px;object-fit:contain;}
.ffcompare .bar .tt{display:flex;flex-direction:column;line-height:1.1;}
.ffcompare .bar .tt b{font-family:var(--font-head);font-size:18px;font-weight:800;}
.ffcompare .bar .tt span{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--muted);}
.ffcompare .seg{display:flex;gap:6px;padding:5px;border-radius:999px;background:rgba(146,184,230,.08);
  border:1px solid rgba(170,205,245,.16);}
.ffcompare .seg button{font-family:var(--font-body);font-weight:700;font-size:13.5px;color:var(--muted);
  padding:9px 18px;border-radius:999px;border:none;background:none;cursor:pointer;transition:.2s var(--ease);white-space:nowrap;}
.ffcompare .seg button:hover{color:var(--ink);}
.ffcompare .seg button.on{color:#04243f;background:linear-gradient(120deg,var(--cyan),var(--accent));
  box-shadow:0 8px 22px -8px var(--accent);}
.ffcompare .hint{font-size:12.5px;color:var(--faint);}

/* stage */
.ffcompare .stage{position:relative;z-index:2;flex:1;min-height:0;display:flex;gap:14px;padding:14px clamp(14px,2.4vw,26px) 18px;}
.ffcompare .pane{flex:1;min-width:0;display:flex;flex-direction:column;border-radius:18px;overflow:hidden;
  border:1px solid rgba(170,205,245,.16);background:rgba(146,184,230,.05);
  box-shadow:0 30px 70px -28px rgba(0,0,0,.8);transition:flex .4s var(--ease),opacity .3s;}
.ffcompare .pane.hide{display:none;}
.ffcompare .pane-head{display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:11px 16px;border-bottom:1px solid rgba(170,205,245,.12);background:rgba(8,15,26,.5);}
.ffcompare .pane-head .nm{display:flex;align-items:baseline;gap:10px;min-width:0;}
.ffcompare .pane-head .nm b{font-family:var(--font-head);font-size:16px;font-weight:800;white-space:nowrap;}
.ffcompare .pane-head .nm i{font-style:normal;font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ffcompare .pane-head a{font-size:12px;font-weight:700;color:var(--accent);text-decoration:none;display:inline-flex;align-items:center;gap:6px;
  padding:6px 13px;border-radius:999px;border:1px solid rgba(95,184,255,.35);background:rgba(95,184,255,.08);transition:.2s var(--ease);}
.ffcompare .pane-head a:hover{background:rgba(95,184,255,.18);}
.ffcompare .pane-head a svg{width:13px;height:13px;}
.ffcompare .frame-wrap{position:relative;flex:1;min-height:0;background:#060d1a;}
.ffcompare iframe{position:absolute;inset:0;width:100%;height:100%;border:none;display:block;}

@media (max-width:860px){
  .ffcompare{height:auto;overflow:visible;}
  .ffcompare .stage{flex-direction:column;}
  .ffcompare .pane{height:78vh;}
  .ffcompare .hint{display:none;}
}
`;

export default function ComparePage() {
  const [mode, setMode] = useState<Mode>("both");

  return (
    <div className={`ffcompare ${playfair.variable}`}>
      <style>{styles}</style>
      <div className="field" aria-hidden="true" />

      <header className="bar">
        <div className="lead">
          <Image src="/front-flow/soha-logo.png" alt="SileTravel" width={38} height={38} priority />
          <span className="tt">
            <b>Front Flow</b>
            <span>Hai hướng · Futuristic blue</span>
          </span>
        </div>
        <div className="seg">
          <button type="button" className={mode === "both" ? "on" : ""} onClick={() => setMode("both")}>
            Song song
          </button>
          <button type="button" className={mode === "aurora" ? "on" : ""} onClick={() => setMode("aurora")}>
            Aurora
          </button>
          <button type="button" className={mode === "blueprint" ? "on" : ""} onClick={() => setMode("blueprint")}>
            Blueprint
          </button>
        </div>
        <div className="hint">So sánh hai hướng thiết kế — chọn chế độ xem ở trên</div>
      </header>

      <main className="stage">
        <section className={`pane${mode === "blueprint" ? " hide" : ""}`}>
          <div className="pane-head">
            <span className="nm">
              <b>A · Aurora</b>
              <i>Dark cinematic glass</i>
            </span>
            <a href="/front-flow/aurora" target="_blank" rel="noopener">
              Mở full
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </a>
          </div>
          <div className="frame-wrap">
            <iframe src="/front-flow/aurora" title="Aurora" loading="lazy" />
          </div>
        </section>

        <section className={`pane${mode === "aurora" ? " hide" : ""}`}>
          <div className="pane-head">
            <span className="nm">
              <b>B · Blueprint</b>
              <i>Light structured glass</i>
            </span>
            <a href="/" target="_blank" rel="noopener">
              Mở full
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </a>
          </div>
          <div className="frame-wrap">
            <iframe src="/" title="Blueprint" loading="lazy" />
          </div>
        </section>
      </main>
    </div>
  );
}
