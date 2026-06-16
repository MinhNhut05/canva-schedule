import { Caveat, Playfair_Display } from "next/font/google";
import { AppMobileTopbar, AppSidebar } from "@/components/app-sidebar";
import { auth } from "@/lib/auth";
import { signOutAction } from "./actions";

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

const shellStyles = `
.soha-app,.sb-scope{
  --bg:#FFF7DF;--bg-soft:#F7E8C9;--surface:#FFFDF5;--surface-alt:#F8EFD7;
  --text:#222;--muted:#6D6659;--ink:#2A2A2A;
  --primary:#1C3F60;--primary-soft:#DDEAF3;--accent:#D95F3D;--accent-soft:#F8D8CB;
  --yellow:#F3C94C;--green:#78A85A;--blue:#5DA9D6;--slate:#6E89A6;--border:#D8C9A3;
  --success:#3F8F5F;--success-soft:#DCEEE0;--warning:#C98A16;--warning-soft:#FAEBC6;
  --error:#C9473D;--error-soft:#F6D9D5;--info:#3E7CA8;--info-soft:#D7E8F2;
  --side-bg:#1C3F60;
  --r-sm:8px;--r-md:14px;--r-lg:20px;--r-xl:28px;--r-pill:999px;
  --sh-paper:4px 6px 0 rgba(34,34,34,.14);--sh-paper-sm:2px 3px 0 rgba(34,34,34,.14);
  --sh-soft:0 12px 30px rgba(34,34,34,.08);--sh-press:3px 4px 0 var(--ink);
  --ease:cubic-bezier(.16,1,.3,1);
  --font-head:var(--font-playfair),Georgia,serif;
  --font-body:var(--font-inter),system-ui,sans-serif;
  --font-hand:var(--font-caveat),cursive;
}
.soha-app{position:relative;min-height:100vh;background:var(--bg);color:var(--text);
  font-family:var(--font-body);-webkit-font-smoothing:antialiased;}
.app-grain{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.5;
  background-image:radial-gradient(rgba(120,100,60,.05) 1px,transparent 1px);background-size:4px 4px;}
.app-shell{position:relative;z-index:1;display:grid;grid-template-columns:240px 1fr;align-items:start;}
.app-main{min-width:0;}
.app-main-inner{width:100%;max-width:1140px;margin:0 auto;padding:clamp(20px,3vw,36px) clamp(16px,3vw,34px) 60px;}

/* ---------- sidebar (desktop aside + portal drawer share .sb-scope) ---------- */
.app-aside{position:sticky;top:0;align-self:start;height:100vh;overflow:hidden;
  background:var(--surface);border-right:2px solid var(--border);}
.sb-scope{display:flex;flex-direction:column;height:100%;background:var(--surface);
  font-family:var(--font-body);color:var(--text);}
.sb-inner{display:flex;flex-direction:column;height:100%;gap:18px;padding:22px 16px;overflow-y:auto;}
.sb-brand{display:flex;align-items:center;gap:11px;padding:0 6px;text-decoration:none;}
.sb-brand img{height:38px;width:auto;flex:none;}
.sb-brand .bt{display:flex;flex-direction:column;line-height:1.1;min-width:0;}
.sb-brand .nm{font-family:var(--font-head);font-weight:800;font-size:19px;color:var(--primary);}
.sb-brand .sub{font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-top:3px;}

.sb-nav{display:flex;flex-direction:column;gap:6px;}
.nav-item{position:relative;display:flex;align-items:center;gap:11px;padding:10px 13px;border-radius:var(--r-pill);
  border:2px solid transparent;color:var(--muted);font-weight:700;font-size:14.5px;text-decoration:none;cursor:pointer;
  transition:transform .15s var(--ease),background .15s,border-color .15s,color .15s;}
.nav-item .ic{flex:none;width:20px;height:20px;display:grid;place-items:center;color:currentColor;}
.nav-item .ic svg{width:19px;height:19px;}
.nav-item .lbl{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.nav-item .tail{flex:none;opacity:0;transform:translateX(-3px);color:var(--slate);transition:opacity .15s,transform .15s;}
.nav-item .tail svg{width:16px;height:16px;}
.nav-item .dot{flex:none;width:9px;height:9px;border-radius:50%;background:var(--yellow);border:2px solid var(--ink);}
.nav-item:hover{background:var(--surface-alt);color:var(--text);transform:translateX(2px);}
.nav-item:hover .tail{opacity:.55;transform:none;}
.nav-item:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft);}
.nav-item.active{background:var(--surface);border-color:var(--ink);box-shadow:var(--sh-paper-sm);color:var(--primary);font-weight:800;transform:none;}
.nav-item.active .tail{opacity:.5;transform:none;}

.sb-group{display:flex;flex-direction:column;gap:10px;}
.sb-divider{height:2px;background:var(--border);border-radius:2px;}
.sb-group-h{display:flex;align-items:center;gap:8px;padding:0 13px;font-size:11px;font-weight:800;
  letter-spacing:.14em;text-transform:uppercase;color:var(--muted);}
.sb-group-h svg{width:15px;height:15px;color:var(--primary);}

.sb-foot{margin-top:auto;display:flex;flex-direction:column;gap:12px;padding-top:6px;}
.sb-user{display:flex;align-items:center;gap:11px;background:var(--surface-alt);border:2px solid var(--border);
  border-radius:var(--r-md);padding:10px 12px;}
.sb-ava{flex:none;width:40px;height:40px;border-radius:10px;background:var(--primary);color:#FBF3DC;
  border:2px solid var(--ink);box-shadow:var(--sh-paper-sm);display:grid;place-items:center;
  font-family:var(--font-head);font-weight:800;font-size:18px;}
.sb-user .ut{min-width:0;}
.sb-user .ut .nm{font-weight:800;font-size:14px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sb-user .ut .un{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sb-logout{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:11px 14px;
  border-radius:var(--r-pill);border:2px solid var(--ink);background:var(--surface);color:var(--ink);
  font-family:var(--font-body);font-weight:800;font-size:14px;cursor:pointer;box-shadow:var(--sh-paper-sm);
  transition:transform .12s var(--ease),box-shadow .12s;}
.sb-logout svg{width:17px;height:17px;}
.sb-logout:hover{transform:translate(-1px,-1px);box-shadow:3px 4px 0 var(--ink);}
.sb-logout:active{transform:translate(2px,3px);box-shadow:none;}
.sb-logout:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft);}

/* ---------- mobile top bar + drawer ---------- */
.app-topbar{display:none;position:sticky;top:0;z-index:30;align-items:center;gap:12px;
  padding:11px 15px;background:var(--surface);border-bottom:2px solid var(--border);}
.app-burger{flex:none;display:grid;place-items:center;width:42px;height:42px;border-radius:12px;
  border:2px solid var(--ink);background:var(--surface);color:var(--ink);box-shadow:var(--sh-paper-sm);
  cursor:pointer;transition:transform .12s var(--ease),box-shadow .12s;}
.app-burger svg{width:20px;height:20px;}
.app-burger:hover{transform:translate(-1px,-1px);box-shadow:3px 4px 0 var(--ink);}
.app-burger:active{transform:translate(2px,3px);box-shadow:none;}
.app-tb-brand{display:flex;align-items:center;gap:9px;text-decoration:none;}
.app-tb-brand img{height:30px;width:auto;}
.app-tb-brand .nm{font-family:var(--font-head);font-weight:800;font-size:17px;color:var(--primary);}
.sb-drawer{background:var(--surface);border:0;border-right:2px solid var(--border);}

@media (max-width:767px){
  .app-shell{grid-template-columns:1fr;}
  .app-aside{display:none;}
  .app-topbar{display:flex;}
}
@media (prefers-reduced-motion:reduce){
  .nav-item,.sb-logout,.app-burger{transition:none;}
}
`;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const fontClass = `${playfair.variable} ${caveat.variable}`;
  const role = session?.user?.role ?? "member";

  return (
    <div className={`soha-app ${fontClass}`}>
      <style>{shellStyles}</style>
      <div className="app-grain" aria-hidden="true" />

      <AppMobileTopbar
        fullName={session?.user?.name}
        username={session?.user?.username}
        role={role}
        signOutAction={signOutAction}
        fontClass={fontClass}
      />

      <div className="app-shell">
        <AppSidebar
          fullName={session?.user?.name}
          username={session?.user?.username}
          role={role}
          signOutAction={signOutAction}
          fontClass={fontClass}
        />

        <main className="app-main">
          <div className="app-main-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
