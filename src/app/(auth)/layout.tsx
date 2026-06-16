import Image from "next/image";
import { Caveat, Playfair_Display } from "next/font/google";
import { Layers, Sparkles } from "lucide-react";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-playfair",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-caveat",
});

const styles = `
.soha-login{
  --font-heading:var(--font-playfair),Georgia,serif;
  --font-body:var(--font-inter),system-ui,sans-serif;
  --font-hand:var(--font-caveat),cursive;
  --bg:#FFF7DF;--bg-soft:#F7E8C9;--surface:#FFFDF5;--surface-alt:#F8EFD7;
  --text:#222;--muted:#6D6659;--ink:#2A2A2A;
  --primary:#1C3F60;--primary-soft:#DDEAF3;--accent:#D95F3D;--accent-soft:#F8D8CB;
  --yellow:#F3C94C;--green:#78A85A;--blue:#5DA9D6;--slate:#6E89A6;
  --border:#D8C9A3;
  --success:#3F8F5F;--success-soft:#DCEEE0;--warning:#C98A16;--warning-soft:#FAEBC6;
  --error:#C9473D;--error-soft:#F6D9D5;--info:#3E7CA8;--info-soft:#D7E8F2;
  --r-sm:8px;--r-md:14px;--r-lg:20px;--r-xl:28px;--r-pill:999px;
  --sh-paper:4px 6px 0 rgba(34,34,34,.14);--sh-paper-sm:2px 3px 0 rgba(34,34,34,.14);
  --sh-soft:0 12px 30px rgba(34,34,34,.08);--sh-press:3px 4px 0 var(--ink);
  --ease:cubic-bezier(0.16,1,0.3,1);
  min-height:100vh;font-family:var(--font-body);color:var(--text);background:var(--bg);
  -webkit-font-smoothing:antialiased;
}
.soha-login *{box-sizing:border-box;margin:0;padding:0;}
.soha-login ::selection{background:var(--yellow);}
.soha-login button{font-family:inherit;}
.soha-login svg{display:block;}

/* ============ SCREEN LAYOUT ============ */
.soha-login .screen{display:grid;grid-template-columns:1.05fr .95fr;min-height:100vh;}

/* ---------- PROMO (left) ---------- */
.soha-login .promo{position:relative;overflow:hidden;background:var(--primary);color:#FBF3DC;
  padding:clamp(40px,4.4vw,72px);display:flex;flex-direction:column;}
.soha-login .promo.grain::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;
  background-image:radial-gradient(rgba(255,247,223,.07) 1px,transparent 1px);background-size:4px 4px;}
.soha-login .promo .route{position:absolute;inset:0;pointer-events:none;opacity:.5;}
.soha-login .promo .route path{fill:none;stroke:rgba(243,201,76,.5);stroke-width:2.5;stroke-dasharray:3 11;stroke-linecap:round;}
.soha-login .promo .pin{position:absolute;color:var(--accent);opacity:.9;}
.soha-login .promo-inner{position:relative;z-index:2;display:flex;flex-direction:column;height:100%;}

.soha-login .brandline{display:flex;align-items:center;gap:13px;}
.soha-login .brandline img{height:46px;width:auto;filter:drop-shadow(2px 3px 0 rgba(0,0,0,.18));}
.soha-login .brandline .nm{font-family:var(--font-heading);font-weight:800;font-size:23px;color:#FBF3DC;letter-spacing:.01em;}

.soha-login .promo-mid{margin-top:auto;margin-bottom:auto;padding:clamp(20px,3vw,38px) 0;max-width:540px;}
.soha-login .eyebrow{font-weight:800;font-size:12px;letter-spacing:.18em;text-transform:uppercase;
  color:var(--yellow);display:inline-flex;align-items:center;gap:9px;}
.soha-login .eyebrow::before{content:"";width:26px;height:2px;background:var(--yellow);border-radius:2px;}
.soha-login .promo h1{font-family:var(--font-heading);font-weight:800;font-size:clamp(30px,3.5vw,46px);
  line-height:1.1;margin:20px 0 18px;color:#FFFDF5;text-wrap:balance;}
.soha-login .promo .lede{font-size:clamp(15px,1.15vw,17px);line-height:1.6;color:rgba(251,243,220,.82);max-width:480px;}

.soha-login .highlights{display:flex;flex-direction:column;gap:14px;margin-top:34px;max-width:480px;}
.soha-login .hl{display:flex;align-items:center;gap:16px;background:var(--surface);color:var(--text);
  border:2px solid var(--ink);border-radius:var(--r-lg);padding:15px 18px;box-shadow:var(--sh-press);}
.soha-login .hl .ic{flex:none;width:46px;height:46px;border-radius:14px;display:grid;place-items:center;
  border:2px solid var(--ink);}
.soha-login .hl .ic.a{background:var(--yellow);} .soha-login .hl .ic.b{background:var(--green);}
.soha-login .hl .ic svg{width:24px;height:24px;color:var(--ink);}
.soha-login .hl .tx{min-width:0;}
.soha-login .hl .tx .k{font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--muted);}
.soha-login .hl .tx .v{font-weight:700;font-size:15.5px;color:var(--text);margin-top:2px;}
.soha-login .hl .tx .v .flow{display:inline-flex;align-items:center;gap:7px;flex-wrap:wrap;}
.soha-login .hl .tx .v .flow b{font-weight:800;}
.soha-login .hl .tx .v .flow .arr{color:var(--accent);font-weight:900;}

.soha-login .mascot-wrap{position:absolute;right:clamp(-30px,-1vw,0px);bottom:clamp(-18px,-1vw,8px);z-index:1;
  width:clamp(220px,26vw,360px);pointer-events:none;}
.soha-login .mascot-wrap img{width:100%;height:auto;filter:drop-shadow(6px 8px 0 rgba(0,0,0,.16));}
.soha-login .mascot-tag{position:absolute;left:6%;bottom:23%;z-index:3;font-family:var(--font-hand);
  font-size:24px;font-weight:700;color:var(--ink);background:var(--yellow);border:2px solid var(--ink);
  padding:4px 14px;border-radius:var(--r-pill);box-shadow:var(--sh-paper-sm);transform:rotate(-4deg);}

/* ---------- AUTH (right) ---------- */
.soha-login .auth{position:relative;display:flex;align-items:center;justify-content:center;
  padding:clamp(28px,4vw,56px);background:var(--bg);}
.soha-login .auth.grain::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;
  background-image:radial-gradient(rgba(120,100,60,.05) 1px,transparent 1px);background-size:4px 4px;}
.soha-login .card{position:relative;z-index:2;width:100%;max-width:430px;background:var(--surface);
  border:2px solid var(--border);border-radius:var(--r-xl);box-shadow:var(--sh-paper);
  padding:clamp(26px,3vw,38px);}

.soha-login .card-brand{display:flex;align-items:center;gap:11px;}
.soha-login .card-brand img{height:36px;width:auto;flex:none;}
.soha-login .card-brand .nm{font-family:var(--font-heading);font-weight:800;font-size:20px;color:var(--primary);white-space:nowrap;}

.soha-login .badge-ws{display:inline-flex;align-items:center;gap:7px;margin-top:18px;white-space:nowrap;
  background:var(--primary-soft);color:var(--primary);border:1.5px solid #A9CBE0;
  font-size:12px;font-weight:700;border-radius:var(--r-pill);padding:5px 12px;}
.soha-login .badge-ws svg{width:13px;height:13px;}

.soha-login .card h2{font-family:var(--font-heading);font-weight:800;font-size:32px;color:var(--text);margin:16px 0 8px;}
.soha-login .card .sub{font-size:14.5px;line-height:1.55;color:var(--muted);}

/* toast (session expired) */
.soha-login .toast{display:flex;align-items:flex-start;gap:11px;margin-top:20px;
  background:var(--warning-soft);border:2px solid #E5C878;border-radius:var(--r-md);
  padding:13px 14px;color:#7A5A10;box-shadow:var(--sh-paper-sm);
  animation:soha-dropIn .32s var(--ease);}
.soha-login .toast svg.lead{width:19px;height:19px;flex:none;margin-top:1px;color:var(--warning);}
.soha-login .toast .body{flex:1;font-size:13.5px;line-height:1.5;font-weight:600;}
.soha-login .toast .x{flex:none;background:none;border:none;cursor:pointer;color:#9A7A30;padding:2px;border-radius:6px;}
.soha-login .toast .x:hover{background:rgba(0,0,0,.06);}
.soha-login .toast .x svg{width:15px;height:15px;}
@keyframes soha-dropIn{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:none;}}

/* inline error */
.soha-login .alert{display:flex;align-items:flex-start;gap:11px;margin-top:20px;
  background:var(--error-soft);border:2px solid #E0A59E;border-radius:var(--r-md);
  padding:13px 14px;color:#8E2C24;box-shadow:var(--sh-paper-sm);}
.soha-login .alert.shake{animation:soha-shake .4s var(--ease);}
.soha-login .alert svg{width:19px;height:19px;flex:none;margin-top:1px;color:var(--error);}
.soha-login .alert .body{font-size:13.5px;line-height:1.5;font-weight:600;}
@keyframes soha-shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-6px);}40%{transform:translateX(6px);}60%{transform:translateX(-4px);}80%{transform:translateX(4px);}}

/* form */
.soha-login form{margin-top:24px;display:flex;flex-direction:column;gap:17px;}
.soha-login .label{display:block;font-size:12.5px;font-weight:700;color:var(--text);margin-bottom:7px;letter-spacing:.01em;}
.soha-login .field{position:relative;}
.soha-login .field>.lead{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--slate);pointer-events:none;}
.soha-login .field>.lead svg{width:18px;height:18px;}
.soha-login .input{width:100%;font-family:var(--font-body);font-size:15px;font-weight:500;
  padding:13px 15px 13px 42px;background:var(--surface);border:2px solid var(--border);
  border-radius:var(--r-md);color:var(--text);outline:none;
  transition:border .15s,box-shadow .15s,background .15s;}
.soha-login .input::placeholder{color:#B3AA94;font-weight:400;}
.soha-login .input:focus{border-color:var(--info);box-shadow:0 0 0 4px var(--info-soft);background:#fff;}
.soha-login .field.err .input{border-color:var(--error);}
.soha-login .field.err .input:focus{box-shadow:0 0 0 4px var(--error-soft);}
.soha-login .field.has-toggle .input{padding-right:46px;}
.soha-login .peek{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;
  cursor:pointer;color:var(--slate);padding:7px;border-radius:8px;transition:.12s;}
.soha-login .peek:hover{background:var(--surface-alt);color:var(--primary);}
.soha-login .peek svg{width:18px;height:18px;}

/* primary button */
.soha-login .btn{width:100%;justify-content:center;font-weight:800;font-size:15.5px;border-radius:var(--r-pill);
  padding:14px 22px;border:2px solid var(--ink);cursor:pointer;display:inline-flex;align-items:center;
  gap:9px;background:var(--yellow);color:var(--ink);box-shadow:var(--sh-press);
  transition:transform .12s var(--ease),box-shadow .12s;margin-top:4px;}
.soha-login .btn svg{width:18px;height:18px;}
.soha-login .btn:hover{transform:translate(-1px,-1px);box-shadow:4px 5px 0 var(--ink);}
.soha-login .btn:active{transform:translate(3px,4px);box-shadow:none;}
.soha-login .btn:disabled{cursor:wait;opacity:.92;transform:none;box-shadow:var(--sh-press);}
.soha-login .spin{animation:soha-spin 1s linear infinite;}
@keyframes soha-spin{to{transform:rotate(360deg);}}

.soha-login .helper{margin-top:22px;padding-top:18px;border-top:1.5px dashed var(--border);
  font-size:13px;line-height:1.55;color:var(--muted);text-align:center;}
.soha-login .helper b{color:var(--primary);font-weight:700;}

/* ============ RESPONSIVE ============ */
@media (max-width:920px){
  .soha-login .screen{grid-template-columns:1fr;}
  .soha-login .promo{display:none;}
  .soha-login .auth{min-height:100vh;align-items:flex-start;padding-top:clamp(40px,9vh,80px);}
}
@media (prefers-reduced-motion:reduce){
  .soha-login .toast,.soha-login .alert.shake{animation:none;}
  .soha-login .btn{transition:none;}
}
`;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`soha-login ${playfair.variable} ${caveat.variable}`}>
      <style>{styles}</style>
      <div className="screen">
        <aside className="promo grain">
          <svg className="route" viewBox="0 0 600 900" preserveAspectRatio="none" aria-hidden="true">
            <path d="M-20 140 C 160 90, 230 240, 150 360 S 120 600, 320 640 S 560 720, 520 880" />
          </svg>
          <div className="pin" style={{ top: "13%", left: "70%" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7Z" />
              <circle cx="12" cy="9" r="2.5" fill="#1C3F60" />
            </svg>
          </div>

          <div className="promo-inner">
            <div className="brandline">
              <Image src="/front-flow/soha-logo.png" alt="SOHA Travel" width={65} height={46} priority />
              <span className="nm">SOHA Travel</span>
            </div>

            <div className="promo-mid">
              <span className="eyebrow">Premium travel operations</span>
              <h1>Không gian điều phối tài liệu cho hành trình review và tạo Canva.</h1>
              <p className="lede">
                Bắt đầu từ upload, kiểm tra chất lượng trích xuất, duyệt nội dung và chuyển tiếp sang thiết kế với
                flow rõ ràng hơn.
              </p>

              <div className="highlights">
                <div className="hl">
                  <span className="ic a">
                    <Layers />
                  </span>
                  <span className="tx">
                    <span className="k">Luồng chính</span>
                    <span className="v">
                      <span className="flow">
                        <b>Upload</b>
                        <span className="arr">→</span>
                        <b>Review</b>
                        <span className="arr">→</span>
                        <b>Canva</b>
                      </span>
                    </span>
                  </span>
                </div>
                <div className="hl">
                  <span className="ic b">
                    <Sparkles />
                  </span>
                  <span className="tx">
                    <span className="k">Ưu tiên</span>
                    <span className="v">Rõ thứ bậc, nhanh thao tác, tăng độ tin cậy</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mascot-wrap">
            <span className="mascot-tag">Bạn đồng hành</span>
            <Image src="/front-flow/mascot-fox-explore.png" alt="" width={2000} height={1414} />
          </div>
        </aside>

        <main className="auth grain">{children}</main>
      </div>
    </div>
  );
}
