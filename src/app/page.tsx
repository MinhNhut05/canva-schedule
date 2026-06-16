import Image from "next/image";
import Link from "next/link";
import { Caveat, Playfair_Display } from "next/font/google";

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
.frontflow{
  --bg0:#eaf1fa; --bg1:#f3f8fd; --bg2:#dfeaf6;
  --navy:#1C3F60; --sky:#5DA9D6; --slate:#6E89A6;
  --accent:#5FB8FF; --accent-deep:#2E78C2; --cyan:#1F9FC9;
  --ink:#12283f; --muted:#566f8c; --faint:#8aa0ba;
  --yellow:#F3C94C; --terra:#D95F3D; --green:#3F8F5F; --warn:#C98A16;
  --panel:rgba(255,255,255,.62);
  --panel-solid:rgba(255,255,255,.82);
  --gborder:rgba(28,63,96,.16);
  --grid:rgba(28,63,96,.07);
  --blur:18px;
  --r:18px; --r-lg:26px; --pill:999px;
  --maxw:1240px;
  --font-head:var(--font-playfair),Georgia,serif;
  --font-body:var(--font-inter),system-ui,sans-serif;
  --font-hand:var(--font-caveat),cursive;
  --ease:cubic-bezier(.16,1,.3,1);
  position:relative;min-height:100vh;overflow-x:hidden;
  font-family:var(--font-body);color:var(--ink);
  -webkit-font-smoothing:antialiased;
}
.frontflow *{box-sizing:border-box;margin:0;padding:0;}

/* ---------- blueprint background ---------- */
.frontflow .field{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;
  background:
    radial-gradient(90% 60% at 50% -10%, rgba(95,184,255,.22), transparent 60%),
    radial-gradient(70% 50% at 92% 18%, rgba(125,200,235,.18), transparent 60%),
    linear-gradient(180deg,var(--bg1),var(--bg0) 45%,var(--bg2));}
