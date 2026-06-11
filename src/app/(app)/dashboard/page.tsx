import NextImage from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  FileText,
  History,
  Image as ImageIcon,
  LayoutGrid,
  LayoutTemplate,
  ListChecks,
  Lock,
  Plug,
  ShieldCheck,
  Sparkles,
  Upload,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { getCanvaTokenStatus } from "@/lib/canva/oauth";
import { prisma } from "@/lib/db";
import { AI_STATUS, REVIEW_STATUS } from "@/lib/review/status";
import { StatCounter } from "./_components/stat-counter";

const dashStyles = `
.soha-dash{display:flex;flex-direction:column;gap:22px;}

/* generic paper card */
.soha-dash .card{position:relative;background:var(--surface);border:2px solid var(--border);
  border-radius:var(--r-xl);box-shadow:var(--sh-paper);padding:clamp(22px,2.6vw,32px);}

/* kicker */
.soha-dash .kicker{display:inline-flex;align-items:center;gap:8px;background:var(--primary-soft);color:var(--primary);
  border:1.5px solid #A9CBE0;font-size:11.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;
  border-radius:var(--r-pill);padding:5px 12px;}
.soha-dash .kicker svg{width:13px;height:13px;}

/* pill buttons */
.soha-dash .btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;font-weight:800;font-size:15px;
  border-radius:var(--r-pill);padding:13px 22px;border:2px solid var(--ink);cursor:pointer;text-decoration:none;
  background:var(--yellow);color:var(--ink);box-shadow:var(--sh-press);
  transition:transform .12s var(--ease),box-shadow .12s;}
.soha-dash .btn svg{width:18px;height:18px;}
.soha-dash .btn:hover{transform:translate(-1px,-1px);box-shadow:4px 5px 0 var(--ink);}
.soha-dash .btn:active{transform:translate(3px,4px);box-shadow:none;}
.soha-dash .btn.ghost{background:var(--surface);color:var(--ink);box-shadow:var(--sh-paper-sm);}
.soha-dash .btn.ghost:hover{background:var(--surface-alt);box-shadow:3px 4px 0 rgba(34,34,34,.2);}
.soha-dash .btn:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft),var(--sh-press);}

/* status badge */
.soha-dash .status{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:800;
  border-radius:var(--r-pill);padding:6px 14px;border:2px solid;white-space:nowrap;}
.soha-dash .status svg{width:15px;height:15px;}
.soha-dash .status .pulse{width:8px;height:8px;border-radius:50%;background:currentColor;}
.soha-dash .status.neutral{background:var(--surface-alt);border-color:var(--border);color:#7A6A45;}
.soha-dash .status.primary{background:var(--primary-soft);border-color:#A9CBE0;color:var(--primary);}
.soha-dash .status.green{background:var(--success-soft);border-color:#A6D2B2;color:#246B43;}
.soha-dash .status.amber{background:var(--warning-soft);border-color:#E5C878;color:#7A5A10;}
.soha-dash .status.red{background:var(--error-soft);border-color:#E0A59E;color:#8E2C24;}

/* ----- HERO ----- */
.soha-dash .hero{position:relative;overflow:hidden;}
.soha-dash .hero .h-in{position:relative;z-index:2;max-width:60ch;padding-right:clamp(0px,12vw,180px);}
.soha-dash .hero h1{font-family:var(--font-head);font-weight:800;font-size:clamp(30px,3.4vw,44px);line-height:1.06;
  color:var(--text);margin:15px 0 13px;text-wrap:balance;}
.soha-dash .hero .greet{font-size:16px;line-height:1.62;color:var(--muted);max-width:54ch;text-wrap:pretty;}
.soha-dash .hero .h-cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px;}
.soha-dash .hero .h-mascot{position:absolute;right:clamp(-14px,0.5vw,16px);bottom:-18px;
  width:clamp(150px,16vw,212px);height:auto;z-index:1;pointer-events:none;
  filter:drop-shadow(5px 6px 0 rgba(0,0,0,.13));}
.soha-dash .hero .h-tag{position:absolute;right:clamp(118px,13.5vw,176px);top:clamp(18px,4vw,40px);
  font-family:var(--font-hand);font-size:22px;font-weight:700;color:var(--ink);background:var(--yellow);
  border:2px solid var(--ink);padding:3px 15px;border-radius:var(--r-pill);box-shadow:var(--sh-paper-sm);
  transform:rotate(-3deg);z-index:2;white-space:nowrap;}

/* ----- STAT STRIP ----- */
.soha-dash .statstrip{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.soha-dash .stat{position:relative;background:var(--surface);border:2px solid var(--border);border-radius:var(--r-lg);
  box-shadow:var(--sh-paper);padding:18px 18px 16px;display:flex;flex-direction:column;gap:13px;
  transition:transform .14s var(--ease),box-shadow .14s;}
.soha-dash .stat:hover{transform:translate(-1px,-2px);box-shadow:6px 8px 0 rgba(34,34,34,.15);}
.soha-dash .stat .s-top{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.soha-dash .stat .s-ic{flex:none;width:42px;height:42px;border-radius:12px;border:2px solid var(--ink);
  display:grid;place-items:center;box-shadow:var(--sh-paper-sm);background:var(--surface-alt);color:var(--ink);}
.soha-dash .stat .s-ic svg{width:21px;height:21px;}
.soha-dash .stat .s-v{font-family:var(--font-head);font-weight:800;font-size:clamp(34px,3.6vw,44px);line-height:1;
  color:var(--text);font-variant-numeric:tabular-nums;}
.soha-dash .stat .s-l{font-size:13.5px;font-weight:700;color:var(--muted);}
.soha-dash .stat.amber .s-ic{background:var(--warning);color:#fff;}
.soha-dash .stat.amber .s-v{color:#7A5A10;}
.soha-dash .stat.green .s-ic{background:var(--green);color:#fff;}
.soha-dash .stat.green .s-v{color:#246B43;}
.soha-dash .stat.primary .s-ic{background:var(--primary);color:#FBF3DC;}
.soha-dash .stat.primary .s-v{color:var(--primary);}

/* ----- SECTION HEADER ----- */
.soha-dash .sec-h{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;}
.soha-dash .sec-h>div:first-child{flex:1;min-width:0;}
.soha-dash .sec-h .linkmore{flex:none;}
.soha-dash .sec-h .sh-t{font-family:var(--font-head);font-weight:800;font-size:clamp(21px,2.2vw,27px);color:var(--text);line-height:1.1;}
.soha-dash .sec-h .sh-d{font-size:14px;color:var(--muted);margin-top:4px;}
.soha-dash .linkmore{display:inline-flex;align-items:center;gap:7px;font-weight:800;font-size:13.5px;color:var(--primary);
  text-decoration:none;border-radius:var(--r-pill);padding:6px 12px;border:1.5px solid transparent;
  transition:background .14s,border-color .14s,transform .14s var(--ease);}
.soha-dash .linkmore svg{width:15px;height:15px;}
.soha-dash .linkmore:hover{background:var(--primary-soft);border-color:#A9CBE0;transform:translateX(2px);}
.soha-dash .linkmore:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft);}

/* ----- QUICK ACTIONS ----- */
.soha-dash .qa-block{display:flex;flex-direction:column;gap:16px;}
.soha-dash .qa-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.soha-dash .qa{position:relative;display:flex;flex-direction:column;gap:11px;text-decoration:none;
  background:var(--surface);border:2px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--sh-paper);
  padding:20px 18px;transition:transform .14s var(--ease),box-shadow .14s;}
.soha-dash .qa:hover{transform:translate(-1px,-2px);box-shadow:6px 8px 0 rgba(34,34,34,.15);}
.soha-dash .qa:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft),var(--sh-paper);}
.soha-dash .qa .qa-ic{width:48px;height:48px;border-radius:13px;border:2px solid var(--ink);background:var(--yellow);
  color:var(--ink);display:grid;place-items:center;box-shadow:var(--sh-paper-sm);
  transition:transform .2s var(--ease),background .2s;}
.soha-dash .qa .qa-ic svg{width:24px;height:24px;}
.soha-dash .qa:hover .qa-ic{transform:translateY(-3px) rotate(-4deg);}
.soha-dash .qa .qa-t{font-family:var(--font-head);font-weight:800;font-size:18px;color:var(--text);line-height:1.15;}
.soha-dash .qa .qa-d{font-size:13.5px;line-height:1.5;color:var(--muted);flex:1;}
.soha-dash .qa .qa-go{display:inline-flex;align-items:center;gap:7px;font-weight:800;font-size:13.5px;color:var(--primary);margin-top:2px;}
.soha-dash .qa .qa-go svg{width:15px;height:15px;transition:transform .16s var(--ease);}
.soha-dash .qa:hover .qa-go svg{transform:translateX(3px);}
.soha-dash .qa .qa-badge{position:absolute;top:13px;right:13px;display:inline-flex;align-items:center;gap:5px;
  font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
  background:var(--accent);color:#fff;border:2px solid var(--ink);border-radius:var(--r-pill);
  padding:3px 9px;box-shadow:var(--sh-paper-sm);}
.soha-dash .qa .qa-badge svg{width:11px;height:11px;}

/* ----- TWO-COLUMN ----- */
.soha-dash .work{display:grid;grid-template-columns:1fr 332px;gap:22px;align-items:start;}
.soha-dash .work-main{display:flex;flex-direction:column;gap:22px;min-width:0;}
.soha-dash .aside{position:sticky;top:22px;display:flex;flex-direction:column;gap:18px;}

/* ----- RECENT ACTIVITY ----- */
.soha-dash .act-card{padding:clamp(20px,2.4vw,28px);}
.soha-dash .act-list{margin-top:18px;display:flex;flex-direction:column;}
.soha-dash .act-row{display:flex;align-items:center;gap:14px;padding:13px 12px;border-radius:var(--r-md);text-decoration:none;
  transition:transform .14s var(--ease),background .14s,box-shadow .14s;}
.soha-dash .act-row+.act-row{border-top:1.5px dashed var(--border);}
.soha-dash .act-row:hover{background:var(--surface-alt);transform:translateX(3px);box-shadow:var(--sh-paper-sm);border-top-color:transparent;}
.soha-dash .act-row:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft);}
.soha-dash .act-row .a-ic{flex:none;width:44px;height:44px;border-radius:12px;border:2px solid var(--ink);
  background:var(--primary-soft);color:var(--primary);display:grid;place-items:center;box-shadow:var(--sh-paper-sm);}
.soha-dash .act-row .a-ic svg{width:21px;height:21px;}
.soha-dash .act-row .a-main{min-width:0;flex:1;}
.soha-dash .act-row .a-name{display:block;font-weight:700;font-size:14.5px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.soha-dash .act-row .a-time{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--muted);margin-top:3px;}
.soha-dash .act-row .a-time svg{width:13px;height:13px;color:var(--slate);}
.soha-dash .act-row .status{flex:none;}
.soha-dash .act-row .a-chev{flex:none;color:var(--slate);opacity:0;transform:translateX(-4px);transition:.14s;}
.soha-dash .act-row .a-chev svg{width:18px;height:18px;}
.soha-dash .act-row:hover .a-chev{opacity:.7;transform:none;}

/* ----- ADMIN CARD (navy promo) ----- */
.soha-dash .promo-card{position:relative;overflow:hidden;background:var(--side-bg);color:#FBF3DC;
  border:2px solid var(--ink);border-radius:var(--r-xl);box-shadow:var(--sh-press);padding:24px 22px 22px;}
.soha-dash .promo-card .grainp{position:absolute;inset:0;pointer-events:none;opacity:.5;
  background-image:radial-gradient(rgba(255,247,223,.07) 1px,transparent 1px);background-size:4px 4px;}
.soha-dash .promo-card .pc-in{position:relative;z-index:2;}
.soha-dash .promo-card .pc-eye{display:inline-flex;align-items:center;gap:8px;font-size:10.5px;font-weight:800;
  letter-spacing:.16em;text-transform:uppercase;color:var(--yellow);}
.soha-dash .promo-card .pc-eye svg{width:14px;height:14px;}
.soha-dash .promo-card h3{font-family:var(--font-head);font-weight:800;font-size:20px;line-height:1.2;margin:12px 0 4px;color:#FFFDF5;}
.soha-dash .promo-card .pc-desc{font-size:13px;line-height:1.55;color:rgba(251,243,220,.82);}
.soha-dash .admin-links{display:flex;flex-direction:column;gap:9px;margin-top:17px;}
.soha-dash .admin-link{display:flex;align-items:center;gap:12px;text-decoration:none;cursor:pointer;
  background:rgba(255,253,245,.07);border:1.5px solid rgba(255,247,223,.18);border-radius:var(--r-md);
  padding:11px 12px;color:#FBF3DC;transition:transform .14s var(--ease),background .14s,border-color .14s;}
.soha-dash .admin-link:hover{background:rgba(255,253,245,.15);border-color:rgba(255,247,223,.4);transform:translateX(3px);}
.soha-dash .admin-link:focus-visible{outline:none;box-shadow:0 0 0 4px rgba(243,201,76,.4);}
.soha-dash .admin-link .al-ic{flex:none;width:34px;height:34px;border-radius:10px;border:2px solid var(--ink);background:var(--yellow);
  color:var(--ink);display:grid;place-items:center;box-shadow:var(--sh-paper-sm);}
.soha-dash .admin-link .al-ic svg{width:17px;height:17px;}
.soha-dash .admin-link .al-t{flex:1;font-weight:700;font-size:14px;}
.soha-dash .admin-link .al-tail{flex:none;color:rgba(251,243,220,.7);}
.soha-dash .admin-link .al-tail svg{width:16px;height:16px;}
.soha-dash .admin-stats{margin-top:16px;padding-top:14px;border-top:1.5px dashed rgba(255,247,223,.22);
  display:flex;flex-direction:column;gap:11px;}
.soha-dash .admin-stat{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.soha-dash .admin-stat .as-l{font-size:13px;font-weight:600;color:rgba(251,243,220,.82);}
.soha-dash .admin-stat .as-v{font-family:var(--font-head);font-weight:800;font-size:17px;color:var(--yellow);}
.soha-dash .conn-pill{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:800;
  border-radius:var(--r-pill);padding:5px 12px;border:2px solid;}
.soha-dash .conn-pill svg{width:13px;height:13px;}
.soha-dash .conn-pill.on{background:rgba(120,168,90,.22);border-color:#A6D2B2;color:#CBE6CF;}
.soha-dash .conn-pill.off{background:rgba(201,138,22,.2);border-color:#E5C878;color:#F4DFA6;}

/* ----- TIP CARD ----- */
.soha-dash .tip-card{padding:18px 20px;}
.soha-dash .tip-card .th{display:flex;align-items:center;gap:9px;font-weight:800;font-size:13.5px;color:var(--primary);margin-bottom:8px;}
.soha-dash .tip-card .th svg{width:17px;height:17px;color:var(--accent);}
.soha-dash .tip-card p{font-size:13.5px;line-height:1.55;color:var(--muted);text-wrap:pretty;}

/* ----- EMPTY STATE ----- */
.soha-dash .empty{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;text-align:center;
  gap:8px;padding:clamp(34px,4.5vw,56px) clamp(22px,3vw,40px);}
.soha-dash .empty .e-mascot{width:clamp(124px,15vw,176px);height:auto;margin-bottom:6px;filter:drop-shadow(4px 6px 0 rgba(0,0,0,.12));}
.soha-dash .empty h2{font-family:var(--font-head);font-weight:800;font-size:clamp(23px,2.6vw,30px);color:var(--text);}
.soha-dash .empty p{font-size:15px;line-height:1.6;color:var(--muted);max-width:42ch;text-wrap:pretty;}
.soha-dash .empty .btn{margin-top:14px;}

/* entrance — base state is the visible end-state (no opacity:0 at rest) */
@keyframes dashRise{from{transform:translateY(10px);}to{transform:none;}}

/* ----- RESPONSIVE ----- */
@media (max-width:1080px){
  .soha-dash .work{grid-template-columns:1fr;}
  .soha-dash .aside{position:static;}
  .soha-dash .qa-grid{grid-template-columns:repeat(2,1fr);}
}
@media (max-width:768px){
  .soha-dash .statstrip{grid-template-columns:repeat(2,1fr);}
  .soha-dash .hero .h-in{padding-right:0;}
  .soha-dash .hero .h-mascot{width:118px;opacity:.92;right:-10px;}
  .soha-dash .hero .h-tag{display:none;}
}
@media (max-width:520px){
  .soha-dash .qa-grid{grid-template-columns:1fr;}
  .soha-dash .statstrip{grid-template-columns:1fr;}
  .soha-dash .hero .h-mascot{display:none;}
}
@media (prefers-reduced-motion:no-preference){
  .soha-dash .stat,.soha-dash .qa{animation:dashRise .34s var(--ease) both;}
  .soha-dash .qa:nth-child(2){animation-delay:.04s;}
  .soha-dash .qa:nth-child(3){animation-delay:.08s;}
  .soha-dash .qa:nth-child(4){animation-delay:.12s;}
  .soha-dash .stat:nth-child(2){animation-delay:.05s;}
  .soha-dash .stat:nth-child(3){animation-delay:.1s;}
  .soha-dash .stat:nth-child(4){animation-delay:.15s;}
}
@media (prefers-reduced-motion:reduce){
  .soha-dash *{transition:none !important;animation:none !important;}
  .soha-dash .act-row:hover,.soha-dash .stat:hover,.soha-dash .qa:hover{transform:none;}
}
`;

