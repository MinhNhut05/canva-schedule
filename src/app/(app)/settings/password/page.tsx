import NextImage from "next/image";
import { redirect } from "next/navigation";
import { AtSign, Bell, Check, IdCard, Lock, ShieldCheck, User } from "lucide-react";

import { auth } from "@/lib/auth";
import { PasswordForm } from "./password-form";

const settingsStyles = `
.soha-set{max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:20px;}
.soha-set svg{display:block;}

/* generic paper card */
.soha-set .card{position:relative;background:var(--surface);border:2px solid var(--border);
  border-radius:var(--r-xl);box-shadow:var(--sh-paper);padding:clamp(22px,2.6vw,30px);}

/* ---------- forced-change notice (amber) ---------- */
.soha-set .notice{display:flex;gap:13px;align-items:flex-start;background:var(--warning-soft);
  border:2px solid #E7C66A;border-radius:var(--r-lg);padding:16px 18px;box-shadow:var(--sh-paper-sm);}
.soha-set .notice .ic{flex:none;width:38px;height:38px;border-radius:11px;border:2px solid var(--ink);
  background:var(--yellow);color:var(--ink);display:grid;place-items:center;box-shadow:var(--sh-paper-sm);}
.soha-set .notice .ic svg{width:19px;height:19px;}
.soha-set .notice .bd b{display:block;font-size:15px;font-weight:800;color:#7A5708;margin-bottom:3px;}
.soha-set .notice .bd p{font-size:13.5px;line-height:1.55;color:#8A6A22;}

/* ---------- kicker ---------- */
.soha-set .kicker{display:inline-flex;align-items:center;gap:8px;
  background:color-mix(in srgb,var(--primary) 16%,var(--surface));
  border:1.5px solid color-mix(in srgb,var(--primary) 40%,var(--border));color:var(--primary);
  font-size:11.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;
  border-radius:var(--r-pill);padding:5px 12px;white-space:nowrap;}
.soha-set .kicker svg{width:13px;height:13px;}

/* ---------- header card ---------- */
.soha-set .set-head{display:grid;grid-template-columns:1fr auto;gap:clamp(16px,3vw,30px);
  align-items:center;overflow:hidden;}
.soha-set .set-head .hh-main{min-width:0;}
.soha-set .set-head h1{font-family:var(--font-head);font-weight:800;font-size:clamp(26px,3vw,36px);
  color:var(--text);line-height:1.1;margin:13px 0 10px;text-wrap:balance;}
.soha-set .set-head .sub{font-size:15px;line-height:1.6;color:var(--muted);max-width:54ch;}
.soha-set .hh-mascot{position:relative;flex:none;align-self:end;display:flex;align-items:flex-end;
  justify-content:center;padding:6px 4px 0;}
.soha-set .hh-mascot::before{content:"";position:absolute;left:50%;bottom:6px;transform:translateX(-50%);
  width:130px;height:50px;border-radius:50%;background:var(--primary);opacity:.12;filter:blur(2px);}
.soha-set .hh-mascot img{position:relative;width:clamp(104px,11vw,138px);height:auto;z-index:1;
  filter:drop-shadow(4px 6px 0 rgba(0,0,0,.13));}
.soha-set .hand-tag{position:absolute;top:0;right:-2px;z-index:2;font-family:var(--font-hand);font-size:20px;
  font-weight:700;color:var(--ink);background:var(--yellow);border:2px solid var(--ink);padding:1px 13px;
  border-radius:var(--r-pill);box-shadow:var(--sh-paper-sm);transform:rotate(-4deg);}

/* ---------- card head (badge + title) ---------- */
.soha-set .card-head{display:flex;align-items:flex-start;gap:14px;margin-bottom:18px;}
.soha-set .badge{flex:none;width:46px;height:46px;border-radius:13px;border:2px solid var(--ink);
  display:grid;place-items:center;box-shadow:var(--sh-paper-sm);color:#fff;}
.soha-set .badge svg{width:22px;height:22px;}
.soha-set .badge.navy{background:var(--primary);}
.soha-set .badge.green{background:var(--green);}
.soha-set .card-head .ct h2{font-family:var(--font-head);font-weight:800;font-size:21px;color:var(--text);line-height:1.15;}
.soha-set .card-head .ct p{font-size:14px;line-height:1.55;color:var(--muted);margin-top:5px;max-width:52ch;}

/* ---------- account-info tiles ---------- */
.soha-set .tiles{display:grid;grid-template-columns:1fr 1fr;gap:13px;}
.soha-set .tile{position:relative;background:var(--surface-alt);border:2px solid var(--border);
  border-radius:var(--r-md);padding:13px 15px;display:flex;flex-direction:column;gap:8px;}
.soha-set .tile.full{grid-column:1 / -1;}
.soha-set .tile .tl{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;
  letter-spacing:.08em;text-transform:uppercase;color:var(--slate);}
.soha-set .tile .tl .ti{display:grid;place-items:center;color:var(--primary);}
.soha-set .tile .tl .ti svg{width:15px;height:15px;}
.soha-set .tile .tl .lk{margin-left:auto;color:var(--slate);opacity:.7;}
.soha-set .tile .tl .lk svg{width:13px;height:13px;}
.soha-set .tile .tv{font-size:16px;font-weight:700;color:var(--text);word-break:break-word;}
.soha-set .rolepill{display:inline-flex;align-items:center;gap:6px;width:fit-content;font-size:13.5px;
  font-weight:800;border-radius:var(--r-pill);padding:5px 13px;border:2px solid;}
.soha-set .rolepill svg{width:14px;height:14px;}
.soha-set .rolepill.admin{background:var(--primary-soft);border-color:#A9CBE0;color:var(--primary);}
.soha-set .rolepill.member{background:var(--success-soft);border-color:#A6D2B2;color:#246B43;}

.soha-set .ro-note{display:flex;align-items:flex-start;gap:9px;margin-top:16px;padding:12px 14px;
  background:color-mix(in srgb,var(--primary) 5%,var(--surface));border:1.5px dashed var(--border);
  border-radius:var(--r-md);font-size:13px;line-height:1.55;color:var(--muted);}
.soha-set .ro-note svg{flex:none;width:16px;height:16px;color:var(--slate);margin-top:1px;}

/* ---------- alerts ---------- */
.soha-set .alert{display:flex;align-items:flex-start;gap:12px;border:2px solid;border-radius:var(--r-lg);
  padding:14px 16px;margin-bottom:18px;}
.soha-set .alert svg{flex:none;width:20px;height:20px;margin-top:1px;}
.soha-set .alert .at{font-size:14.5px;font-weight:800;}
.soha-set .alert .ab{font-size:13.5px;line-height:1.5;margin-top:2px;}
.soha-set .alert.ok{background:var(--success-soft);border-color:#A6D2B2;color:#246B43;}
.soha-set .alert.ok svg{color:var(--success);}
.soha-set .alert.bad{background:var(--error-soft);border-color:#E0A59E;color:#8E2C24;}
.soha-set .alert.bad svg{color:var(--error);}

/* ---------- form fields ---------- */
.soha-set .fields{display:flex;flex-direction:column;gap:16px;}
.soha-set .label{display:block;font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:7px;}
.soha-set .field{position:relative;}
.soha-set .field>.lead{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--slate);pointer-events:none;}
.soha-set .field>.lead svg{width:18px;height:18px;}
.soha-set .input{width:100%;font-family:var(--font-body);font-size:15px;font-weight:500;color:var(--text);
  background:var(--surface-alt);border:2px solid var(--border);border-radius:var(--r-md);
  padding:13px 46px 13px 42px;outline:none;transition:border-color .15s,box-shadow .15s,background .15s;}
.soha-set .input::placeholder{color:#B3AA94;font-weight:400;}
.soha-set .input:focus{border-color:var(--info);box-shadow:0 0 0 4px var(--info-soft);background:#fff;}
.soha-set .field.err .input{border-color:var(--error);background:var(--error-soft);}
.soha-set .field.err .input:focus{box-shadow:0 0 0 4px var(--error-soft);}
.soha-set .peek{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;
  width:32px;height:32px;display:grid;place-items:center;border-radius:9px;color:var(--slate);cursor:pointer;
  transition:background .15s,color .15s;}
.soha-set .peek:hover{background:var(--surface);color:var(--primary);}
.soha-set .peek:focus-visible{outline:none;box-shadow:0 0 0 3px var(--info-soft);color:var(--primary);}
.soha-set .peek svg{width:18px;height:18px;}
.soha-set .hint{display:flex;align-items:flex-start;gap:6px;font-size:12.5px;line-height:1.5;color:var(--muted);margin-top:7px;}
.soha-set .hint svg{flex:none;width:14px;height:14px;margin-top:1px;}
.soha-set .hint.err{color:var(--error);font-weight:600;}
.soha-set .hint.err svg{color:var(--error);}

/* ---------- helper note (info) ---------- */
.soha-set .helper-note{display:flex;align-items:flex-start;gap:9px;margin-top:18px;padding:13px 15px;
  background:color-mix(in srgb,var(--primary) 6%,var(--surface));border:1.5px solid var(--border);
  border-radius:var(--r-md);font-size:13px;line-height:1.55;color:var(--muted);}
.soha-set .helper-note svg{flex:none;width:16px;height:16px;color:var(--primary);margin-top:1px;}

/* ---------- submit ---------- */
.soha-set .actions{display:flex;justify-content:flex-end;margin-top:20px;}
.soha-set .btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;font-weight:800;font-size:15px;
  border-radius:var(--r-pill);padding:13px 24px;border:2px solid var(--ink);cursor:pointer;
  background:var(--yellow);color:var(--ink);box-shadow:var(--sh-press);
  transition:transform .12s var(--ease),box-shadow .12s;}
.soha-set .btn svg{width:18px;height:18px;}
.soha-set .btn:hover{transform:translate(-1px,-1px);box-shadow:4px 5px 0 var(--ink);}
.soha-set .btn:active{transform:translate(3px,4px);box-shadow:none;}
.soha-set .btn:disabled{cursor:wait;opacity:.92;transform:none;box-shadow:var(--sh-press);}
.soha-set .btn:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft),var(--sh-press);}
.soha-set .spin{animation:setSpin 1s linear infinite;}
@keyframes setSpin{to{transform:rotate(360deg);}}

/* ---------- responsive ---------- */
@media (max-width:680px){
  .soha-set .set-head{grid-template-columns:1fr;}
  .soha-set .hh-mascot{display:none;}
  .soha-set .tiles{grid-template-columns:1fr;}
  .soha-set .actions{justify-content:stretch;}
  .soha-set .btn{width:100%;}
}

/* ---------- motion (transform only — never fade opacity from 0) ---------- */
@media (prefers-reduced-motion:no-preference){
  .soha-set .card,.soha-set .notice{animation:setDrop .3s var(--ease);}
}
@keyframes setDrop{from{transform:translateY(-7px);}to{transform:none;}}
@media (prefers-reduced-motion:reduce){
  .soha-set *{transition:none !important;animation:none !important;}
  .soha-set .btn:hover,.soha-set .btn:active{transform:none;}
}
`;