.frontflow .field::before{content:"";position:absolute;inset:0;
  background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);
  background-size:52px 52px;mask-image:radial-gradient(120% 90% at 50% 30%,#000 55%,transparent);
  -webkit-mask-image:radial-gradient(120% 90% at 50% 30%,#000 55%,transparent);}
.frontflow .scan{position:fixed;left:0;right:0;top:0;height:2px;z-index:1;pointer-events:none;
  background:linear-gradient(90deg,transparent,var(--accent),transparent);opacity:.7;filter:blur(.5px);
  animation:ff-scan 7s linear infinite;}
@keyframes ff-scan{0%{transform:translateY(0);opacity:0;}8%{opacity:.7;}92%{opacity:.7;}100%{transform:translateY(100vh);opacity:0;}}
@media (prefers-reduced-motion:reduce){.frontflow .scan{display:none;}}

.frontflow .shell{position:relative;z-index:2;max-width:var(--maxw);margin:0 auto;padding:0 clamp(20px,4vw,52px);}
.frontflow .glass{background:var(--panel);border:1px solid var(--gborder);border-radius:var(--r);
  -webkit-backdrop-filter:blur(var(--blur));backdrop-filter:blur(var(--blur));
  box-shadow:0 18px 44px -22px rgba(28,63,96,.4),inset 0 1px 0 rgba(255,255,255,.7);}

/* ---------- header ---------- */
.frontflow header{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;
  gap:16px;max-width:var(--maxw);margin:0 auto;padding:22px clamp(20px,4vw,52px);}
.frontflow .brand{display:flex;align-items:center;gap:13px;text-decoration:none;color:var(--ink);}
.frontflow .brand img{width:46px;height:46px;object-fit:contain;filter:drop-shadow(0 4px 9px rgba(28,63,96,.2));}
.frontflow .brand .bt{display:flex;flex-direction:column;line-height:1.05;}
.frontflow .brand .bt b{font-size:16px;letter-spacing:.02em;}
.frontflow .brand .bt span{font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:var(--muted);}

.frontflow .eyebrow{display:inline-flex;align-items:center;gap:11px;font-size:12px;font-weight:800;
  letter-spacing:.3em;text-transform:uppercase;color:var(--accent-deep);}
.frontflow .eyebrow::before,.frontflow .eyebrow.c::after{content:"";width:30px;height:2px;background:var(--accent);border-radius:2px;}
.frontflow .eyebrow.c{justify-content:center;}

/* ---------- hero (centered) ---------- */
.frontflow .hero{text-align:center;padding:clamp(30px,5vw,70px) 0 clamp(26px,3vw,40px);
  display:flex;flex-direction:column;align-items:center;}
.frontflow .hero h1{font-family:var(--font-body);font-weight:900;line-height:.92;letter-spacing:-.03em;
  font-size:clamp(58px,11vw,168px);margin:20px 0 0;text-transform:uppercase;
  display:flex;flex-wrap:wrap;justify-content:center;gap:0 .14em;}
.frontflow .hero h1 .front{color:var(--navy);text-shadow:0 4px 30px rgba(28,63,96,.12);}
.frontflow .hero h1 .flow{color:transparent;-webkit-text-stroke:2.2px var(--accent-deep);
  text-stroke:2.2px var(--accent-deep);}
.frontflow .lead{margin-top:24px;max-width:60ch;font-size:clamp(16px,1.35vw,19px);line-height:1.65;color:var(--muted);}
.frontflow .cta-row{display:flex;flex-wrap:wrap;gap:15px;margin-top:32px;justify-content:center;}
.frontflow .btn{display:inline-flex;align-items:center;gap:11px;font-family:var(--font-body);font-weight:700;
  font-size:16px;padding:16px 28px;border-radius:var(--pill);cursor:pointer;text-decoration:none;
  border:1px solid transparent;white-space:nowrap;transition:transform .2s var(--ease),box-shadow .2s var(--ease),background .2s;}
.frontflow .btn svg{width:19px;height:19px;flex:none;}
.frontflow .btn-primary{color:#fff;background:var(--navy);
  box-shadow:0 12px 30px -8px rgba(28,63,96,.5),0 0 0 4px rgba(95,184,255,.18);}
.frontflow .btn-primary:hover{transform:translateY(-3px);box-shadow:0 18px 40px -10px rgba(28,63,96,.55),0 0 0 5px rgba(95,184,255,.3);}
.frontflow .btn-ghost{color:var(--navy);background:var(--panel-solid);border-color:var(--gborder);
  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
.frontflow .btn-ghost:hover{transform:translateY(-3px);border-color:var(--accent);background:#fff;}
.frontflow .btn:active{transform:translateY(0);}

/* ---------- control deck (Block A status) ---------- */
.frontflow .deck{display:grid;grid-template-columns:.82fr 1.18fr;gap:20px;margin-top:clamp(24px,3vw,40px);}
.frontflow .mcard{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;
  padding:22px 20px 18px;overflow:hidden;
  background:radial-gradient(75% 60% at 50% 18%,rgba(95,184,255,.22),transparent 70%),var(--panel-solid);}
.frontflow .mcard .tag-hand{position:absolute;top:14px;right:14px;font-family:var(--font-hand);font-weight:700;
  font-size:22px;color:#06243f;background:var(--yellow);padding:3px 15px 5px;border-radius:var(--pill);
  transform:rotate(-5deg);box-shadow:0 7px 16px rgba(28,63,96,.25);white-space:nowrap;z-index:3;}
.frontflow .mcard .mascot{width:84%;max-width:280px;height:auto;filter:drop-shadow(0 16px 22px rgba(28,63,96,.28));}
.frontflow .mcard .mlabel{margin-top:6px;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);}
.frontflow .console{padding:26px 28px;display:flex;flex-direction:column;}
.frontflow .console .ch{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;}
.frontflow .console .ch h3{font-family:var(--font-head);font-size:25px;font-weight:800;color:var(--navy);}
.frontflow .console .ch .chip{flex:none;white-space:nowrap;font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--accent-deep);
  padding:4px 11px;border-radius:var(--pill);border:1px solid rgba(46,120,194,.4);background:rgba(95,184,255,.12);}
.frontflow .console .note{margin-top:13px;font-size:14px;line-height:1.6;color:var(--muted);}
.frontflow .facts{margin-top:18px;display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.frontflow .fact{padding-top:13px;border-top:1px solid var(--gborder);}
.frontflow .fact .k{font-size:10.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:var(--faint);}
.frontflow .fact .v{margin-top:5px;font-size:13.5px;line-height:1.5;color:var(--ink);font-weight:500;}

/* ---------- milestones ---------- */
.frontflow .section{padding:clamp(42px,6vw,84px) 0;}
.frontflow .sec-head{text-align:center;display:flex;flex-direction:column;align-items:center;margin-bottom:40px;}
.frontflow .sec-head h2{font-family:var(--font-head);font-weight:800;font-size:clamp(30px,4vw,50px);line-height:1.05;
  color:var(--navy);margin-top:14px;letter-spacing:-.01em;}
.frontflow .sec-head p{margin-top:12px;max-width:54ch;font-size:14.5px;line-height:1.6;color:var(--muted);}
.frontflow .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
.frontflow .ms{position:relative;padding:24px 24px 22px;display:flex;flex-direction:column;gap:13px;overflow:hidden;
  transition:transform .25s var(--ease),box-shadow .25s var(--ease),border-color .25s;}
.frontflow .ms:hover{transform:translateY(-6px);box-shadow:0 26px 50px -22px rgba(28,63,96,.42),inset 0 1px 0 rgba(255,255,255,.8);border-color:var(--accent);}
.frontflow .ms-top{display:flex;align-items:center;justify-content:space-between;}
.frontflow .ms-no{font-family:var(--font-body);font-size:13px;font-weight:800;letter-spacing:.2em;color:var(--faint);}
.frontflow .ms-mascot{width:72px;height:72px;object-fit:contain;filter:drop-shadow(0 8px 12px rgba(28,63,96,.22));}
.frontflow .ms h3{font-family:var(--font-head);font-size:25px;font-weight:800;color:var(--navy);}
.frontflow .ms p{font-size:13.5px;line-height:1.62;color:var(--muted);flex:1;}
.frontflow .badge{align-self:flex-start;display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;
  padding:5px 12px;border-radius:var(--pill);border:1px solid;white-space:nowrap;}
.frontflow .badge .bd{flex:none;width:7px;height:7px;border-radius:50%;}
.frontflow .b-done{color:var(--green);border-color:rgba(63,143,95,.4);background:rgba(63,143,95,.1);}
.frontflow .b-done .bd{background:var(--green);}
.frontflow .b-active{color:var(--accent-deep);border-color:rgba(46,120,194,.4);background:rgba(95,184,255,.14);}
.frontflow .b-active .bd{background:var(--accent-deep);}
.frontflow .b-opt{color:var(--warn);border-color:rgba(201,138,22,.4);background:rgba(243,201,76,.18);}
.frontflow .b-opt .bd{background:var(--warn);}
.frontflow .meter{margin-top:4px;height:5px;border-radius:99px;background:rgba(28,63,96,.1);overflow:hidden;}
.frontflow .meter i{display:block;height:100%;border-radius:99px;}
.frontflow .m-done i{width:100%;background:var(--green);}
.frontflow .m-active i{width:62%;background:linear-gradient(90deg,var(--accent),var(--accent-deep));}
.frontflow .m-opt i{width:100%;background:repeating-linear-gradient(90deg,var(--warn) 0 8px,transparent 8px 16px);opacity:.7;}

/* ---------- closing ---------- */
.frontflow .closing{position:relative;padding:clamp(36px,5vw,58px) clamp(28px,5vw,64px);overflow:hidden;
  display:grid;grid-template-columns:1.25fr .75fr;gap:38px;align-items:center;
  background:radial-gradient(80% 120% at 88% 10%,rgba(95,184,255,.2),transparent 60%),var(--panel-solid);}
.frontflow .closing h2{font-family:var(--font-head);font-weight:800;font-size:clamp(28px,3.4vw,46px);line-height:1.08;
  color:var(--navy);margin:14px 0;letter-spacing:-.01em;max-width:18ch;}
.frontflow .closing p{font-size:15px;line-height:1.65;color:var(--muted);max-width:50ch;}
.frontflow .closing .cta-row{margin-top:28px;justify-content:flex-start;}
.frontflow .closing-art{position:relative;display:flex;justify-content:center;}
.frontflow .closing-art img{width:82%;height:auto;filter:drop-shadow(0 18px 24px rgba(28,63,96,.26));}
.frontflow .closing-art .ring{position:absolute;inset:8% 10%;border-radius:50%;border:1.5px dashed rgba(46,120,194,.32);}

.frontflow footer{position:relative;z-index:2;text-align:center;padding:34px 20px 46px;color:var(--faint);font-size:12.5px;}

/* reveal — transform only (capture-safe) */
@keyframes ff-rvin{from{transform:translateY(24px);}to{transform:none;}}
.frontflow .rv{animation:ff-rvin .7s var(--ease) both;}
.frontflow .deck{animation-delay:.12s;}
.frontflow .grid3 .ms:nth-child(2){animation-delay:.1s;}
.frontflow .grid3 .ms:nth-child(3){animation-delay:.2s;}
@media (prefers-reduced-motion:reduce){.frontflow .rv{animation:none!important;}}

/* responsive */
@media (max-width:960px){
  .frontflow .deck{grid-template-columns:1fr;}
  .frontflow .mcard{max-width:420px;margin:0 auto;}
  .frontflow .grid3{grid-template-columns:1fr;}
  .frontflow .closing{grid-template-columns:1fr;}
  .frontflow .closing-art{order:-1;max-width:280px;margin:0 auto;}
  .frontflow .closing .cta-row{justify-content:center;}
}
@media (max-width:540px){
  .frontflow .facts{grid-template-columns:1fr;}
  .frontflow .btn{flex:1;justify-content:center;}
}
`;

export default function HomePage() {
  return (
    <div className={`frontflow ${playfair.variable} ${caveat.variable}`}>
      <style>{styles}</style>
      <div className="field" aria-hidden="true" />
      <div className="scan" aria-hidden="true" />

      <header>
        <Link className="brand" href="/" aria-label="SileTravel home">
          <Image src="/front-flow/soha-logo.png" alt="SileTravel" width={46} height={46} priority />
          <span className="bt">
            <b>SileTravel</b>
            <span>Front Flow · 2026</span>
          </span>
        </Link>
      </header>

      <main className="shell">
        {/* BLOCK A — HERO */}
        <section className="hero rv">
          <span className="eyebrow c">Frontend design roadmap</span>
          <h1>
            <span className="front">Front</span>
            <span className="flow">Flow</span>
          </h1>
          <p className="lead">
            Trang chủ này dùng để thể hiện tiến trình nâng cấp UI/UX của website theo hướng
            futuristic blue, tập trung vào bố cục rõ, cảm giác cao cấp và thao tác nhanh.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/dashboard">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
              Vào Dashboard
            </Link>
            <Link className="btn btn-ghost" href="/upload">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M17 8l-5-5-5 5" />
                <path d="M12 3v12" />
              </svg>
              Mở luồng tải tài liệu
            </Link>
          </div>
        </section>

        {/* BLOCK A — STATUS / CONTROL DECK */}
        <section className="deck rv">
          <div className="mcard glass">
            <span className="tag-hand">2026 Visual</span>
            <Image
              className="mascot"
              src="/front-flow/mascot-cat-dashboard.png"
              alt="Mascot mèo cầm bảng điều khiển"
              width={2000}
              height={1414}
            />
            <span className="mlabel">Design preview</span>
          </div>
          <div className="console glass">
            <div className="ch">
              <h3>Design status · 2026</h3>
              <span className="chip">2026 Visual</span>
            </div>
            <p className="note">
              Home này là điểm vào chính để theo dõi định hướng frontend trước khi đi vào các màn hình
              nghiệp vụ.
            </p>
            <div className="facts">
              <div className="fact">
                <div className="k">Style</div>
                <div className="v">Premium glass · Blue futuristic · Motion streaks</div>
              </div>
              <div className="fact">
                <div className="k">Mục tiêu</div>
                <div className="v">Đồng bộ trải nghiệm từ trang chủ đến dashboard/review</div>
              </div>
            </div>
          </div>
        </section>

        {/* BLOCK B — MILESTONES */}
        <section className="section">
          <div className="sec-head rv">
            <span className="eyebrow c">Roadmap</span>
            <h2>Ba chặng của Front Flow</h2>
            <p>
              Lộ trình nâng cấp giao diện, từ nền tảng visual đến tinh chỉnh chuyển động trên toàn bộ
              sản phẩm.
            </p>
          </div>
          <div className="grid3">
            <article className="ms glass rv">
              <div className="ms-top">
                <span className="ms-no">01 / Nền tảng</span>
                <Image className="ms-mascot" src="/front-flow/mascot-capybara-import.png" alt="" width={2000} height={1414} />
              </div>
              <h3>Foundation</h3>
              <span className="badge b-done">
                <span className="bd" />
                Đã hoàn thành
              </span>
              <p>Chuẩn hóa visual token, surface glass, typography và hệ màu chủ đạo.</p>
              <div className="meter m-done">
                <i />
              </div>
            </article>
            <article className="ms glass rv">
              <div className="ms-top">
                <span className="ms-no">02 / Màn hình</span>
                <Image className="ms-mascot" src="/front-flow/mascot-fox-explore.png" alt="" width={2000} height={1414} />
              </div>
              <h3>Core pages</h3>
              <span className="badge b-active">
                <span className="bd" />
                Đang triển khai
              </span>
              <p>Nâng cấp dashboard, upload, review, history và admin về cùng một visual language.</p>
              <div className="meter m-active">
                <i />
              </div>
            </article>
            <article className="ms glass rv">
              <div className="ms-top">
                <span className="ms-no">03 / Tinh chỉnh</span>
                <Image className="ms-mascot" src="/front-flow/mascot-otter-reports.png" alt="" width={2000} height={1414} />
              </div>
              <h3>Polish</h3>
              <span className="badge b-opt">
                <span className="bd" />
                Tiếp tục tối ưu
              </span>
              <p>Tinh chỉnh chuyển động, responsive và trải nghiệm thao tác thực tế.</p>
              <div className="meter m-opt">
                <i />
              </div>
            </article>
          </div>
        </section>

        {/* BLOCK C — CLOSING */}
        <section className="section">
          <div className="closing glass rv">
            <div className="closing-copy">
              <span className="eyebrow">Next step</span>
              <h2>Chọn điểm vào phù hợp với tác vụ của bạn</h2>
              <p>
                Dashboard cho góc nhìn tổng quan, Upload cho intake workflow, và các màn hình còn lại
                bám theo cùng ngôn ngữ thiết kế.
              </p>
              <div className="cta-row">
                <Link className="btn btn-primary" href="/dashboard">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                  Đi tới Dashboard
                </Link>
                <Link className="btn btn-ghost" href="/upload">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M17 8l-5-5-5 5" />
                    <path d="M12 3v12" />
                  </svg>
                  Đi tới Upload
                </Link>
              </div>
            </div>
            <div className="closing-art">
              <span className="ring" aria-hidden="true" />
              <Image src="/front-flow/mascot-bunny-validate.png" alt="Mascot thỏ kiểm duyệt" width={2000} height={1414} />
            </div>
          </div>
        </section>
      </main>

      <footer>Front Flow · SileTravel design direction</footer>
    </div>
  );
}