const quickActions: Array<{
  href: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  badge?: string;
}> = [
  {
    href: "/upload",
    title: "Tải tài liệu mới",
    desc: "Bắt đầu luồng nhập tài liệu và chuẩn bị dữ liệu cho bước AI.",
    icon: Upload,
    badge: "Ưu tiên",
  },
  {
    href: "/history",
    title: "Lịch sử xử lý",
    desc: "Xem lại các tài liệu đã xử lý và trạng thái gần đây.",
    icon: History,
  },
  {
    href: "/image-gen",
    title: "Tạo ảnh",
    desc: "Tạo nhanh ảnh minh hoạ cho nội dung tour.",
    icon: ImageIcon,
  },
  {
    href: "/settings/password",
    title: "Bảo mật tài khoản",
    desc: "Kiểm tra mật khẩu và cập nhật thiết lập truy cập.",
    icon: Lock,
  },
];

const adminLinks: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/admin/rules", label: "Quy tắc", icon: ListChecks },
  { href: "/admin/templates", label: "Mẫu Canva", icon: LayoutTemplate },
  { href: "/admin/canva", label: "Kết nối Canva", icon: Plug },
];

type ActivityTone = "primary" | "amber" | "green" | "red";

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const min = Math.floor(diffMs / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (min < 1) return "Vừa xong";
  if (min < 60) return `${min} phút trước`;
  if (hr < 24) return `${hr} giờ trước`;
  if (day === 1) return "Hôm qua";
  if (day < 7) return `${day} ngày trước`;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function resolveActivityStatus(row: {
  aiStatus: string | null;
  reviewStatus: string | null;
  hasCanva: boolean;
}): { tone: ActivityTone; label: string; icon: LucideIcon | null; pulse?: boolean } {
  if (row.hasCanva) return { tone: "green", label: "Đã tạo Canva", icon: ImageIcon };
  if (row.aiStatus === AI_STATUS.FAILED) return { tone: "red", label: "Lỗi", icon: AlertTriangle };
  if (row.aiStatus === AI_STATUS.PROCESSING || row.aiStatus === AI_STATUS.PENDING) {
    return { tone: "primary", label: "Đang xử lý", icon: null, pulse: true };
  }
  if (row.reviewStatus === REVIEW_STATUS.APPROVED) return { tone: "green", label: "Đã duyệt", icon: Check };
  return { tone: "amber", label: "Chờ duyệt", icon: Clock };
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";
  const userName = session.user.name?.trim() || "bạn";
  const where = isAdmin ? {} : { userId: session.user.id };

  const needsReviewWhere = {
    ...where,
    reviewStatus: { not: REVIEW_STATUS.APPROVED },
    OR: [
      { aiStatus: AI_STATUS.READY_FOR_REVIEW },
      { reviewStatus: REVIEW_STATUS.PENDING_REVIEW },
    ],
  };

  const [totalCount, pendingCount, approvedCount, canvaCount, recentRows, canvaStatus] =
    await Promise.all([
      prisma.upload.count({ where }),
      prisma.upload.count({ where: needsReviewWhere }),
      prisma.upload.count({ where: { ...where, reviewStatus: REVIEW_STATUS.APPROVED } }),
      prisma.upload.count({
        where: { ...where, canvaArtifacts: { some: { status: "SUCCEEDED" } } },
      }),
      prisma.upload.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          originalFileName: true,
          createdAt: true,
          aiStatus: true,
          reviewStatus: true,
          canvaArtifacts: { select: { status: true } },
        },
      }),
      isAdmin ? getCanvaTokenStatus() : Promise.resolve(null),
    ]);

  const isEmpty = totalCount === 0;
  const canvaConnected = canvaStatus?.isConnected ?? false;

  const stats: Array<{ value: number; label: string; icon: LucideIcon; tone: string }> = [
    { value: totalCount, label: "Tổng tài liệu", icon: FileText, tone: "" },
    { value: pendingCount, label: "Đang chờ duyệt", icon: Clock, tone: "amber" },
    { value: approvedCount, label: "Đã duyệt", icon: Check, tone: "green" },
    { value: canvaCount, label: "Canva đã tạo", icon: ImageIcon, tone: "primary" },
  ];

  const activity = recentRows.map((row) => ({
    id: row.id,
    fileName: row.originalFileName,
    time: relativeTime(row.createdAt),
    status: resolveActivityStatus({
      aiStatus: row.aiStatus,
      reviewStatus: row.reviewStatus,
      hasCanva: row.canvaArtifacts.some((a) => a.status === "SUCCEEDED"),
    }),
  }));

  return (
    <div className="soha-dash">
      <style>{dashStyles}</style>

      {/* ============ HERO ============ */}
      <section className="card hero">
        <div className="h-in">
          <span className="kicker">
            <LayoutGrid /> Control center
          </span>
          <h1>Bảng điều khiển</h1>
          <p className="greet">
            Xin chào, {userName}! Đây là trung tâm điều phối SOHA Travel để bắt đầu tải tài liệu, mở
            bước kiểm tra và theo dõi các luồng đang chạy.
          </p>
          <div className="h-cta">
            <Link className="btn" href="/upload">
              <Upload /> Mở luồng tải tài liệu
            </Link>
            <Link className="btn ghost" href="/history">
              <History /> Xem lịch sử xử lý
            </Link>
          </div>
        </div>
        <span className="h-tag">Điều phối</span>
        <NextImage
          className="h-mascot"
          src="/front-flow/mascot-cat-dashboard.png"
          alt=""
          aria-hidden="true"
          width={2000}
          height={1414}
        />
      </section>

      {/* ============ STAT STRIP ============ */}
      {!isEmpty && (
        <section className="statstrip">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`stat ${stat.tone}`}>
                <div className="s-top">
                  <span className="s-ic">
                    <Icon />
                  </span>
                </div>
                <div className="s-v">
                  <StatCounter value={stat.value} />
                </div>
                <div className="s-l">{stat.label}</div>
              </div>
            );
          })}
        </section>
      )}

      {/* ============ QUICK ACTIONS ============ */}
      <section className="qa-block">
        <div className="sec-h">
          <div>
            <div className="sh-t">Lối tắt nhanh</div>
            <div className="sh-d">Bắt đầu một tác vụ thường dùng chỉ trong một bước.</div>
          </div>
        </div>
        <div className="qa-grid">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} className="qa" href={action.href}>
                {action.badge && (
                  <span className="qa-badge">
                    <Zap /> {action.badge}
                  </span>
                )}
                <span className="qa-ic">
                  <Icon />
                </span>
                <span className="qa-t">{action.title}</span>
                <span className="qa-d">{action.desc}</span>
                <span className="qa-go">
                  Truy cập <ArrowRight />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============ TWO-COLUMN ============ */}
      <div className="work">
        <div className="work-main">
          {isEmpty ? (
            <section className="card empty">
              <NextImage
                className="e-mascot"
                src="/front-flow/mascot-cat-dashboard.png"
                alt=""
                aria-hidden="true"
                width={2000}
                height={1414}
              />
              <h2>Chưa có tài liệu nào</h2>
              <p>Bắt đầu bằng cách tải lên tài liệu đầu tiên để mở luồng xử lý.</p>
              <Link className="btn" href="/upload">
                <Upload /> Tải tài liệu
              </Link>
            </section>
          ) : (
            <section className="card act-card">
              <div className="sec-h">
                <div>
                  <div className="sh-t">Hoạt động gần đây</div>
                  <div className="sh-d">Các tài liệu và tour vừa được xử lý.</div>
                </div>
                <Link className="linkmore" href="/history">
                  Xem tất cả <ArrowRight />
                </Link>
              </div>
              <div className="act-list">
                {activity.map((item) => {
                  const StatusIcon = item.status.icon;
                  return (
                    <Link key={item.id} className="act-row" href={`/review/${item.id}`}>
                      <span className="a-ic">
                        <FileText />
                      </span>
                      <span className="a-main">
                        <span className="a-name">{item.fileName}</span>
                        <span className="a-time">
                          <Clock /> {item.time}
                        </span>
                      </span>
                      <span className={`status ${item.status.tone}`}>
                        {item.status.pulse ? (
                          <span className="pulse" />
                        ) : StatusIcon ? (
                          <StatusIcon />
                        ) : null}
                        {item.status.label}
                      </span>
                      <span className="a-chev">
                        <ChevronRight />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ============ ASIDE ============ */}
        <aside className="aside">
          {isAdmin && (
            <div className="promo-card">
              <div className="grainp" aria-hidden="true" />
              <div className="pc-in">
                <span className="pc-eye">
                  <ShieldCheck /> Khu quản trị
                </span>
                <h3>Thiết lập &amp; kết nối</h3>
                <p className="pc-desc">Lối tắt tới các cấu hình dành cho quản trị viên.</p>
                <div className="admin-links">
                  {adminLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link key={link.href} className="admin-link" href={link.href}>
                        <span className="al-ic">
                          <Icon />
                        </span>
                        <span className="al-t">{link.label}</span>
                        <span className="al-tail">
                          <ChevronRight />
                        </span>
                      </Link>
                    );
                  })}
                </div>
                <div className="admin-stats">
                  <div className="admin-stat">
                    <span className="as-l">Tour chờ duyệt</span>
                    <span className="as-v">{pendingCount}</span>
                  </div>
                  <div className="admin-stat">
                    <span className="as-l">Trạng thái Canva</span>
                    {canvaConnected ? (
                      <span className="conn-pill on">
                        <Check /> Đã kết nối Canva
                      </span>
                    ) : (
                      <span className="conn-pill off">
                        <AlertTriangle /> Chưa kết nối
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card tip-card">
            <div className="th">
              <Sparkles /> Mẹo nhỏ
            </div>
            <p>Bắt đầu mỗi ngày từ mục Đang chờ duyệt để không tồn đọng tour cần xử lý.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
