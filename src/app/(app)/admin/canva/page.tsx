import { AlertTriangle, Check, Plug, RefreshCw } from "lucide-react";

import { getCanvaTokenStatus } from "@/lib/canva/oauth";
import { getCanvaConfig } from "@/lib/canva/server-client";

import { startCanvaConnect } from "./actions";

export const metadata = {
  title: "Kết nối Canva | SileTravel",
};

const canvaStyles = `
.soha-adm{display:flex;flex-direction:column;gap:22px;}
.soha-adm .adm-head{display:flex;flex-direction:column;gap:11px;}
.soha-adm .adm-kicker{display:inline-flex;align-items:center;gap:8px;width:fit-content;background:var(--primary-soft);
  color:var(--primary);border:1.5px solid #A9CBE0;font-size:11.5px;font-weight:800;letter-spacing:.13em;
  text-transform:uppercase;border-radius:var(--r-pill);padding:5px 12px;}
.soha-adm .adm-kicker svg{width:13px;height:13px;}
.soha-adm .adm-h1{font-family:var(--font-head);font-weight:800;font-size:clamp(26px,3vw,36px);line-height:1.08;
  color:var(--primary);text-wrap:balance;}
.soha-adm .adm-desc{font-size:15px;line-height:1.6;color:var(--muted);max-width:70ch;}

/* banners */
.soha-adm .adm-banner{display:flex;align-items:flex-start;gap:11px;border:2px solid;border-radius:var(--r-lg);
  padding:14px 17px;font-size:14px;font-weight:600;line-height:1.5;box-shadow:var(--sh-paper-sm);}
.soha-adm .adm-banner svg{flex:none;width:19px;height:19px;margin-top:1px;}
.soha-adm .adm-banner.ok{background:var(--success-soft);border-color:#A6D2B2;color:#246B43;}
.soha-adm .adm-banner.bad{background:var(--error-soft);border-color:#E0A59E;color:#8E2C24;}

/* status card */
.soha-adm .adm-card{background:var(--surface);border:2px solid var(--border);border-radius:var(--r-xl);
  box-shadow:var(--sh-paper);padding:clamp(20px,2.6vw,30px);display:flex;flex-direction:column;gap:20px;}
.soha-adm .adm-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}
.soha-adm .adm-card-title{font-family:var(--font-head);font-weight:800;font-size:clamp(19px,2.2vw,24px);color:var(--text);line-height:1.15;}
.soha-adm .adm-card-desc{font-size:13.5px;line-height:1.55;color:var(--muted);max-width:60ch;margin-top:6px;}

.soha-adm .adm-status{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:800;
  border-radius:var(--r-pill);padding:7px 15px;border:2px solid;white-space:nowrap;flex:none;}
.soha-adm .adm-status svg{width:15px;height:15px;}
.soha-adm .adm-status.green{background:var(--success-soft);border-color:#A6D2B2;color:#246B43;}
.soha-adm .adm-status.amber{background:var(--warning-soft);border-color:#E5C878;color:#7A5A10;}
.soha-adm .adm-status.red{background:var(--error-soft);border-color:#E0A59E;color:#8E2C24;}

/* tiles */
.soha-adm .adm-tiles{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;}
.soha-adm .adm-tile{background:var(--surface-alt);border:2px solid var(--border);border-radius:var(--r-lg);padding:15px 17px;}
.soha-adm .adm-tile.wide{grid-column:1 / -1;}
.soha-adm .adm-tile dt{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--slate);}
.soha-adm .adm-tile dd{margin-top:8px;font-size:15px;font-weight:700;color:var(--text);}
.soha-adm .adm-tile dd.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:var(--primary);}

.soha-adm .adm-errbox{background:var(--error-soft);border:2px solid #E0A59E;border-radius:var(--r-md);
  padding:13px 15px;font-size:13.5px;line-height:1.5;color:#8E2C24;}

/* primary button */
.soha-adm .adm-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;font-family:var(--font-body);
  font-weight:800;font-size:15px;border-radius:var(--r-pill);padding:13px 24px;border:2px solid var(--ink);
  background:var(--yellow);color:var(--ink);cursor:pointer;box-shadow:var(--sh-press);
  transition:transform .12s var(--ease),box-shadow .12s;}
.soha-adm .adm-btn svg{width:17px;height:17px;}
.soha-adm .adm-btn:hover{transform:translate(-1px,-1px);box-shadow:4px 5px 0 var(--ink);}
.soha-adm .adm-btn:active{transform:translate(3px,4px);box-shadow:none;}
.soha-adm .adm-btn:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft),var(--sh-press);}

@media (max-width:600px){
  .soha-adm .adm-tiles{grid-template-columns:1fr;}
}
@media (prefers-reduced-motion:reduce){
  .soha-adm *{transition:none !important;}
  .soha-adm .adm-btn:hover{transform:none;}
}
`;

