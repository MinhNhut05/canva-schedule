import { ListChecks } from "lucide-react";
import { db } from "@/lib/db";
import { SEEDED_RULE_IDS } from "@/lib/rules/seed";
import { RulesTable } from "./_components/rules-table";

export const metadata = {
  title: "Quản lý quy tắc | SileTravel",
};

const rulesStyles = `
.soha-adm{display:flex;flex-direction:column;gap:22px;}
.soha-adm .adm-head{display:flex;flex-direction:column;gap:11px;}
.soha-adm .adm-kicker{display:inline-flex;align-items:center;gap:8px;width:fit-content;background:var(--primary-soft);
  color:var(--primary);border:1.5px solid #A9CBE0;font-size:11.5px;font-weight:800;letter-spacing:.13em;
  text-transform:uppercase;border-radius:var(--r-pill);padding:5px 12px;}
.soha-adm .adm-kicker svg{width:13px;height:13px;}
.soha-adm .adm-h1{font-family:var(--font-head);font-weight:800;font-size:clamp(26px,3vw,36px);line-height:1.08;
  color:var(--primary);text-wrap:balance;}
.soha-adm .adm-desc{font-size:15px;line-height:1.6;color:var(--muted);max-width:70ch;}

/* toolbar + primary button (in-flow) */
.soha-adm .adm-toolbar{display:flex;justify-content:flex-end;}
.soha-adm .adm-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--font-body);
  font-weight:800;font-size:14px;border-radius:var(--r-pill);padding:11px 20px;border:2px solid var(--ink);
  background:var(--yellow);color:var(--ink);cursor:pointer;box-shadow:var(--sh-press);
  transition:transform .12s var(--ease),box-shadow .12s;}
.soha-adm .adm-btn svg{width:16px;height:16px;}
.soha-adm .adm-btn:hover{transform:translate(-1px,-1px);box-shadow:4px 5px 0 var(--ink);}
.soha-adm .adm-btn:active{transform:translate(3px,4px);box-shadow:none;}
.soha-adm .adm-btn:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft),var(--sh-press);}
.soha-adm .adm-btn:disabled{opacity:.6;cursor:not-allowed;transform:none;box-shadow:var(--sh-press);}

/* table card */
.soha-adm .adm-tablecard{background:var(--surface);border:2px solid var(--border);border-radius:var(--r-xl);
  box-shadow:var(--sh-paper);overflow:hidden;}
.soha-adm .adm-table{width:100%;border-collapse:separate;border-spacing:0;font-size:14px;}
.soha-adm .adm-table thead th{background:var(--surface-alt);color:var(--primary);text-align:left;font-weight:800;
  font-size:12px;letter-spacing:.04em;text-transform:uppercase;padding:14px 18px;border-bottom:2px solid var(--border);white-space:nowrap;}
.soha-adm .adm-table tbody td{padding:15px 18px;border-bottom:1.5px solid var(--border);color:var(--text);vertical-align:middle;}
.soha-adm .adm-table tbody tr:last-child td{border-bottom:0;}
.soha-adm .adm-table tbody tr{cursor:pointer;transition:background .14s var(--ease);}
.soha-adm .adm-table tbody tr:hover{background:var(--surface-alt);}
.soha-adm .adm-table tbody tr:focus-visible{outline:none;box-shadow:inset 0 0 0 2px var(--info);background:var(--surface-alt);}
.soha-adm .adm-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:var(--primary);font-weight:700;}
.soha-adm .adm-rulename{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.soha-adm .adm-rulename .nm{font-weight:700;}

/* row tags + status badges */
.soha-adm .adm-tag{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:800;
  border-radius:var(--r-pill);padding:3px 11px;border:2px solid;white-space:nowrap;}
.soha-adm .adm-tag.seed{background:var(--primary-soft);border-color:#A9CBE0;color:var(--primary);}
.soha-adm .adm-tag.track{background:var(--surface-alt);border-color:var(--border);color:var(--muted);}

/* warm toggle (recolor radix Switch in-flow) */
.soha-adm [data-slot="switch"]{border:1px solid var(--ink);box-shadow:var(--sh-paper-sm);}
.soha-adm [data-slot="switch"][data-state="checked"]{background:var(--green);}
.soha-adm [data-slot="switch"][data-state="unchecked"]{background:var(--surface-alt);}
.soha-adm [data-slot="switch"] [data-slot="switch-thumb"]{background:var(--surface);}

/* mobile: collapse rows into stacked cards */
@media (max-width:720px){
  .soha-adm .adm-tablecard{background:transparent;border:0;box-shadow:none;overflow:visible;}
  .soha-adm .adm-table thead{display:none;}
  .soha-adm .adm-table,.soha-adm .adm-table tbody,.soha-adm .adm-table tr,.soha-adm .adm-table td{display:block;width:100%;}
  .soha-adm .adm-table tr{background:var(--surface);border:2px solid var(--border);border-radius:var(--r-lg);
    box-shadow:var(--sh-paper-sm);padding:6px 16px;margin-bottom:14px;}
  .soha-adm .adm-table tbody td{display:flex;align-items:center;justify-content:space-between;gap:14px;
    border-bottom:1.5px dashed var(--border);padding:11px 0;}
  .soha-adm .adm-table tbody tr td:last-child{border-bottom:0;}
  .soha-adm .adm-table tbody td::before{content:attr(data-label);font-size:11.5px;font-weight:800;
    letter-spacing:.04em;text-transform:uppercase;color:var(--muted);flex:none;}
  .soha-adm .adm-rulename{justify-content:flex-end;text-align:right;}
}
@media (prefers-reduced-motion:reduce){
  .soha-adm *{transition:none !important;}
  .soha-adm .adm-btn:hover{transform:none;}
}

/* ============ portaled sheet / dialog (carry warm tokens out of .soha-app) ============ */
.soha-adm-pane,.soha-adm-dialog{
  --surface:#FFFDF5;--surface-alt:#F8EFD7;--bg-soft:#F7E8C9;--text:#222;--muted:#6D6659;--ink:#2A2A2A;
  --primary:#1C3F60;--primary-soft:#DDEAF3;--yellow:#F3C94C;--green:#78A85A;--border:#D8C9A3;
  --error:#C9473D;--error-soft:#F6D9D5;--info:#3E7CA8;--info-soft:#D7E8F2;--success-soft:#DCEEE0;
  --r-sm:8px;--r-md:14px;--r-lg:20px;--r-xl:24px;--r-pill:999px;
  --sh-paper-sm:2px 3px 0 rgba(34,34,34,.14);--sh-press:3px 4px 0 #2A2A2A;--ease:cubic-bezier(.16,1,.3,1);
}
.soha-adm-pane.soha-adm-pane{background:var(--surface);border:0;border-left:2px solid var(--ink);
  box-shadow:-10px 0 34px rgba(34,34,34,.16);color:var(--text);}
.soha-adm-dialog.soha-adm-dialog{background:var(--surface);border:2px solid var(--ink);border-radius:var(--r-xl);
  box-shadow:var(--sh-press);color:var(--text);}
.soha-adm-pane .adm-pane-title,.soha-adm-dialog .adm-pane-title{font-family:var(--font-body);font-weight:800;
  font-size:20px;color:var(--primary);letter-spacing:-.01em;}
.soha-adm-dialog .adm-pane-desc{font-size:13.5px;line-height:1.55;color:var(--muted);}

.soha-adm-pane .adm-field{display:flex;flex-direction:column;gap:7px;}
.soha-adm-pane .adm-label{font-weight:800;font-size:13px;color:var(--text);}
.soha-adm-pane .adm-ro{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:var(--muted);}
.soha-adm-pane .adm-input,.soha-adm-pane .adm-textarea{width:100%;background:var(--surface);border:2px solid var(--border);
  border-radius:var(--r-md);padding:10px 13px;font-family:var(--font-body);font-size:14px;color:var(--text);
  transition:border-color .15s,box-shadow .15s;}
.soha-adm-pane .adm-textarea{min-height:84px;resize:vertical;line-height:1.55;}
.soha-adm-pane .adm-input.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}
.soha-adm-pane .adm-input::placeholder,.soha-adm-pane .adm-textarea::placeholder{color:var(--muted);opacity:.7;}
.soha-adm-pane .adm-input:focus-visible,.soha-adm-pane .adm-textarea:focus-visible{outline:none;border-color:var(--info);box-shadow:0 0 0 4px var(--info-soft);}
.soha-adm-pane .adm-input:disabled,.soha-adm-pane .adm-textarea:disabled{opacity:.6;cursor:not-allowed;}
.soha-adm-pane .adm-check-row{display:flex;align-items:center;gap:11px;}
.soha-adm-pane .adm-check{width:20px;height:20px;border-radius:6px;border:2px solid var(--ink);accent-color:var(--green);cursor:pointer;}
.soha-adm-pane .adm-check-state{font-size:13px;color:var(--muted);font-weight:600;}
.soha-adm-pane .adm-note{font-size:12px;line-height:1.5;color:var(--muted);font-style:italic;}
.soha-adm-pane .adm-error,.soha-adm-dialog .adm-error{font-size:13px;color:#8E2C24;font-weight:600;}

.soha-adm-pane .adm-btn,.soha-adm-dialog .adm-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
  height:auto;line-height:1.2;white-space:nowrap;
  font-family:var(--font-body);font-weight:800;font-size:14px;border-radius:var(--r-pill);padding:10px 20px;
  border:2px solid var(--ink);background:var(--yellow);color:var(--ink);cursor:pointer;box-shadow:var(--sh-press);
  transition:transform .12s var(--ease),box-shadow .12s;text-decoration:none;}
.soha-adm-pane .adm-btn:hover,.soha-adm-dialog .adm-btn:hover{transform:translate(-1px,-1px);box-shadow:4px 5px 0 var(--ink);}
.soha-adm-pane .adm-btn:active,.soha-adm-dialog .adm-btn:active{transform:translate(3px,4px);box-shadow:none;}
.soha-adm-pane .adm-btn:disabled,.soha-adm-dialog .adm-btn:disabled{opacity:.6;cursor:not-allowed;transform:none;box-shadow:var(--sh-press);}
.soha-adm-pane .adm-btn.ghost,.soha-adm-dialog .adm-btn.ghost{background:var(--surface);}
.soha-adm-pane .adm-btn.danger,.soha-adm-dialog .adm-btn.danger{background:var(--error);color:#fff;}
`;

export default async function AdminRulesPage() {
  const rules = await db.companyRule.findMany({
    orderBy: [{ category: "asc" }, { ruleId: "asc" }],
  });

  const rulesWithMeta = rules.map((rule) => ({
    ...rule,
    isSeeded: SEEDED_RULE_IDS.has(rule.ruleId),
  }));

  return (
    <div className="soha-adm">
      <style>{rulesStyles}</style>
      <div className="adm-head">
        <span className="adm-kicker">
          <ListChecks /> Quản trị nội dung
        </span>
        <h1 className="adm-h1">Quy tắc trích xuất</h1>
        <p className="adm-desc">
          Quản lý các guardrail dùng để định hướng AI khi trích xuất, rà soát và chuẩn hóa nội dung tour.
        </p>
      </div>
      <RulesTable rules={rulesWithMeta} />
    </div>
  );
}
