import { ImageIcon, Sparkles } from "lucide-react";
import { ImageGenForm } from "./image-gen-form";

const imageGenStyles = `
.soha-imggen{display:flex;flex-direction:column;gap:22px;}
.soha-imggen .ig-rv{opacity:1;}
@media (prefers-reduced-motion:no-preference){
  .soha-imggen .ig-rv{animation:ig-rv .55s var(--ease) both;}
  @keyframes ig-rv{from{transform:translateY(14px);}to{transform:none;}}
}

/* ---------- hero ---------- */
.soha-imggen .ig-hero{display:grid;grid-template-columns:1.5fr .9fr;gap:26px;align-items:center;
  background:var(--surface);border:2px solid var(--border);border-radius:var(--r-xl);
  box-shadow:var(--sh-paper);padding:clamp(22px,3vw,34px);}
.soha-imggen .ig-kicker{display:inline-flex;align-items:center;gap:9px;font-size:12px;font-weight:800;
  letter-spacing:.16em;text-transform:uppercase;color:var(--accent);}
.soha-imggen .ig-kicker svg{width:16px;height:16px;}
.soha-imggen .ig-h1{font-family:var(--font-head);font-weight:800;font-size:clamp(26px,3vw,40px);
  line-height:1.08;color:var(--primary);margin:14px 0 10px;text-wrap:balance;}
.soha-imggen .ig-sub{font-size:15.5px;line-height:1.6;color:var(--muted);max-width:54ch;}
.soha-imggen .ig-flowmini{background:var(--bg-soft);border:2px solid var(--border);border-radius:var(--r-lg);
  padding:18px;display:flex;flex-direction:column;gap:13px;}
.soha-imggen .ig-flowmini-h{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:13px;color:var(--primary);}
.soha-imggen .ig-flowmini-h svg{width:16px;height:16px;color:var(--accent);}
.soha-imggen .ig-flowmini-row{display:flex;gap:11px;align-items:flex-start;}
.soha-imggen .ig-num{flex:none;width:22px;height:22px;border-radius:50%;background:var(--yellow);border:2px solid var(--ink);
  display:grid;place-items:center;font-size:12px;font-weight:800;color:var(--ink);}
.soha-imggen .ig-flowmini-row p{font-size:13.5px;line-height:1.5;color:var(--text);}

/* ---------- work grid ---------- */
.soha-imggen .ig-grid{display:grid;grid-template-columns:minmax(0,1.15fr) 360px;gap:22px;align-items:start;}
.soha-imggen .ig-aside{position:sticky;top:18px;display:flex;flex-direction:column;gap:16px;}

/* cards */
.soha-imggen .ig-card{background:var(--surface);border:2px solid var(--border);border-radius:var(--r-xl);
  box-shadow:var(--sh-paper);padding:clamp(20px,2.6vw,30px);display:flex;flex-direction:column;gap:18px;}
.soha-imggen .ig-stage-pill{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;font-weight:800;
  letter-spacing:.04em;text-transform:uppercase;color:var(--primary);background:var(--primary-soft);
  border:1.5px solid #A9CBE0;border-radius:var(--r-pill);padding:5px 12px;width:fit-content;}
.soha-imggen .ig-stage-pill svg{width:14px;height:14px;}
.soha-imggen .ig-card-title{font-family:var(--font-head);font-weight:800;font-size:clamp(20px,2.2vw,26px);
  color:var(--text);line-height:1.12;}
.soha-imggen .ig-card-desc{font-size:14.5px;line-height:1.55;color:var(--muted);max-width:60ch;}

/* fields */
.soha-imggen .ig-field{display:flex;flex-direction:column;gap:9px;}
.soha-imggen .ig-label{font-weight:800;font-size:13.5px;color:var(--text);}
.soha-imggen .ig-textarea{width:100%;min-height:176px;resize:vertical;background:var(--surface);
  border:2px solid var(--border);border-radius:var(--r-lg);padding:14px 16px;font-family:var(--font-body);
  font-size:15px;line-height:1.6;color:var(--text);transition:border-color .15s,box-shadow .15s;}
.soha-imggen .ig-textarea::placeholder{color:var(--muted);opacity:.75;}
.soha-imggen .ig-textarea:focus-visible{outline:none;border-color:var(--info);box-shadow:0 0 0 4px var(--info-soft);}
.soha-imggen .ig-select{appearance:none;-webkit-appearance:none;width:100%;height:48px;
  background:var(--surface) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236D6659' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 14px center;background-size:18px;
  border:2px solid var(--border);border-radius:var(--r-md);padding:0 42px 0 15px;font-family:var(--font-body);
  font-weight:600;font-size:14.5px;color:var(--text);cursor:pointer;transition:border-color .15s,box-shadow .15s;}
.soha-imggen .ig-select:focus-visible{outline:none;border-color:var(--info);box-shadow:0 0 0 4px var(--info-soft);}
.soha-imggen .ig-textarea:disabled,.soha-imggen .ig-select:disabled{opacity:.6;cursor:not-allowed;}
.soha-imggen .ig-hint{font-size:12.5px;line-height:1.5;color:var(--muted);}
.soha-imggen .ig-row{display:grid;grid-template-columns:minmax(0,1fr) 172px;gap:16px;}

/* error alert */
.soha-imggen .ig-alert{display:flex;gap:12px;align-items:flex-start;background:var(--error-soft);
  border:2px solid #E0A59E;border-radius:var(--r-md);padding:13px 15px;box-shadow:var(--sh-paper-sm);}
.soha-imggen .ig-alert svg{flex:none;width:20px;height:20px;color:var(--error);margin-top:1px;}
.soha-imggen .ig-alert .at{font-weight:800;font-size:14px;color:#8E2C24;}
.soha-imggen .ig-alert .ad{font-size:13.5px;color:#8E2C24;opacity:.85;margin-top:2px;line-height:1.45;}

/* processing row */
.soha-imggen .ig-proc{display:flex;align-items:center;gap:10px;background:var(--primary-soft);
  border:2px solid #A9CBE0;border-radius:var(--r-md);padding:13px 15px;font-size:13.5px;font-weight:600;color:var(--primary);}
.soha-imggen .ig-proc svg{flex:none;width:18px;height:18px;}

/* submit button */
.soha-imggen .ig-pill{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:fit-content;
  font-family:var(--font-body);font-weight:800;font-size:14.5px;border-radius:var(--r-pill);padding:12px 24px;
  border:2px solid var(--ink);background:var(--yellow);color:var(--ink);cursor:pointer;box-shadow:var(--sh-press);
  transition:transform .12s var(--ease),box-shadow .12s;}
.soha-imggen .ig-pill svg{width:17px;height:17px;}
.soha-imggen .ig-pill:hover{transform:translate(-1px,-1px);box-shadow:4px 5px 0 var(--ink);}
.soha-imggen .ig-pill:active{transform:translate(3px,4px);box-shadow:none;}
.soha-imggen .ig-pill:disabled{cursor:wait;opacity:.75;transform:none;box-shadow:var(--sh-press);}
.soha-imggen .ig-spin{animation:ig-spin 1s linear infinite;}
@keyframes ig-spin{to{transform:rotate(360deg);}}

/* result side-card */
.soha-imggen .ig-result{position:relative;overflow:hidden;background:var(--surface);border:2px solid var(--border);
  border-radius:var(--r-xl);box-shadow:var(--sh-paper);padding:clamp(20px,2.6vw,28px);display:flex;flex-direction:column;gap:16px;}
.soha-imggen .ig-result-head{display:flex;flex-direction:column;gap:9px;}
.soha-imggen .ig-result-title{font-family:var(--font-head);font-weight:800;font-size:18px;line-height:1.25;color:var(--text);}
.soha-imggen .ig-result-desc{font-size:13px;line-height:1.55;color:var(--muted);}
.soha-imggen .ig-imgs{display:flex;flex-direction:column;gap:14px;}
.soha-imggen .ig-imgwrap{border:2px solid var(--border);border-radius:var(--r-lg);overflow:hidden;background:var(--surface-alt);box-shadow:var(--sh-paper-sm);}
.soha-imggen .ig-imgwrap img{display:block;width:100%;height:auto;}
.soha-imggen .ig-imglink{display:inline-flex;align-items:center;gap:7px;width:100%;padding:11px 14px;
  font-weight:800;font-size:13px;color:var(--primary);text-decoration:none;border-top:2px solid var(--border);background:var(--surface);}
.soha-imggen .ig-imglink:hover{background:var(--surface-alt);text-decoration:underline;}
.soha-imggen .ig-imglink svg{width:15px;height:15px;}
.soha-imggen .ig-empty{position:relative;border:2px dashed var(--border);border-radius:var(--r-lg);background:var(--bg-soft);
  padding:26px 20px 20px;text-align:center;overflow:hidden;min-height:208px;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:8px;}
.soha-imggen .ig-empty p{font-size:13.5px;line-height:1.55;color:var(--muted);max-width:34ch;}
.soha-imggen .ig-fox{width:120px;height:auto;filter:drop-shadow(4px 6px 0 rgba(34,34,34,.12));margin-bottom:4px;}

/* responsive */
@media (max-width:1080px){
  .soha-imggen .ig-grid{grid-template-columns:1fr;}
  .soha-imggen .ig-aside{position:static;}
}
@media (max-width:820px){
  .soha-imggen .ig-hero{grid-template-columns:1fr;}
}
@media (max-width:520px){
  .soha-imggen .ig-row{grid-template-columns:1fr;}
}
@media (prefers-reduced-motion:reduce){
  .soha-imggen *{transition:none !important;animation:none !important;}
  .soha-imggen .ig-pill:hover{transform:none;}
}
`;

export default function ImageGenPage() {
  return (
    <section className="soha-imggen">
      <style>{imageGenStyles}</style>

      <div className="ig-hero ig-rv">
        <div>
          <span className="ig-kicker">
            <ImageIcon /> AI image studio
          </span>
          <h1 className="ig-h1">Tạo ảnh bằng AI</h1>
          <p className="ig-sub">
            Nhập mô tả, chọn tỉ lệ khung hình và lưu ảnh đã tạo vào storage công khai.
          </p>
        </div>

        <div className="ig-flowmini">
          <span className="ig-flowmini-h">
            <Sparkles /> Flow
          </span>
          <div className="ig-flowmini-row">
            <span className="ig-num">1</span>
            <p>Viết prompt rõ về bối cảnh, phong cách và chi tiết ảnh.</p>
          </div>
          <div className="ig-flowmini-row">
            <span className="ig-num">2</span>
            <p>Chọn tỉ lệ phù hợp rồi tạo ảnh để nhận URL đã lưu.</p>
          </div>
        </div>
      </div>

      <ImageGenForm />
    </section>
  );
}