function maskClientId(id: string) {
  if (id.length <= 4) return "****";
  return "*".repeat(id.length - 4) + id.slice(-4);
}

function formatDate(value: Date | null) {
  if (!value) return "Chưa có";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getStatusLabel(status: string) {
  if (status === "ACTIVE") return "Đã kết nối";
  if (status === "REFRESHING") return "Đang làm mới token";
  return "Cần kết nối lại";
}

export default async function AdminCanvaPage({
  searchParams,
}: {
  searchParams?: Promise<{ connected?: string; error?: string }>;
}) {
  const [status, params] = await Promise.all([
    getCanvaTokenStatus(),
    searchParams ?? Promise.resolve({} as { connected?: string; error?: string }),
  ]);
  const canvaConfig = getCanvaConfig();
  const statusTone =
    status.status === "ACTIVE" ? "green" : status.status === "REFRESHING" ? "amber" : "red";
  const StatusIcon =
    statusTone === "green" ? Check : statusTone === "amber" ? RefreshCw : AlertTriangle;

  return (
    <div className="soha-adm">
      <style>{canvaStyles}</style>

      <div className="adm-head">
        <span className="adm-kicker">
          <Plug /> Quản trị Canva
        </span>
        <h1 className="adm-h1">Kết nối Canva</h1>
        <p className="adm-desc">
          Kết nối lại tài khoản Canva khi refresh token hết hạn, bị thu hồi, hoặc môi trường local/staging/production cần token riêng.
        </p>
      </div>

      {params.connected === "1" ? (
        <div className="adm-banner ok">
          <Check />
          <span>Canva đã kết nối lại thành công.</span>
        </div>
      ) : null}

      {params.error ? (
        <div className="adm-banner bad">
          <AlertTriangle />
          <span>Không thể kết nối Canva: {params.error}</span>
        </div>
      ) : null}

      <div className="adm-card">
        <div className="adm-card-head">
          <div>
            <h2 className="adm-card-title">Trạng thái token Canva</h2>
            <p className="adm-card-desc">
              Mỗi môi trường phải tự kết nối Canva riêng; không copy refresh token giữa local, staging và production.
            </p>
          </div>
          <span className={`adm-status ${statusTone}`}>
            <StatusIcon /> {getStatusLabel(status.status)}
          </span>
        </div>

        <dl className="adm-tiles">
          <div className="adm-tile">
            <dt>Access token hết hạn</dt>
            <dd>{formatDate(status.expiresAt)}</dd>
          </div>
          <div className="adm-tile">
            <dt>Cập nhật gần nhất</dt>
            <dd>{formatDate(status.updatedAt)}</dd>
          </div>
          <div className="adm-tile">
            <dt>Lần thử refresh gần nhất</dt>
            <dd>{formatDate(status.lastRefreshAttemptAt)}</dd>
          </div>
          <div className="adm-tile">
            <dt>Cooldown Canva</dt>
            <dd>{formatDate(status.cooldownUntil)}</dd>
          </div>
          <div className="adm-tile wide">
            <dt>Canva App ID</dt>
            <dd className="mono">{maskClientId(canvaConfig.clientId)}</dd>
          </div>
        </dl>

        {status.lastRefreshError ? (
          <div className="adm-errbox">{status.lastRefreshError}</div>
        ) : null}

        <form action={startCanvaConnect}>
          <button type="submit" className="adm-btn">
            <Plug /> {status.isConnected ? "Kết nối lại Canva" : "Kết nối Canva"}
          </button>
        </form>
      </div>
    </div>
  );
}
