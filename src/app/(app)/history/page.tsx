import { Suspense } from "react";
import NextImage from "next/image";
import { redirect } from "next/navigation";
import { History, ShieldCheck } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HistoryToolbar } from "./_components/history-toolbar";
import { HistoryTable, type HistoryJob } from "./_components/history-table";
import { HistoryEmpty } from "./_components/history-empty";
import { HistoryPagination } from "./_components/history-pagination";
import { HistorySkeleton } from "./_components/history-skeleton";

const PAGE_SIZE = 20;

type StatusFilter = "all" | "success" | "error";

const histStyles = `
.soha-hist{display:flex;flex-direction:column;gap:22px;}
.soha-hist svg{display:block;}

/* generic paper card */
.soha-hist .card{position:relative;background:var(--surface);border:2px solid var(--border);
  border-radius:var(--r-xl);box-shadow:var(--sh-paper);padding:clamp(22px,2.6vw,32px);}

/* kicker */
.soha-hist .kicker{display:inline-flex;align-items:center;gap:8px;
  background:color-mix(in srgb,var(--primary) 16%,var(--surface));
  border:1.5px solid color-mix(in srgb,var(--primary) 40%,var(--border));color:var(--primary);
  font-size:11.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;
  border-radius:var(--r-pill);padding:5px 12px;white-space:nowrap;}
.soha-hist .kicker svg{width:13px;height:13px;}

/* pill button */
.soha-hist .btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;font-weight:800;font-size:15px;
  border-radius:var(--r-pill);padding:13px 22px;border:2px solid var(--ink);cursor:pointer;text-decoration:none;
  background:var(--yellow);color:var(--ink);box-shadow:var(--sh-press);
  transition:transform .12s var(--ease),box-shadow .12s;}
.soha-hist .btn svg{width:18px;height:18px;}
.soha-hist .btn:hover{transform:translate(-1px,-1px);box-shadow:4px 5px 0 var(--ink);}
.soha-hist .btn:active{transform:translate(3px,4px);box-shadow:none;}
.soha-hist .btn:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft),var(--sh-press);}

/* status badge */
.soha-hist .status{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:800;
  border-radius:var(--r-pill);padding:5px 13px;border:2px solid;white-space:nowrap;}
.soha-hist .status svg{width:15px;height:15px;}
.soha-hist .status.green{background:var(--success-soft);border-color:#A6D2B2;color:#246B43;}
.soha-hist .status.red{background:var(--error-soft);border-color:#E0A59E;color:#8E2C24;}

/* ============ HEADER ============ */
.soha-hist .hist-head{display:grid;grid-template-columns:1fr auto;gap:clamp(18px,3vw,40px);
  align-items:center;overflow:hidden;}
.soha-hist .hh-main{min-width:0;}
.soha-hist .hist-head h1{font-family:var(--font-head);font-weight:800;font-size:clamp(28px,3.2vw,40px);
  color:var(--text);line-height:1.08;margin:14px 0 11px;text-wrap:balance;}
.soha-hist .hist-head .sub{font-size:15.5px;line-height:1.6;color:var(--muted);max-width:60ch;}
.soha-hist .syschip{display:inline-flex;align-items:center;gap:7px;margin-top:15px;
  background:var(--surface-alt);color:var(--primary);border:1.5px solid var(--border);
  font-size:12px;font-weight:800;letter-spacing:.04em;border-radius:var(--r-pill);padding:6px 13px;}
.soha-hist .syschip svg{width:14px;height:14px;color:var(--primary);}

.soha-hist .hh-mascot{position:relative;flex:none;align-self:end;display:flex;align-items:flex-end;
  justify-content:center;padding:6px 6px 0;}
.soha-hist .hh-mascot::before{content:"";position:absolute;left:50%;bottom:6px;transform:translateX(-50%);
  width:158px;height:58px;border-radius:50%;background:var(--primary);opacity:.12;filter:blur(2px);}
.soha-hist .hh-mascot img{position:relative;width:clamp(120px,12vw,158px);height:auto;z-index:1;
  filter:drop-shadow(4px 6px 0 rgba(0,0,0,.13));}
.soha-hist .hand-tag{position:absolute;top:0;right:-2px;z-index:2;font-family:var(--font-hand);font-size:21px;
  font-weight:700;color:var(--ink);background:var(--yellow);border:2px solid var(--ink);padding:1px 14px;
  border-radius:var(--r-pill);box-shadow:var(--sh-paper-sm);transform:rotate(-4deg);}

/* ----- tools (search + filter chips) ----- */
.soha-hist .tools{display:flex;align-items:center;gap:11px;flex-wrap:wrap;margin-top:20px;}
.soha-hist .search{display:flex;align-items:center;gap:9px;flex:1;min-width:200px;max-width:330px;
  background:var(--surface-alt);border:2px solid var(--border);border-radius:var(--r-pill);padding:9px 16px;}
.soha-hist .search svg{width:17px;height:17px;color:var(--slate);flex:none;}
.soha-hist .search input{border:0;background:transparent;font:inherit;font-size:14px;color:var(--text);width:100%;outline:none;}
.soha-hist .search input::placeholder{color:var(--slate);}
.soha-hist .search:focus-within{border-color:var(--info);box-shadow:0 0 0 4px var(--info-soft);}
.soha-hist .fchips{display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
.soha-hist .fchips .fl{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;
  letter-spacing:.08em;text-transform:uppercase;color:var(--slate);margin-right:2px;}
.soha-hist .fchips .fl svg{width:14px;height:14px;}
.soha-hist .fchip{display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:12.5px;
  font-family:inherit;border:2px solid var(--border);background:var(--surface);color:var(--muted);
  border-radius:var(--r-pill);padding:7px 14px;cursor:pointer;
  transition:transform .12s var(--ease),background .12s,color .12s,border-color .12s,box-shadow .12s;}
.soha-hist .fchip:hover{background:var(--surface-alt);transform:translateY(-1px);}
.soha-hist .fchip:active{transform:translateY(1px);}
.soha-hist .fchip:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft);border-color:var(--info);}
.soha-hist .fchip.on{background:var(--primary-soft);border-color:#A9CBE0;color:var(--primary);}
.soha-hist .fchip .cdot{width:8px;height:8px;border-radius:50%;}
.soha-hist .fchip .cdot.g{background:var(--green);}
.soha-hist .fchip .cdot.r{background:var(--error);}

/* ============ TABLE CARD ============ */
.soha-hist .tbl-card{padding:0;overflow:hidden;}
.soha-hist .tbl-cap{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px 15px;}
.soha-hist .tbl-cap .h{font-family:var(--font-head);font-weight:800;font-size:19px;color:var(--text);white-space:nowrap;}
.soha-hist .tbl-cap .cnt{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:var(--slate);
  font-weight:700;white-space:nowrap;flex:none;}
.soha-hist .tbl-cap .cnt svg{width:15px;height:15px;}

.soha-hist .tbl-scroll{overflow-x:auto;scrollbar-width:thin;scrollbar-color:var(--border) transparent;}
.soha-hist .tbl-scroll::-webkit-scrollbar{height:9px;}
.soha-hist .tbl-scroll::-webkit-scrollbar-thumb{background:var(--border);border-radius:5px;}
.soha-hist .tbl{--cols:minmax(190px,2.4fr) 168px 138px 132px 156px 38px;min-width:880px;}
.soha-hist .tbl.admin{--cols:minmax(180px,2fr) 150px 168px 138px 124px 150px 38px;min-width:1010px;}

.soha-hist .thead{display:grid;grid-template-columns:var(--cols);gap:14px;align-items:center;padding:13px 22px;
  background:var(--surface-alt);border-top:2px solid var(--border);border-bottom:2px solid var(--ink);}
.soha-hist .thead .th{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#7A6A45;}
.soha-hist .thead .th.r{text-align:right;}

.soha-hist .tbody{display:flex;flex-direction:column;}
.soha-hist .trow{display:grid;grid-template-columns:var(--cols);gap:14px;align-items:center;width:100%;
  text-align:left;padding:14px 22px;background:var(--surface);border:0;border-bottom:1.5px solid var(--border);
  font:inherit;color:inherit;cursor:pointer;position:relative;z-index:1;
  transition:transform .14s var(--ease),box-shadow .14s,background .14s,border-radius .14s;}
.soha-hist .trow:last-child{border-bottom:0;}
.soha-hist .trow:hover{background:var(--surface-alt);transform:translateY(-2px);box-shadow:var(--sh-paper-sm);
  border-radius:var(--r-md);z-index:2;}
.soha-hist .trow:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft);border-radius:var(--r-md);z-index:3;}

.soha-hist .td{min-width:0;}
.soha-hist .cl{display:none;}
.soha-hist .td-file{display:flex;align-items:center;gap:12px;min-width:0;}
.soha-hist .td-file .fi{flex:none;width:38px;height:38px;border-radius:11px;border:2px solid var(--ink);
  display:grid;place-items:center;box-shadow:var(--sh-paper-sm);color:#fff;}
.soha-hist .td-file .fi.pdf{background:var(--accent);}
.soha-hist .td-file .fi.docx{background:var(--blue);}
.soha-hist .td-file .fi svg{width:19px;height:19px;}
.soha-hist .td-file .nm{font-weight:800;font-size:14.5px;color:var(--text);line-height:1.3;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

.soha-hist .td-creator{display:flex;align-items:center;gap:9px;min-width:0;}
.soha-hist .td-creator .av{flex:none;width:30px;height:30px;border-radius:9px;border:2px solid var(--ink);
  background:var(--primary);color:#FBF3DC;display:grid;place-items:center;
  font-family:var(--font-head);font-weight:800;font-size:12.5px;}
.soha-hist .td-creator .nm{font-weight:600;font-size:13.5px;color:var(--text);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

.soha-hist .td-date{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:var(--muted);
  font-variant-numeric:tabular-nums;}
.soha-hist .td-date svg{width:15px;height:15px;color:var(--slate);flex:none;}

.soha-hist .tourpill{display:inline-flex;align-items:center;font-weight:700;font-size:12.5px;color:var(--primary);
  background:var(--surface-alt);border:1.5px solid var(--border);border-radius:var(--r-pill);padding:5px 12px;white-space:nowrap;}
.soha-hist .tourpill.none{color:var(--slate);}

.soha-hist .td-links{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;color:var(--text);}
.soha-hist .td-links svg{width:16px;height:16px;color:var(--green);flex:none;}
.soha-hist .td-links.partial svg{color:var(--warning);}
.soha-hist .td-links.none{color:var(--slate);font-weight:600;}
.soha-hist .td-links.none svg{color:var(--slate);opacity:.55;}

.soha-hist .td-go{justify-self:end;}
.soha-hist .trow .go{display:inline-flex;align-items:center;gap:5px;color:var(--slate);font-weight:800;font-size:12.5px;
  opacity:0;transform:translateX(-4px);transition:opacity .14s,transform .14s,color .14s;white-space:nowrap;}
.soha-hist .trow .go svg{width:16px;height:16px;}
.soha-hist .trow:hover .go,.soha-hist .trow:focus-visible .go{opacity:.85;transform:none;color:var(--primary);}

/* ----- skeleton ----- */
.soha-hist .skrow{display:grid;grid-template-columns:var(--cols);gap:14px;align-items:center;
  padding:17px 22px;border-bottom:1.5px solid var(--border);}
.soha-hist .skrow:last-child{border-bottom:0;}
.soha-hist .sk{height:13px;border-radius:var(--r-pill);background:var(--surface-alt);position:relative;overflow:hidden;}
.soha-hist .sk.fi{height:38px;width:38px;border-radius:11px;flex:none;}
.soha-hist .sk.badge{height:26px;border-radius:var(--r-pill);}
.soha-hist .skf{display:flex;align-items:center;gap:12px;min-width:0;}
.soha-hist .skf .skl{flex:1;display:flex;flex-direction:column;gap:7px;min-width:0;}
.soha-hist .sk::after{content:"";position:absolute;inset:0;transform:translateX(-100%);
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);}

/* ----- empty / no-result ----- */
.soha-hist .empty{display:flex;flex-direction:column;align-items:center;text-align:center;
  padding:clamp(34px,5vw,62px) 24px;gap:7px;}
.soha-hist .empty .ph{position:relative;margin-bottom:10px;}
.soha-hist .empty .ph img{width:clamp(140px,16vw,188px);height:auto;filter:drop-shadow(4px 6px 0 rgba(0,0,0,.12));}
.soha-hist .empty .ph .hand-tag{top:6px;right:-6px;font-size:19px;}
.soha-hist .empty h2{font-family:var(--font-head);font-weight:800;font-size:clamp(22px,2.4vw,27px);color:var(--text);}
.soha-hist .empty p{font-size:15px;line-height:1.6;color:var(--muted);max-width:44ch;}
.soha-hist .empty .btn{margin-top:18px;}
.soha-hist .empty.no-result{padding:48px 24px;}
.soha-hist .empty.no-result .ph img{width:120px;}
.soha-hist .empty.no-result h2{font-size:21px;}

/* ============ PAGINATION ============ */
.soha-hist .pager{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;padding:4px 2px 2px;}
.soha-hist .pager .pinfo{margin-right:auto;font-size:13px;color:var(--muted);font-weight:600;}
.soha-hist .pager .pinfo b{color:var(--text);font-weight:800;}
.soha-hist .pgbtn{min-width:42px;height:42px;display:inline-flex;align-items:center;justify-content:center;gap:6px;
  padding:0 13px;border:2px solid var(--border);background:var(--surface);color:var(--ink);
  font-weight:800;font-size:14px;border-radius:var(--r-md);cursor:pointer;box-shadow:var(--sh-paper-sm);text-decoration:none;
  transition:transform .12s var(--ease),box-shadow .12s,background .12s,color .12s,border-color .12s;}
.soha-hist .pgbtn svg{width:18px;height:18px;}
.soha-hist .pgbtn:hover{background:var(--surface-alt);transform:translate(-1px,-1px);box-shadow:3px 4px 0 rgba(34,34,34,.2);}
.soha-hist .pgbtn:active{transform:translate(1px,2px);box-shadow:none;}
.soha-hist .pgbtn:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft);border-color:var(--info);}
.soha-hist .pgbtn.on{background:var(--primary);color:#FBF3DC;border-color:var(--ink);box-shadow:var(--sh-press);}
.soha-hist .pgbtn.on:hover{transform:translate(-1px,-1px);box-shadow:4px 5px 0 var(--ink);}
.soha-hist .pgbtn.disabled{opacity:.4;cursor:default;box-shadow:none;transform:none;pointer-events:none;}
.soha-hist .pgdots{color:var(--slate);font-weight:800;padding:0 3px;align-self:flex-end;}

/* ============ RESPONSIVE ============ */
@media (max-width:900px){
  .soha-hist .hist-head{grid-template-columns:1fr;}
  .soha-hist .hh-mascot{display:none;}
}
/* mobile: table rows -> stacked cards */
@media (max-width:760px){
  .soha-hist .tbl-card{overflow:visible;}
  .soha-hist .tbl-scroll{overflow-x:visible;}
  .soha-hist .tbl,.soha-hist .tbl.admin{min-width:0;}
  .soha-hist .thead{display:none;}
  .soha-hist .tbody{padding:14px;gap:12px;display:flex;flex-direction:column;}
  .soha-hist .trow{display:block;border:2px solid var(--border);border-radius:var(--r-lg);
    padding:15px 16px;box-shadow:var(--sh-paper-sm);background:var(--surface);}
  .soha-hist .trow:last-child{border-bottom:2px solid var(--border);}
  .soha-hist .trow:hover{transform:none;border-radius:var(--r-lg);box-shadow:var(--sh-paper);}
  .soha-hist .trow:active{transform:translate(2px,3px);box-shadow:none;}
  .soha-hist .cl{display:inline;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--slate);}
  .soha-hist .td{display:flex;align-items:center;justify-content:space-between;gap:14px;
    padding:9px 0;border-top:1.5px dashed var(--border);}
  .soha-hist .td-file{padding:0 0 11px;border-top:0;}
  .soha-hist .td-file .nm{white-space:normal;font-size:16px;}
  .soha-hist .td-file .cl{display:none;}
  .soha-hist .td-go{padding-top:11px;border-top:1.5px dashed var(--border);}
  .soha-hist .td-go .cl{display:none;}
  .soha-hist .trow .go{opacity:1;transform:none;color:var(--primary);width:100%;justify-content:flex-end;}
  .soha-hist .skrow{display:flex;flex-direction:column;align-items:stretch;gap:11px;border:2px solid var(--border);
    border-radius:var(--r-lg);margin-bottom:12px;padding:16px;}
  .soha-hist .skrow:last-child{margin-bottom:0;}
  .soha-hist .pager{justify-content:center;}
  .soha-hist .pager .pinfo{width:100%;text-align:center;margin:0 0 6px;}
}

.soha-hist .spin{animation:histSpin 1s linear infinite;}
@keyframes histSpin{to{transform:rotate(360deg);}}

@media (prefers-reduced-motion:no-preference){
  .soha-hist .card{animation:histDrop .32s var(--ease);}
  .soha-hist .sk::after{animation:histShimmer 1.35s infinite;}
}
@keyframes histDrop{from{transform:translateY(-8px);}to{transform:none;}}
@keyframes histShimmer{to{transform:translateX(100%);}}
@media (prefers-reduced-motion:reduce){
  .soha-hist *{transition:none !important;animation:none !important;}
  .soha-hist .trow:hover{transform:none;}
}
`;

