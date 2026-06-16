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
.ffaurora{
  --bg0:#060d1a; --bg1:#0b1d33; --bg2:#0e2945;
  --navy:#1C3F60; --sky:#5DA9D6; --slate:#6E89A6;
  --azure:#5FB8FF; --cyan:#86ecff;
  --ink:#EAF3FF; --muted:#9FB6D2; --faint:#6E86A6;
  --yellow:#F3C94C; --terra:#E6764F; --green:#79DBA0; --warn:#F2C463;
  --accent:#5FB8FF;
  --glass:rgba(146,184,230,.07);
  --glass-strong:rgba(150,190,235,.12);
  --gborder:rgba(170,205,245,.16);
  --ghi:rgba(255,255,255,.22);
  --blur:18px;
  --r:22px; --r-lg:30px; --pill:999px;
  --maxw:1280px;
  --font-head:var(--font-playfair),Georgia,serif;
  --font-body:var(--font-inter),system-ui,sans-serif;
  --font-hand:var(--font-caveat),cursive;
  --ease:cubic-bezier(.16,1,.3,1);
  position:relative;min-height:100vh;overflow-x:hidden;
  font-family:var(--font-body);color:var(--ink);
  -webkit-font-smoothing:antialiased;
}
.ffaurora *{box-sizing:border-box;margin:0;padding:0;}

/* ---------- background field ---------- */
.ffaurora .field{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;
  background:
   radial-gradient(120% 80% at 78% -8%, rgba(95,184,255,.20), transparent 55%),
   radial-gradient(90% 70% at 8% 105%, rgba(28,63,96,.55), transparent 60%),
   radial-gradient(60% 50% at 50% 50%, rgba(14,41,69,.5), transparent 70%),
   linear-gradient(160deg,var(--bg1),var(--bg0) 70%);}
.ffaurora .streak{position:absolute;border-radius:50%;filter:blur(70px);opacity:.5;mix-blend-mode:screen;}
.ffaurora .s1{width:48vw;height:48vw;left:55%;top:-18%;background:radial-gradient(circle,var(--accent),transparent 62%);animation:ff-drift1 26s var(--ease) infinite alternate;}
.ffaurora .s2{width:40vw;height:40vw;left:-12%;top:38%;background:radial-gradient(circle,#2f6fae,transparent 62%);animation:ff-drift2 32s var(--ease) infinite alternate;}
.ffaurora .s3{width:30vw;height:30vw;left:40%;top:70%;background:radial-gradient(circle,var(--cyan),transparent 60%);opacity:.28;animation:ff-drift3 30s var(--ease) infinite alternate;}
.ffaurora .beam{position:absolute;width:160%;height:2px;left:-30%;background:linear-gradient(90deg,transparent,rgba(134,236,255,.55),transparent);filter:blur(1px);opacity:.5;}
.ffaurora .beam.b1{top:30%;transform:rotate(-8deg);animation:ff-beam 14s linear infinite;}
.ffaurora .beam.b2{top:62%;transform:rotate(-8deg);animation:ff-beam 19s linear infinite;animation-delay:-6s;opacity:.3;}
@keyframes ff-drift1{to{transform:translate(-8%,12%) scale(1.12);}}
@keyframes ff-drift2{to{transform:translate(10%,-8%) scale(1.1);}}
@keyframes ff-drift3{to{transform:translate(-12%,-10%) scale(1.18);}}
@keyframes ff-beam{0%{transform:translateX(-12%) rotate(-8deg);}100%{transform:translateX(12%) rotate(-8deg);}}
.ffaurora .grain{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.5;
  background-image:radial-gradient(rgba(180,210,255,.05) 1px,transparent 1px);background-size:4px 4px;}
@media (prefers-reduced-motion:reduce){.ffaurora .streak,.ffaurora .beam{animation:none!important;}}

/* ---------- shell ---------- */
.ffaurora .shell{position:relative;z-index:2;max-width:var(--maxw);margin:0 auto;padding:0 clamp(20px,4vw,56px);}

/* glass primitive */
.ffaurora .glass{background:var(--glass);border:1px solid var(--gborder);border-radius:var(--r);
  -webkit-backdrop-filter:blur(var(--blur));backdrop-filter:blur(var(--blur));
  box-shadow:0 24px 60px -20px rgba(0,0,0,.6), inset 0 1px 0 var(--ghi);}

/* ---------- header ---------- */
.ffaurora header{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;
  gap:16px;max-width:var(--maxw);margin:0 auto;padding:22px clamp(20px,4vw,56px);}
.ffaurora .brand{display:flex;align-items:center;gap:13px;text-decoration:none;color:var(--ink);}
.ffaurora .brand img{width:46px;height:46px;object-fit:contain;filter:drop-shadow(0 4px 10px rgba(0,0,0,.4));}
.ffaurora .brand .bt{display:flex;flex-direction:column;line-height:1.05;}
.ffaurora .brand .bt b{font-size:16px;letter-spacing:.02em;}
.ffaurora .brand .bt span{font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--muted);}

.ffaurora .eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:12px;font-weight:700;
  letter-spacing:.28em;text-transform:uppercase;color:var(--accent);}
