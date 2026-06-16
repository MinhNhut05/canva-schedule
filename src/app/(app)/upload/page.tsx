import { Route, Sparkles } from "lucide-react";
import { UploadForm } from "./upload-form";

const uploadStyles = `
.soha-upload{display:flex;flex-direction:column;gap:22px;}
.soha-upload .up-rv{opacity:1;}
@media (prefers-reduced-motion:no-preference){
  .soha-upload .up-rv{animation:up-rv .55s var(--ease) both;}
  .soha-upload .up-rv-2{animation-delay:.06s;}
  .soha-upload .up-rv-3{animation-delay:.12s;}
  @keyframes up-rv{from{transform:translateY(14px);}to{transform:none;}}
}

/* ---------- hero ---------- */
.soha-upload .up-hero{display:grid;grid-template-columns:1.5fr .9fr;gap:26px;align-items:center;
  background:var(--surface);border:2px solid var(--border);border-radius:var(--r-xl);
  box-shadow:var(--sh-paper);padding:clamp(22px,3vw,34px);}
.soha-upload .up-kicker{display:inline-flex;align-items:center;gap:9px;font-size:12px;font-weight:800;
  letter-spacing:.16em;text-transform:uppercase;color:var(--accent);}
.soha-upload .up-kicker svg{width:16px;height:16px;}
.soha-upload .up-h1{font-family:var(--font-head);font-weight:800;font-size:clamp(26px,3vw,40px);
  line-height:1.08;color:var(--primary);margin:14px 0 10px;text-wrap:balance;}
.soha-upload .up-sub{font-size:15.5px;line-height:1.6;color:var(--muted);max-width:54ch;}
.soha-upload .up-flowmini{background:var(--bg-soft);border:2px solid var(--border);border-radius:var(--r-lg);
  padding:18px;display:flex;flex-direction:column;gap:13px;}
.soha-upload .up-flowmini-h{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:13px;color:var(--primary);}
.soha-upload .up-flowmini-h svg{width:16px;height:16px;color:var(--accent);}
.soha-upload .up-flowmini-row{display:flex;gap:11px;align-items:flex-start;}
.soha-upload .up-num{flex:none;width:22px;height:22px;border-radius:50%;background:var(--yellow);border:2px solid var(--ink);
  display:grid;place-items:center;font-size:12px;font-weight:800;color:var(--ink);}
.soha-upload .up-flowmini-row p{font-size:13.5px;line-height:1.5;color:var(--text);}

/* ---------- stepper card ---------- */
.soha-upload .up-stepper-card{background:var(--surface);border:2px solid var(--border);border-radius:var(--r-xl);
  box-shadow:var(--sh-paper);padding:clamp(18px,2.4vw,26px) clamp(14px,2.4vw,28px);overflow-x:auto;}
.soha-upload .up-stepper{display:flex;align-items:flex-start;min-width:520px;width:100%;}
.soha-upload .up-step{display:flex;flex-direction:column;align-items:center;gap:9px;flex:none;text-align:center;}
.soha-upload .up-step-dot{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;
  font-weight:800;font-size:15px;border:2px solid var(--border);background:var(--surface-alt);color:var(--muted);
  transition:.2s var(--ease);}
.soha-upload .up-step.done .up-step-dot{background:var(--success-soft);border-color:var(--success);color:var(--success);}
.soha-upload .up-step.active .up-step-dot{background:var(--yellow);border-color:var(--ink);color:var(--ink);box-shadow:var(--sh-paper-sm);}
.soha-upload .up-step.error .up-step-dot{background:var(--error-soft);border-color:var(--error);color:var(--error);}
.soha-upload .up-step-lbl{font-size:12.5px;font-weight:700;color:var(--muted);white-space:nowrap;}
.soha-upload .up-step.active .up-step-lbl{color:var(--primary);font-weight:800;}
.soha-upload .up-step.done .up-step-lbl{color:var(--success);}
.soha-upload .up-step.error .up-step-lbl{color:var(--error);}
.soha-upload .up-step-conn{flex:1;height:3px;border-radius:3px;background:var(--border);margin:19px 8px 0;min-width:18px;}
.soha-upload .up-step-conn.done{background:var(--success);}
.soha-upload .up-spin{animation:up-spin 1s linear infinite;}
@keyframes up-spin{to{transform:rotate(360deg);}}

/* ---------- work grid ---------- */
.soha-upload .up-grid{display:grid;grid-template-columns:minmax(0,1fr) 332px;gap:22px;align-items:start;}
.soha-upload .up-aside{position:sticky;top:18px;display:flex;flex-direction:column;gap:16px;}

/* main cards shared bits */
.soha-upload .up-card{background:var(--surface);border:2px solid var(--border);border-radius:var(--r-xl);
  box-shadow:var(--sh-paper);padding:clamp(20px,2.6vw,30px);display:flex;flex-direction:column;gap:18px;}
.soha-upload .up-stage{display:flex;align-items:center;gap:11px;flex-wrap:wrap;}
.soha-upload .up-stage-pill{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;font-weight:800;
  letter-spacing:.04em;text-transform:uppercase;color:var(--primary);background:var(--primary-soft);
  border:1.5px solid #A9CBE0;border-radius:var(--r-pill);padding:5px 12px;}
.soha-upload .up-stage-pill.green{background:var(--success-soft);border-color:var(--success);color:var(--success);}
.soha-upload .up-stage-cap{font-size:13px;color:var(--muted);font-weight:600;}
.soha-upload .up-card-title{font-family:var(--font-head);font-weight:800;font-size:clamp(20px,2.2vw,26px);
  color:var(--text);line-height:1.12;}
.soha-upload .up-card-desc{font-size:14.5px;line-height:1.55;color:var(--muted);max-width:60ch;}

/* error alert */
.soha-upload .up-alert{display:flex;gap:12px;align-items:flex-start;background:var(--error-soft);
  border:2px solid #E0A59E;border-radius:var(--r-md);padding:13px 15px;box-shadow:var(--sh-paper-sm);}
.soha-upload .up-alert.shake{animation:up-shake .4s var(--ease);}
.soha-upload .up-alert svg{flex:none;width:20px;height:20px;color:var(--error);margin-top:1px;}
.soha-upload .up-alert .at{font-weight:800;font-size:14px;color:#8E2C24;}
.soha-upload .up-alert .ad{font-size:13.5px;color:#8E2C24;opacity:.85;margin-top:2px;line-height:1.45;}
@keyframes up-shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-6px);}40%{transform:translateX(6px);}60%{transform:translateX(-4px);}80%{transform:translateX(4px);}}

/* dropzone */
.soha-upload .up-drop{position:relative;border:2.5px dashed var(--border);background:var(--bg-soft);
  border-radius:var(--r-lg);padding:34px 26px 28px;display:flex;flex-direction:column;align-items:center;
  text-align:center;gap:8px;cursor:pointer;overflow:hidden;
  transition:transform .2s var(--ease),border-color .2s,background .2s,box-shadow .2s;}
.soha-upload .up-drop:hover{border-color:var(--slate);}
.soha-upload .up-drop:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft);}
.soha-upload .up-drop.drag{border-style:solid;border-color:var(--info);background:var(--info-soft);
  transform:translateY(-3px);box-shadow:var(--sh-paper);}
.soha-upload .up-drop.disabled{opacity:.6;pointer-events:none;}
.soha-upload .up-drop-icon{width:58px;height:58px;border-radius:16px;background:var(--yellow);border:2px solid var(--ink);
  box-shadow:var(--sh-paper-sm);display:grid;place-items:center;color:var(--ink);margin-bottom:6px;}
.soha-upload .up-drop-icon svg{width:28px;height:28px;}
.soha-upload .up-drop-title{font-family:var(--font-head);font-weight:800;font-size:21px;color:var(--text);}
.soha-upload .up-drop-text{font-size:14px;color:var(--muted);max-width:44ch;line-height:1.5;}
.soha-upload .up-drop-support{font-size:12.5px;font-weight:600;color:var(--slate);}
.soha-upload .up-drop-mascot{position:absolute;right:-8px;bottom:-8px;width:118px;height:auto;pointer-events:none;
  filter:drop-shadow(4px 6px 0 rgba(34,34,34,.12));}
.soha-upload .up-flag{position:absolute;top:12px;left:50%;transform:translateX(-50%) rotate(-3deg);
  font-family:var(--font-hand);font-size:23px;font-weight:700;color:var(--ink);background:var(--yellow);
  border:2px solid var(--ink);padding:2px 15px;border-radius:var(--r-pill);box-shadow:var(--sh-paper-sm);z-index:2;}

/* pills / buttons */
.soha-upload .up-pill{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-body);font-weight:800;
  font-size:14.5px;border-radius:var(--r-pill);padding:11px 22px;border:2px solid var(--ink);background:var(--yellow);
  color:var(--ink);cursor:pointer;box-shadow:var(--sh-press);transition:transform .12s var(--ease),box-shadow .12s;}
.soha-upload .up-pill svg{width:17px;height:17px;}
.soha-upload .up-pill:hover{transform:translate(-1px,-1px);box-shadow:4px 5px 0 var(--ink);}
.soha-upload .up-pill:active{transform:translate(3px,4px);box-shadow:none;}
.soha-upload .up-pill:disabled{cursor:wait;opacity:.75;transform:none;box-shadow:var(--sh-press);}
.soha-upload .up-ghost{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-body);font-weight:800;
  font-size:14px;border-radius:var(--r-pill);padding:11px 18px;border:2px solid var(--ink);background:var(--surface);
  color:var(--ink);cursor:pointer;box-shadow:var(--sh-paper-sm);transition:transform .12s var(--ease),box-shadow .12s;}
.soha-upload .up-ghost svg{width:16px;height:16px;}
.soha-upload .up-ghost:hover{transform:translate(-1px,-1px);box-shadow:3px 4px 0 var(--ink);}
.soha-upload .up-ghost:active{transform:translate(2px,3px);box-shadow:none;}
.soha-upload .up-ghost:disabled{opacity:.55;cursor:not-allowed;transform:none;box-shadow:var(--sh-paper-sm);}
.soha-upload .up-actions{display:flex;gap:12px;flex-wrap:wrap;}

/* selected-file card */
.soha-upload .up-file-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap;}
.soha-upload .up-badge{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:800;
  border-radius:var(--r-pill);padding:6px 13px;border:2px solid;white-space:nowrap;}
.soha-upload .up-badge svg{width:14px;height:14px;}
.soha-upload .up-badge.neutral{background:var(--surface-alt);border-color:var(--border);color:var(--muted);}
.soha-upload .up-badge.primary{background:var(--primary-soft);border-color:#A9CBE0;color:var(--primary);}
.soha-upload .up-badge.green{background:var(--success-soft);border-color:var(--success);color:var(--success);}
.soha-upload .up-badge.amber{background:var(--warning-soft);border-color:var(--warning);color:#7A5A10;}
.soha-upload .up-badge.red{background:var(--error-soft);border-color:var(--error);color:#8E2C24;}
.soha-upload .up-chip{display:flex;align-items:center;gap:12px;background:var(--surface-alt);border:2px solid var(--border);
  border-radius:var(--r-md);padding:12px 14px;}
.soha-upload .up-chip-ic{flex:none;width:42px;height:42px;border-radius:11px;background:var(--accent-soft);
  border:2px solid var(--ink);display:grid;place-items:center;color:var(--accent);box-shadow:var(--sh-paper-sm);}
.soha-upload .up-chip-ic svg{width:21px;height:21px;}
.soha-upload .up-chip .ct{min-width:0;}
.soha-upload .up-chip .ct .nm{font-weight:800;font-size:14.5px;color:var(--text);word-break:break-all;}
.soha-upload .up-chip .ct .meta{font-size:12.5px;color:var(--muted);margin-top:2px;}
.soha-upload .up-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.soha-upload .up-stat{background:var(--surface-alt);border:2px solid var(--border);border-radius:var(--r-md);padding:12px 13px;}
.soha-upload .up-stat .k{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  color:var(--slate);display:flex;align-items:center;gap:6px;}
.soha-upload .up-stat .k svg{width:13px;height:13px;}
.soha-upload .up-stat .v{font-size:13.5px;font-weight:600;color:var(--text);margin-top:7px;word-break:break-word;}
.soha-upload .up-proc{display:flex;flex-direction:column;gap:10px;background:var(--primary-soft);
  border:2px solid #A9CBE0;border-radius:var(--r-md);padding:13px 15px;}
.soha-upload .up-proc-row{display:flex;align-items:center;gap:10px;font-size:13.5px;font-weight:600;color:var(--primary);}
.soha-upload .up-proc-row svg{width:17px;height:17px;}
.soha-upload .up-bar{height:8px;border-radius:99px;background:rgba(28,63,96,.14);overflow:hidden;}
.soha-upload .up-bar i{display:block;height:100%;width:38%;border-radius:99px;background:var(--primary);
  animation:up-indet 1.3s var(--ease) infinite;}
@keyframes up-indet{0%{margin-left:-38%;}100%{margin-left:100%;}}

/* aside: promo + tip */
.soha-upload .up-promo{position:relative;overflow:hidden;background:var(--side-bg);color:#FBF3DC;
  border:2px solid var(--ink);border-radius:var(--r-xl);box-shadow:var(--sh-paper);padding:22px 20px;
  display:flex;flex-direction:column;gap:13px;}
.soha-upload .up-promo.grain::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;
  background-image:radial-gradient(rgba(255,247,223,.07) 1px,transparent 1px);background-size:4px 4px;}
.soha-upload .up-promo > *{position:relative;z-index:1;}
.soha-upload .up-promo-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:11.5px;font-weight:800;
  letter-spacing:.16em;text-transform:uppercase;color:var(--yellow);}
.soha-upload .up-promo-eyebrow svg{width:15px;height:15px;}
.soha-upload .up-promo h3{font-family:var(--font-head);font-weight:800;font-size:19px;line-height:1.2;color:#FFFDF5;}
.soha-upload .up-promo p{font-size:13px;line-height:1.55;color:rgba(251,243,220,.82);}
.soha-upload .up-note{display:flex;gap:10px;align-items:flex-start;background:rgba(255,253,245,.08);
  border:1.5px solid rgba(255,247,223,.18);border-radius:var(--r-md);padding:11px 12px;}
.soha-upload .up-note .up-num{background:var(--yellow);}
.soha-upload .up-note p{font-size:12.5px;line-height:1.5;color:rgba(251,243,220,.9);}
.soha-upload .up-promo-mascot{position:absolute;right:-6px;bottom:-8px;width:92px;height:auto;z-index:0;
  pointer-events:none;filter:drop-shadow(4px 6px 0 rgba(0,0,0,.18));}
.soha-upload .up-tip{background:var(--surface);border:2px solid var(--border);border-radius:var(--r-lg);
  box-shadow:var(--sh-paper-sm);padding:16px 17px;display:flex;flex-direction:column;gap:9px;}
.soha-upload .up-tip-h{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:13.5px;color:var(--primary);}
.soha-upload .up-tip-h svg{width:16px;height:16px;color:var(--accent);}
.soha-upload .up-tip p{font-size:13px;line-height:1.55;color:var(--muted);}

/* ---------- result panel ---------- */
.soha-upload .up-result{background:var(--surface);border:2px solid var(--success);border-radius:var(--r-xl);
  box-shadow:var(--sh-paper);padding:clamp(20px,2.6vw,30px);display:flex;flex-direction:column;gap:18px;}
.soha-upload .up-result-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap;}
.soha-upload .up-quality{display:flex;align-items:center;gap:14px;background:var(--success-soft);
  border:2px solid var(--success);border-radius:var(--r-lg);padding:15px 17px;}
.soha-upload .up-quality.warn{background:var(--warning-soft);border-color:var(--warning);}
.soha-upload .up-quality-ic{flex:none;width:48px;height:48px;border-radius:13px;background:var(--surface);
  border:2px solid var(--ink);display:grid;place-items:center;color:var(--success);box-shadow:var(--sh-paper-sm);}
.soha-upload .up-quality.warn .up-quality-ic{color:var(--warning);}
.soha-upload .up-quality-ic svg{width:24px;height:24px;}
.soha-upload .up-quality-tx{flex:1;min-width:0;}
.soha-upload .up-quality-tx .qt{font-family:var(--font-head);font-weight:800;font-size:17px;color:var(--text);}
.soha-upload .up-quality-tx .qd{font-size:13px;line-height:1.5;color:var(--muted);margin-top:3px;}
.soha-upload .up-meter{flex:none;display:flex;align-items:flex-end;gap:5px;height:38px;}
.soha-upload .up-meter span{width:9px;border-radius:4px;background:rgba(34,34,34,.14);}
.soha-upload .up-meter span:nth-child(1){height:40%;}
.soha-upload .up-meter span:nth-child(2){height:55%;}
.soha-upload .up-meter span:nth-child(3){height:70%;}
.soha-upload .up-meter span:nth-child(4){height:85%;}
.soha-upload .up-meter span:nth-child(5){height:100%;}
.soha-upload .up-meter span.on{background:var(--success);}
.soha-upload .up-quality.warn .up-meter span.on{background:var(--warning);}
.soha-upload .up-preview{border:2px solid var(--border);border-radius:var(--r-lg);overflow:hidden;}
.soha-upload .up-preview-h{display:flex;justify-content:space-between;align-items:center;gap:12px;
  background:var(--surface-alt);border-bottom:2px solid var(--border);padding:11px 15px;flex-wrap:wrap;}
.soha-upload .up-preview-h .t{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:14px;color:var(--text);}
.soha-upload .up-preview-h .t svg{width:16px;height:16px;color:var(--primary);}
.soha-upload .up-preview-h .c{font-size:12px;font-weight:600;color:var(--muted);}
.soha-upload .up-preview-body{max-height:420px;min-height:200px;overflow-y:auto;padding:16px 18px;
  background:var(--surface);white-space:pre-wrap;word-break:break-word;font-size:13.5px;line-height:1.7;color:var(--text);}

/* ---------- responsive ---------- */
@media (max-width:1080px){
  .soha-upload .up-grid{grid-template-columns:1fr;}
  .soha-upload .up-aside{position:static;}
}
@media (max-width:820px){
  .soha-upload .up-hero{grid-template-columns:1fr;}
}
@media (max-width:760px){
  .soha-upload .up-stats{grid-template-columns:repeat(2,1fr);}
}
`;

export default function UploadPage() {
  return (
    <section className="soha-upload">
      <style>{uploadStyles}</style>

      <div className="up-hero up-rv">
        <div>
          <span className="up-kicker">
            <Route /> Intake workflow
          </span>
          <h1 className="up-h1">Tải lên và trích xuất tài liệu</h1>
          <p className="up-sub">
            Tải file PDF hoặc DOCX để lấy văn bản thô trước khi chuyển sang bước AI.
          </p>
        </div>

        <div className="up-flowmini">
          <span className="up-flowmini-h">
            <Sparkles /> Flow
          </span>
          <div className="up-flowmini-row">
            <span className="up-num">1</span>
            <p>Chọn file phù hợp để hệ thống đọc nội dung.</p>
          </div>
          <div className="up-flowmini-row">
            <span className="up-num">2</span>
            <p>Kiểm tra nhanh kết quả trích xuất trước khi sang bước review.</p>
          </div>
        </div>
      </div>

      <UploadForm />
    </section>
  );
}