interface HistoryPageProps {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}

function parsePage(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 && String(parsed) === (raw ?? "1") ? parsed : 1;
}

function parseStatus(raw: string | undefined): StatusFilter {
  return raw === "success" || raw === "error" ? raw : "all";
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const isAdmin = session.user.role === "admin";
  const currentPage = parsePage(params.page);
  const query = (params.q ?? "").trim();
  const status = parseStatus(params.status);

  return (
    <div className="soha-hist">
      <style>{histStyles}</style>

      {/* ============ HEADER ============ */}
      <section className="card hist-head">
        <div className="hh-main">
          <span className="kicker">
            <History /> Lịch sử
          </span>
          <h1>Lịch sử xử lý</h1>
          <p className="sub">
            Theo dõi các tài liệu đã tải lên, trạng thái tạo Canva và mở lại bản review khi cần kiểm
            tra.
          </p>
          {isAdmin && (
            <span className="syschip">
              <ShieldCheck /> Toàn hệ thống · xem tài liệu của mọi nhân viên
            </span>
          )}
          <HistoryToolbar query={query} status={status} />
        </div>

        <div className="hh-mascot">
          <span className="hand-tag">Theo dõi</span>
          <NextImage
            src="/front-flow/mascot-otter-reports.png"
            alt=""
            aria-hidden="true"
            width={2000}
            height={1414}
          />
        </div>
      </section>

      <Suspense
        key={`${currentPage}-${query}-${status}`}
        fallback={<HistorySkeleton isAdmin={isAdmin} />}
      >
        <HistoryResults
          userId={session.user.id}
          isAdmin={isAdmin}
          currentPage={currentPage}
          query={query}
          status={status}
        />
      </Suspense>
    </div>
  );
}