.ffaurora .eyebrow::before{content:"";width:30px;height:1px;background:linear-gradient(90deg,var(--accent),transparent);}

/* ---------- hero ---------- */
.ffaurora .hero{display:grid;grid-template-columns:1.15fr .85fr;gap:clamp(28px,4vw,64px);
  align-items:center;padding:clamp(28px,5vw,72px) 0 clamp(40px,6vw,90px);}
.ffaurora .hero h1{font-family:var(--font-head);font-weight:900;line-height:.86;letter-spacing:-.02em;
  font-size:clamp(64px,11vw,170px);margin:18px 0 0;color:#fff;
  text-shadow:0 0 60px rgba(95,184,255,.35);}
.ffaurora .hero h1 .flow{display:block;font-style:italic;font-weight:800;
  background:linear-gradient(100deg,var(--cyan),var(--accent) 55%,#cfe6ff);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  text-shadow:none;}
.ffaurora .lead{margin-top:26px;max-width:46ch;font-size:clamp(16px,1.4vw,19px);line-height:1.65;color:var(--muted);}
.ffaurora .cta-row{display:flex;flex-wrap:wrap;gap:16px;margin-top:34px;}
.ffaurora .btn{display:inline-flex;align-items:center;gap:11px;font-family:var(--font-body);font-weight:700;
  font-size:16px;padding:16px 28px;border-radius:var(--pill);cursor:pointer;text-decoration:none;
  border:1px solid transparent;white-space:nowrap;transition:transform .2s var(--ease),box-shadow .2s var(--ease),background .2s;}
.ffaurora .btn svg{width:19px;height:19px;flex:none;}
.ffaurora .btn-primary{color:#04243f;background:linear-gradient(120deg,var(--cyan),var(--accent));
  box-shadow:0 12px 36px -8px var(--accent),inset 0 1px 0 rgba(255,255,255,.5);}
.ffaurora .btn-primary:hover{transform:translateY(-3px);box-shadow:0 20px 50px -10px var(--accent),inset 0 1px 0 rgba(255,255,255,.6);}
.ffaurora .btn-ghost{color:var(--ink);background:var(--glass-strong);border-color:var(--gborder);
  -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);}
.ffaurora .btn-ghost:hover{transform:translateY(-3px);background:rgba(150,190,235,.18);border-color:var(--accent);}
.ffaurora .btn:active{transform:translateY(0);}

/* hero right — mascot orb + status */
.ffaurora .hero-panel{position:relative;padding:0;}
.ffaurora .orb{position:relative;border-radius:var(--r-lg);padding:26px 26px 0;overflow:hidden;
  background:radial-gradient(80% 70% at 50% 12%,rgba(95,184,255,.30),transparent 70%),var(--glass-strong);
  border:1px solid var(--gborder);-webkit-backdrop-filter:blur(var(--blur));backdrop-filter:blur(var(--blur));
  box-shadow:0 30px 70px -22px rgba(0,0,0,.7),inset 0 1px 0 var(--ghi);}
.ffaurora .orb .halo{position:absolute;left:50%;top:8%;width:74%;aspect-ratio:1;transform:translateX(-50%);
  border-radius:50%;background:radial-gradient(circle,rgba(134,236,255,.5),transparent 65%);filter:blur(24px);}
.ffaurora .mascot{position:relative;display:block;width:78%;height:auto;margin:6px auto -2px;
  filter:drop-shadow(0 24px 30px rgba(0,0,0,.5));}
.ffaurora .tag-hand{position:absolute;top:18px;right:16px;font-family:var(--font-hand);font-weight:700;
  font-size:23px;color:#06243f;background:var(--yellow);padding:4px 16px 6px;border-radius:var(--pill);
  transform:rotate(-5deg);box-shadow:0 8px 18px rgba(0,0,0,.35);z-index:4;white-space:nowrap;}
.ffaurora .status{margin-top:16px;padding:22px 24px;}
.ffaurora .status .st-head{display:flex;align-items:center;gap:10px;font-family:var(--font-head);
  font-size:21px;font-weight:800;color:#fff;}
.ffaurora .status .note{margin-top:12px;font-size:13.5px;line-height:1.6;color:var(--muted);}
.ffaurora .facts{margin-top:18px;display:flex;flex-direction:column;gap:12px;}
.ffaurora .fact{display:flex;gap:13px;align-items:flex-start;}
.ffaurora .fact .k{flex:none;width:60px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  color:var(--faint);padding-top:2px;}
.ffaurora .fact .v{font-size:13.5px;line-height:1.5;color:var(--ink);}

/* ---------- milestones ---------- */
.ffaurora .section{padding:clamp(40px,6vw,80px) 0;}
.ffaurora .sec-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:38px;}
.ffaurora .sec-head h2{font-family:var(--font-head);font-weight:800;font-size:clamp(30px,4vw,50px);line-height:1.05;
  color:#fff;margin-top:14px;letter-spacing:-.01em;}
.ffaurora .sec-head p{max-width:40ch;font-size:14.5px;line-height:1.6;color:var(--muted);}
.ffaurora .rail{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;position:relative;}
.ffaurora .rail::before{content:"";position:absolute;top:46px;left:8%;right:8%;height:1px;
  background:linear-gradient(90deg,transparent,var(--gborder) 12%,var(--gborder) 88%,transparent);}
.ffaurora .ms{position:relative;padding:26px 24px 28px;display:flex;flex-direction:column;gap:14px;
  transition:transform .25s var(--ease),box-shadow .25s var(--ease);}
.ffaurora .ms:hover{transform:translateY(-6px);box-shadow:0 34px 70px -24px rgba(0,0,0,.7),0 0 0 1px var(--accent) inset,inset 0 1px 0 var(--ghi);}
.ffaurora .ms-top{display:flex;align-items:center;justify-content:space-between;}
.ffaurora .ms-no{font-family:var(--font-head);font-style:italic;font-size:46px;font-weight:800;line-height:1;
  color:transparent;-webkit-text-stroke:1.3px var(--slate);opacity:.85;}
.ffaurora .ms-mascot{width:74px;height:74px;object-fit:contain;
  filter:drop-shadow(0 10px 14px rgba(0,0,0,.45));}
.ffaurora .ms h3{font-family:var(--font-head);font-size:25px;font-weight:800;color:#fff;}
.ffaurora .ms p{font-size:13.5px;line-height:1.62;color:var(--muted);}
.ffaurora .badge{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;
  padding:6px 13px;border-radius:var(--pill);border:1px solid;white-space:nowrap;}
.ffaurora .badge .bd{width:7px;height:7px;border-radius:50%;flex:none;}
.ffaurora .b-done{color:var(--green);border-color:rgba(121,219,160,.45);background:rgba(121,219,160,.1);}
.ffaurora .b-done .bd{background:var(--green);box-shadow:0 0 8px var(--green);}
.ffaurora .b-active{color:var(--cyan);border-color:rgba(134,236,255,.45);background:rgba(134,236,255,.1);}
.ffaurora .b-active .bd{background:var(--cyan);box-shadow:0 0 8px var(--cyan);animation:ff-pulse 1.8s ease-in-out infinite;}
.ffaurora .b-opt{color:var(--warn);border-color:rgba(242,196,99,.45);background:rgba(242,196,99,.1);}
.ffaurora .b-opt .bd{background:var(--warn);}
@keyframes ff-pulse{0%,100%{opacity:1;}50%{opacity:.35;}}

/* ---------- closing ---------- */
.ffaurora .closing{position:relative;padding:clamp(40px,5vw,64px) clamp(30px,5vw,72px);overflow:hidden;
  display:grid;grid-template-columns:1.3fr .7fr;gap:40px;align-items:center;}
.ffaurora .closing .halo2{position:absolute;right:-6%;top:-30%;width:46%;aspect-ratio:1;border-radius:50%;
  background:radial-gradient(circle,rgba(95,184,255,.32),transparent 65%);filter:blur(20px);pointer-events:none;}
.ffaurora .closing h2{font-family:var(--font-head);font-weight:800;font-size:clamp(28px,3.4vw,46px);line-height:1.08;
  color:#fff;margin:16px 0;letter-spacing:-.01em;max-width:18ch;}
.ffaurora .closing p{font-size:15px;line-height:1.65;color:var(--muted);max-width:50ch;}
.ffaurora .closing .cta-row{margin-top:30px;}
.ffaurora .closing-art{position:relative;display:flex;justify-content:center;}
.ffaurora .closing-art img{width:84%;height:auto;filter:drop-shadow(0 24px 30px rgba(0,0,0,.5));}
.ffaurora .closing-art .ring{position:absolute;inset:6% 8%;border-radius:50%;border:1px dashed rgba(134,236,255,.35);}

.ffaurora footer{position:relative;z-index:2;text-align:center;padding:36px 20px 48px;color:var(--faint);font-size:12.5px;}

/* reveal — CSS auto-play */
@keyframes ff-aurora-rvin{from{transform:translateY(26px);}to{transform:none;}}
.ffaurora .rv{animation:ff-aurora-rvin .7s var(--ease) both;}
.ffaurora .rv:nth-child(2){animation-delay:.1s;}
.ffaurora .hero-panel{animation-delay:.18s;}
.ffaurora .rail .ms:nth-child(2){animation-delay:.12s;}
.ffaurora .rail .ms:nth-child(3){animation-delay:.24s;}
@media (prefers-reduced-motion:reduce){.ffaurora .rv{animation:none!important;}}

/* ---------- responsive ---------- */
@media (max-width:980px){
  .ffaurora .hero{grid-template-columns:1fr;gap:36px;}
  .ffaurora .hero-panel{max-width:520px;}
  .ffaurora .rail{grid-template-columns:1fr;}
  .ffaurora .rail::before{display:none;}
  .ffaurora .closing{grid-template-columns:1fr;}
  .ffaurora .closing-art{order:-1;max-width:300px;margin:0 auto;}
}
@media (max-width:560px){
  .ffaurora header{flex-wrap:wrap;}
  .ffaurora .btn{flex:1;justify-content:center;}
}
`;

export default function AuroraPage() {
  return (
    <div className={`ffaurora ${playfair.variable} ${caveat.variable}`}>
      <style>{styles}</style>
      <div className="field" aria-hidden="true">
        <div className="streak s1" />
        <div className="streak s2" />
        <div className="streak s3" />
        <div className="beam b1" />
        <div className="beam b2" />
      </div>
      <div className="grain" aria-hidden="true" />

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
        <section className="hero">
          <div className="hero-copy rv">
            <span className="eyebrow">Frontend design roadmap</span>
            <h1>
              FRONT<span className="flow">FLOW</span>
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
          </div>

          <div className="hero-panel rv">
            <div className="orb">
              <span className="tag-hand">2026 Visual</span>
              <span className="halo" aria-hidden="true" />
              <Image
                className="mascot"
                src="/front-flow/mascot-cat-dashboard.png"
                alt="Mascot mèo cầm bảng điều khiển"
                width={2000}
                height={1414}
              />
            </div>
            <div className="status glass">
              <div className="st-head">Design status · 2026</div>
              <p className="note">
                Home này là điểm vào chính để theo dõi định hướng frontend trước khi đi vào các màn hình
                nghiệp vụ.
              </p>
              <div className="facts">
                <div className="fact">
                  <span className="k">Style</span>
                  <span className="v">Premium glass · Blue futuristic · Motion streaks</span>
                </div>
                <div className="fact">
                  <span className="k">Mục tiêu</span>
                  <span className="v">Đồng bộ trải nghiệm từ trang chủ đến dashboard/review</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BLOCK B — MILESTONES */}
        <section className="section">
          <div className="sec-head rv">
            <div>
              <span className="eyebrow">Roadmap</span>
              <h2>Ba chặng của Front Flow</h2>
            </div>
            <p>
              Lộ trình nâng cấp giao diện, từ nền tảng visual đến tinh chỉnh chuyển động trên toàn bộ
              sản phẩm.
            </p>
          </div>
          <div className="rail">
            <article className="ms glass rv">
              <div className="ms-top">
                <span className="ms-no">01</span>
                <Image className="ms-mascot" src="/front-flow/mascot-capybara-import.png" alt="" width={2000} height={1414} />
              </div>
              <h3>Foundation</h3>
              <span className="badge b-done">
                <span className="bd" />
                Đã hoàn thành
              </span>
              <p>Chuẩn hóa visual token, surface glass, typography và hệ màu chủ đạo.</p>
            </article>
            <article className="ms glass rv">
              <div className="ms-top">
                <span className="ms-no">02</span>
                <Image className="ms-mascot" src="/front-flow/mascot-fox-explore.png" alt="" width={2000} height={1414} />
              </div>
              <h3>Core pages</h3>
              <span className="badge b-active">
                <span className="bd" />
                Đang triển khai
              </span>
              <p>Nâng cấp dashboard, upload, review, history và admin về cùng một visual language.</p>
            </article>
            <article className="ms glass rv">
              <div className="ms-top">
                <span className="ms-no">03</span>
                <Image className="ms-mascot" src="/front-flow/mascot-otter-reports.png" alt="" width={2000} height={1414} />
              </div>
              <h3>Polish</h3>
              <span className="badge b-opt">
                <span className="bd" />
                Tiếp tục tối ưu
              </span>
              <p>Tinh chỉnh chuyển động, responsive và trải nghiệm thao tác thực tế.</p>
            </article>
          </div>
        </section>

        {/* BLOCK C — CLOSING */}
        <section className="section">
          <div className="closing glass rv">
            <span className="halo2" aria-hidden="true" />
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