export default async function SettingsPasswordPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { name, username, role, mustChangePassword } = session.user;
  const displayName = name?.trim() || "Người dùng";
  const cleanUsername = username?.trim().replace(/^@/, "");
  const displayUsername = cleanUsername ? `@${cleanUsername}` : "@chua-cap-nhat";
  const roleLabel = role === "admin" ? "Quản trị viên" : "Nhân viên";

  return (
    <div className="soha-set">
      <style>{settingsStyles}</style>

      {mustChangePassword ? (
        <section className="notice" role="alert">
          <span className="ic" aria-hidden="true">
            <Bell />
          </span>
          <div className="bd">
            <b>Bạn cần đổi mật khẩu trước khi tiếp tục.</b>
            <p>
              Đây là lần đăng nhập đầu tiên của bạn. Hãy đặt mật khẩu mới để bảo vệ tài khoản trước
              khi sử dụng các tính năng khác.
            </p>
          </div>
        </section>
      ) : null}

      <section className="card set-head">
        <div className="hh-main">
          <span className="kicker">
            <ShieldCheck /> Bảo mật &amp; tài khoản
          </span>
          <h1>Cài đặt tài khoản</h1>
          <p className="sub">
            Cập nhật thông tin truy cập để giữ không gian xử lý tài liệu an toàn và ổn định cho đội
            ngũ vận hành.
          </p>
        </div>
        <div className="hh-mascot">
          <span className="hand-tag">Rà soát kỹ</span>
          <NextImage
            src="/front-flow/mascot-bunny-validate.png"
            alt=""
            aria-hidden="true"
            width={2000}
            height={1414}
          />
        </div>
      </section>

      <section className="card info-card">
        <div className="card-head">
          <span className="badge navy" aria-hidden="true">
            <IdCard />
          </span>
          <div className="ct">
            <h2>Thông tin tài khoản</h2>
            <p>Hồ sơ truy cập của bạn trong không gian xử lý tài liệu SOHA Travel.</p>
          </div>
        </div>

        <div className="tiles">
          <div className="tile full">
            <span className="tl">
              <span className="ti">
                <User />
              </span>
              Họ tên
              <span className="lk" aria-hidden="true">
                <Lock />
              </span>
            </span>
            <span className="tv">{displayName}</span>
          </div>

          <div className="tile">
            <span className="tl">
              <span className="ti">
                <AtSign />
              </span>
              Tên đăng nhập
              <span className="lk" aria-hidden="true">
                <Lock />
              </span>
            </span>
            <span className="tv">{displayUsername}</span>
          </div>

          <div className="tile">
            <span className="tl">
              <span className="ti">
                <ShieldCheck />
              </span>
              Vai trò
              <span className="lk" aria-hidden="true">
                <Lock />
              </span>
            </span>
            <span className={`rolepill ${role}`}>
              <Check /> {roleLabel}
            </span>
          </div>
        </div>

        <p className="ro-note">
          <Lock />
          <span>
            Thông tin tài khoản do quản trị viên quản lý — không thể chỉnh sửa trực tiếp tại đây.
          </span>
        </p>
      </section>

      <PasswordForm />
    </div>
  );
}