interface HistoryResultsProps {
  userId: string;
  isAdmin: boolean;
  currentPage: number;
  query: string;
  status: StatusFilter;
}

async function HistoryResults({ userId, isAdmin, currentPage, query, status }: HistoryResultsProps) {
  const skip = (currentPage - 1) * PAGE_SIZE;

  const where = {
    ...(isAdmin ? {} : { userId }),
    ...(query ? { originalFileName: { contains: query, mode: "insensitive" as const } } : {}),
    ...(status === "success" ? { canvaArtifacts: { some: { status: "SUCCEEDED" } } } : {}),
    ...(status === "error" ? { canvaArtifacts: { none: { status: "SUCCEEDED" } } } : {}),
  };

  const [rows, totalCount] = await Promise.all([
    prisma.upload.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        originalFileName: true,
        createdAt: true,
        tourDuration: true,
        user: { select: { name: true, username: true } },
        canvaArtifacts: {
          select: { artifactType: true, status: true, designId: true },
          orderBy: { artifactType: "asc" },
        },
      },
    }),
    prisma.upload.count({ where }),
  ]);

  const hasFilter = query !== "" || status !== "all";

  if (totalCount === 0 && !hasFilter) {
    return <HistoryEmpty />;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const jobs: HistoryJob[] = rows.map((row) => {
    const succeeded = row.canvaArtifacts.filter((a) => a.status === "SUCCEEDED");
    const total = row.canvaArtifacts.length;
    const successCount = succeeded.length;

    const status: HistoryJob["status"] = successCount > 0 ? "success" : "error";

    let canvaLinkLabel: string;
    let canvaLinkKind: HistoryJob["canvaLinkKind"];
    if (successCount === 2) {
      canvaLinkLabel = "2 liên kết";
      canvaLinkKind = "full";
    } else if (successCount === 1 && total === 2) {
      canvaLinkLabel = "1/2 liên kết";
      canvaLinkKind = "partial";
    } else if (successCount === 1) {
      canvaLinkLabel = "1 liên kết";
      canvaLinkKind = "full";
    } else {
      canvaLinkLabel = "Chưa có liên kết";
      canvaLinkKind = "none";
    }

    let tourTypeLabel: string;
    if (row.tourDuration === "ONE_DAY") {
      tourTypeLabel = "Tour 1 ngày";
    } else if (row.tourDuration === "TWO_DAY") {
      tourTypeLabel = "Tour 2 ngày";
    } else if (row.tourDuration === "THREE_DAY") {
      tourTypeLabel = "Tour 3 ngày";
    } else if (row.tourDuration === "FOUR_DAY") {
      tourTypeLabel = "Tour 4 ngày";
    } else {
      tourTypeLabel = "Chưa xác định";
    }

    return {
      id: row.id,
      fileName: row.originalFileName,
      createdAt: row.createdAt.toISOString(),
      status,
      statusLabel: status === "success" ? "Thành công" : "Lỗi",
      tourTypeLabel,
      canvaLinkLabel,
      canvaLinkKind,
      creatorName: row.user?.name?.trim() || row.user?.username?.trim() || "—",
    };
  });

  return (
    <>
      <HistoryTable jobs={jobs} isAdmin={isAdmin} resultCount={totalCount} />
      {totalPages > 1 && (
        <HistoryPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          shownCount={jobs.length}
          query={query}
          status={status}
        />
      )}
    </>
  );
}
