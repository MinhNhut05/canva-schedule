import { notFound, redirect } from "next/navigation";

import { loadCanvaArtifacts } from "@/app/(app)/review/[id]/actions";
import { ReviewPage } from "@/components/review/review-page";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getCanvaGenerationOptions,
  getDraft,
  getOneDayMenuMergeWarning,
} from "@/lib/review/draft";
import {
  resolveTemplatePair,
  type TourDuration,
} from "@/lib/canva/template-resolver";
import { getGlobalCooldown } from "@/lib/canva/cooldown";

interface ReviewPageRouteProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewPageRoute({
  params,
}: ReviewPageRouteProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const upload = await prisma.upload.findFirst({
    where: {
      id,
      ...(session.user.role === "admin" ? {} : { userId: session.user.id }),
    },
    select: {
      id: true,
      originalFileName: true,
      aiStatus: true,
      reviewStatus: true,
      aiErrorMessage: true,
      clientType: true,
      tourDuration: true,
      userId: true,
    },
  });

  if (!upload) {
    notFound();
  }

  const [draft, canvaOptions, canvaArtifacts, cooldownUntil] = await Promise.all([
    getDraft(id),
    getCanvaGenerationOptions(id),
    loadCanvaArtifacts(upload.id),
    getGlobalCooldown(),
  ]);
  const templatePair = upload.tourDuration
    ? await resolveTemplatePair(upload.tourDuration as TourDuration)
    : null;
  const menuMergeWarning = draft
    ? getOneDayMenuMergeWarning(draft, canvaOptions)
    : null;

  return (
    <div className="soha-review">
      <style>{reviewStyles}</style>
      <ReviewPage
        upload={{
          id: upload.id,
          originalFileName: upload.originalFileName,
          aiStatus: upload.aiStatus,
          reviewStatus: upload.reviewStatus,
          aiErrorMessage: upload.aiErrorMessage,
          clientType: upload.clientType,
          tourDuration: upload.tourDuration,
        }}
        draft={draft}
        canvaArtifacts={canvaArtifacts}
        templatePair={templatePair}
        initialCooldownUntil={cooldownUntil?.toISOString() ?? null}
        initialCanvaOptions={canvaOptions}
        initialMenuMergeWarning={menuMergeWarning}
      />
    </div>
  );
}

const reviewStyles = `
.soha-review{display:flex;flex-direction:column;}
.soha-review .rv-rv{opacity:1;}
@media (prefers-reduced-motion:no-preference){
  .soha-review .rv-rv{animation:rv-rv .5s var(--ease) both;}
  @keyframes rv-rv{from{transform:translateY(13px);}to{transform:none;}}
}
.soha-review .rv-stack{display:flex;flex-direction:column;gap:20px;padding-bottom:128px;}

/* ---------- workflow stepper (paper variant) ---------- */
.soha-review .rv-stepper-card{background:var(--surface);border:2px solid var(--border);border-radius:var(--r-xl);
  box-shadow:var(--sh-paper);padding:clamp(16px,2.2vw,24px) clamp(14px,2.2vw,26px);overflow-x:auto;}
.soha-review .up-stepper{display:flex;align-items:flex-start;min-width:520px;width:100%;}
.soha-review .up-step{display:flex;flex-direction:column;align-items:center;gap:9px;flex:none;text-align:center;}
.soha-review .up-step-dot{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:800;
  font-size:15px;border:2px solid var(--border);background:var(--surface-alt);color:var(--muted);transition:.2s var(--ease);}
.soha-review .up-step.done .up-step-dot{background:var(--success-soft);border-color:var(--success);color:var(--success);}
.soha-review .up-step.active .up-step-dot{background:var(--yellow);border-color:var(--ink);color:var(--ink);box-shadow:var(--sh-paper-sm);}
.soha-review .up-step.error .up-step-dot{background:var(--error-soft);border-color:var(--error);color:var(--error);}
.soha-review .up-step-lbl{font-size:12.5px;font-weight:700;color:var(--muted);white-space:nowrap;}
.soha-review .up-step.active .up-step-lbl{color:var(--primary);font-weight:800;}
.soha-review .up-step.done .up-step-lbl{color:var(--success);}
.soha-review .up-step.error .up-step-lbl{color:var(--error);}
.soha-review .up-step-conn{flex:1;height:3px;border-radius:3px;background:var(--border);margin:19px 8px 0;min-width:18px;}
.soha-review .up-step-conn.done{background:var(--success);}
.soha-review .up-spin{animation:rv-spin 1s linear infinite;}

/* shared building blocks */
.soha-review .rv-card{background:var(--surface);border:2px solid var(--border);border-radius:var(--r-xl);
  box-shadow:var(--sh-paper);padding:clamp(18px,2.4vw,26px);}
.soha-review .rv-section{background:var(--surface);border:2px solid var(--border);border-radius:var(--r-xl);
  box-shadow:var(--sh-paper);padding:clamp(16px,2vw,22px) clamp(18px,2.4vw,26px);display:flex;flex-direction:column;gap:10px;}
.soha-review .rv-stage-pill{display:inline-flex;align-items:center;gap:7px;width:fit-content;font-size:11.5px;font-weight:800;
  letter-spacing:.04em;text-transform:uppercase;color:var(--primary);background:var(--primary-soft);
  border:1.5px solid #A9CBE0;border-radius:var(--r-pill);padding:5px 12px;}
.soha-review .rv-stage-pill svg{width:14px;height:14px;}
.soha-review .rv-stage-pill.green{background:var(--success-soft);border-color:var(--success);color:var(--success);}
.soha-review .rv-stage-pill.amber{background:var(--warning-soft);border-color:var(--warning);color:#7A5A10;}
.soha-review .rv-card-title{font-family:var(--font-head);font-weight:800;font-size:clamp(18px,2vw,24px);color:var(--text);line-height:1.14;}
.soha-review .rv-card-desc{font-size:14px;line-height:1.55;color:var(--muted);max-width:64ch;}

/* buttons */
.soha-review .rv-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--font-body);
  font-weight:800;font-size:14.5px;border-radius:var(--r-pill);padding:11px 22px;border:2px solid var(--ink);
  background:var(--yellow);color:var(--ink);cursor:pointer;text-decoration:none;box-shadow:var(--sh-press);
  transition:transform .12s var(--ease),box-shadow .12s;}
.soha-review .rv-btn svg{width:17px;height:17px;}
.soha-review .rv-btn:hover{transform:translate(-1px,-1px);box-shadow:4px 5px 0 var(--ink);}
.soha-review .rv-btn:active{transform:translate(3px,4px);box-shadow:none;}
.soha-review .rv-btn:disabled{cursor:not-allowed;opacity:.55;transform:none;box-shadow:var(--sh-press);}
.soha-review .rv-btn.green{background:var(--green);}
.soha-review .rv-btn.ghost{background:var(--surface);box-shadow:var(--sh-paper-sm);}
.soha-review .rv-btn.ghost:hover{box-shadow:3px 4px 0 var(--ink);}
.soha-review .rv-btn.ghost:active{box-shadow:none;}
.soha-review .rv-btn.sm{padding:7px 14px;font-size:13px;box-shadow:var(--sh-paper-sm);}
.soha-review .rv-btn.sm:hover{box-shadow:3px 4px 0 var(--ink);}
.soha-review .rv-btn.sm:active{box-shadow:none;}
.soha-review .rv-btn:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft);}

/* ---------- header hero ---------- */
.soha-review .rv-hero{display:flex;flex-direction:column;gap:14px;}
.soha-review .rv-hero-top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;}
.soha-review .rv-kicker{display:inline-flex;align-items:center;gap:8px;font-size:11.5px;font-weight:800;
  letter-spacing:.16em;text-transform:uppercase;color:var(--accent);}
.soha-review .rv-kicker svg{width:15px;height:15px;}
.soha-review .rv-hero h1{font-family:var(--font-head);font-weight:800;font-size:clamp(24px,3vw,36px);
  line-height:1.08;color:var(--primary);margin:10px 0 6px;}
.soha-review .rv-hero .rv-file{font-size:14px;color:var(--text);font-weight:700;word-break:break-all;}
.soha-review .rv-hero .rv-lede{font-size:14px;line-height:1.55;color:var(--muted);max-width:66ch;margin-top:6px;}
.soha-review .rv-chips{display:flex;flex-wrap:wrap;gap:8px;}
.soha-review .rv-chip{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;
  border-radius:var(--r-pill);padding:5px 12px;border:2px solid var(--border);background:var(--surface-alt);color:var(--muted);}
.soha-review .rv-chip.ok{background:var(--success-soft);border-color:var(--success);color:var(--success);}
.soha-review .rv-chip.amber{background:var(--warning-soft);border-color:var(--warning);color:#7A5A10;}
.soha-review .rv-chip.neutral{background:var(--primary-soft);border-color:#A9CBE0;color:var(--primary);}
.soha-review .rv-note{background:var(--bg-soft);border:2px solid var(--border);border-radius:var(--r-md);
  padding:12px 14px;font-size:13px;line-height:1.55;color:var(--text);}

/* ---------- editors ---------- */
.soha-review .rv-editor{display:flex;flex-direction:column;gap:16px;}
.soha-review .rv-editor-h{display:flex;align-items:center;gap:9px;font-family:var(--font-head);font-weight:800;
  font-size:19px;color:var(--primary);}
.soha-review .rv-editor-h svg{width:19px;height:19px;color:var(--accent);}
.soha-review .rv-fieldset{display:flex;flex-direction:column;gap:10px;}
.soha-review .rv-group{background:var(--surface-alt);border:2px solid var(--border);border-radius:var(--r-lg);
  padding:14px;display:flex;flex-direction:column;gap:10px;}
.soha-review .rv-group-h{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:13.5px;
  letter-spacing:.02em;color:var(--primary);}
.soha-review .rv-group-h svg{width:16px;height:16px;color:var(--slate);}
.soha-review .rv-empty{padding:14px;text-align:center;font-size:13px;font-style:italic;color:var(--muted);
  border:2px dashed var(--border);border-radius:var(--r-md);background:var(--surface);}

/* field card */
.soha-review .rv-field{position:relative;display:block;width:100%;text-align:left;background:var(--surface);
  border:2px solid var(--border);border-radius:var(--r-md);padding:10px 13px;cursor:pointer;
  transition:border-color .15s,background .15s;}
.soha-review .rv-field:hover{border-color:var(--slate);background:var(--surface-alt);}
.soha-review .rv-field:focus-visible{outline:none;box-shadow:0 0 0 4px var(--info-soft);}
.soha-review .rv-field.editing{cursor:default;border-color:var(--info);background:var(--surface);}
.soha-review .rv-field.editing:hover{background:var(--surface);}
.soha-review .rv-field-label{display:block;font-size:10.5px;font-weight:800;letter-spacing:.08em;
  text-transform:uppercase;color:var(--slate);}
.soha-review .rv-field-value{margin-top:5px;font-size:14.5px;line-height:1.5;color:var(--text);
  word-break:break-word;white-space:pre-wrap;}
.soha-review .rv-field-value.empty{font-style:italic;color:var(--muted);font-weight:400;}
.soha-review .rv-field-edit{position:absolute;top:9px;right:11px;color:var(--slate);opacity:0;transition:opacity .15s;}
.soha-review .rv-field-edit svg{width:14px;height:14px;}
.soha-review .rv-field:hover .rv-field-edit{opacity:.6;}
.soha-review .rv-edit-input{width:100%;margin-top:7px;font-family:var(--font-body);font-size:14.5px;
  padding:9px 12px;border:2px solid var(--info);border-radius:var(--r-sm);background:#fff;color:var(--text);
  outline:none;box-shadow:0 0 0 4px var(--info-soft);resize:vertical;}
.soha-review .rv-edit-actions{display:flex;gap:8px;margin-top:9px;}

/* flagged field */
.soha-review .rv-flag{position:relative;border:2px solid var(--warning);background:var(--warning-soft);
  border-radius:var(--r-md);padding:13px 13px 11px;display:flex;flex-direction:column;gap:9px;}
.soha-review .rv-flag .rv-field{border-color:transparent;background:transparent;padding:0;}
.soha-review .rv-flag .rv-field:hover{background:rgba(34,34,34,.04);}
.soha-review .rv-flag .rv-field.editing{background:#fff;border-color:var(--info);padding:10px 13px;}
.soha-review .rv-fbadge{position:absolute;top:0;right:12px;transform:translateY(-55%);display:inline-flex;align-items:center;
  gap:5px;font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#7A5A10;
  background:var(--yellow);border:2px solid var(--ink);border-radius:var(--r-pill);padding:2px 10px;box-shadow:var(--sh-paper-sm);}
.soha-review .rv-fbadge svg{width:12px;height:12px;}
.soha-review .rv-fnote{display:flex;align-items:flex-start;gap:7px;font-size:12.5px;line-height:1.45;color:#7A5A10;}
.soha-review .rv-fnote svg{flex:none;width:15px;height:15px;margin-top:1px;color:var(--warning);}

/* one-day toggle card + warning */
.soha-review .rv-toggle{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap;}
.soha-review .rv-toggle-tx{display:flex;flex-direction:column;gap:6px;max-width:60ch;}
.soha-review .rv-toggle-tx h3{font-family:var(--font-head);font-weight:800;font-size:17px;color:var(--text);}
.soha-review .rv-toggle-tx p{font-size:13.5px;line-height:1.5;color:var(--muted);}
.soha-review .rv-toggle-ctl{display:flex;align-items:center;gap:10px;background:var(--surface-alt);
  border:2px solid var(--border);border-radius:var(--r-pill);padding:8px 14px;}
.soha-review .rv-toggle-ctl .st{font-size:13px;font-weight:700;color:var(--text);}
.soha-review .rv-alert{display:flex;gap:11px;align-items:flex-start;border-radius:var(--r-md);padding:12px 14px;
  border:2px solid;box-shadow:var(--sh-paper-sm);}
.soha-review .rv-alert svg{flex:none;width:19px;height:19px;margin-top:1px;}
.soha-review .rv-alert .t{font-weight:800;font-size:14px;}
.soha-review .rv-alert .d{font-size:13px;line-height:1.5;margin-top:2px;}
.soha-review .rv-alert.amber{background:var(--warning-soft);border-color:var(--warning);color:#7A5A10;}
.soha-review .rv-alert.amber svg{color:var(--warning);}
.soha-review .rv-alert.green{background:var(--success-soft);border-color:var(--success);color:#1F5A38;}
.soha-review .rv-alert.green svg{color:var(--success);}
.soha-review .rv-alert.red{background:var(--error-soft);border-color:var(--error);color:#8E2C24;}
.soha-review .rv-alert.red svg{color:var(--error);}

/* template confirmation */
.soha-review .rv-tpl-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.soha-review .rv-tchip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;
  border-radius:var(--r-pill);padding:5px 12px;border:2px solid var(--success);background:var(--success-soft);color:var(--success);}
.soha-review .rv-tchip svg{width:14px;height:14px;}
.soha-review .rv-tpl-rows{display:flex;flex-direction:column;gap:10px;}
.soha-review .rv-tpl-row{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:700;color:var(--text);
  background:var(--surface-alt);border:2px solid var(--border);border-radius:var(--r-md);padding:12px 14px;}
.soha-review .rv-tpl-row svg{flex:none;width:17px;height:17px;color:var(--primary);}
.soha-review .rv-tpl-row.missing{border-style:dashed;color:var(--muted);font-weight:600;background:var(--surface);}
.soha-review .rv-tpl-row.missing svg{color:var(--muted);}
.soha-review .rv-actions-end{display:flex;justify-content:flex-end;}

/* generating */
.soha-review .rv-gen{display:flex;align-items:flex-start;gap:14px;}
.soha-review .rv-gen-ic{flex:none;width:48px;height:48px;border-radius:14px;background:var(--yellow);
  border:2px solid var(--ink);box-shadow:var(--sh-paper-sm);display:grid;place-items:center;color:var(--ink);}
.soha-review .rv-gen-ic svg{width:24px;height:24px;}
.soha-review .rv-gen-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;}
.soha-review .rv-gen-tx .gt{font-family:var(--font-head);font-weight:800;font-size:17px;color:var(--text);}
.soha-review .rv-gen-tx .gd{font-size:13.5px;line-height:1.5;color:var(--muted);}
.soha-review .rv-bar{height:8px;border-radius:99px;background:rgba(28,63,96,.14);overflow:hidden;margin-top:4px;}
.soha-review .rv-bar i{display:block;height:100%;width:38%;border-radius:99px;background:var(--primary);
  animation:rv-indet 1.3s var(--ease) infinite;}
@keyframes rv-indet{0%{margin-left:-38%;}100%{margin-left:100%;}}
.soha-review .rv-spin{animation:rv-spin 1s linear infinite;}
@keyframes rv-spin{to{transform:rotate(360deg);}}

/* result cards */
.soha-review .rv-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;}
.soha-review .rv-result{display:flex;flex-direction:column;gap:13px;background:var(--surface);border:2px solid var(--border);
  border-radius:var(--r-lg);box-shadow:var(--sh-paper-sm);padding:16px;}
.soha-review .rv-result.ok{border-color:var(--success);}
.soha-review .rv-result.fail{border-color:var(--error);}
.soha-review .rv-result-h{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.soha-review .rv-result-h .rt{font-family:var(--font-head);font-weight:800;font-size:18px;color:var(--text);}
.soha-review .rv-rbadge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;border-radius:var(--r-pill);
  padding:4px 11px;border:2px solid;white-space:nowrap;}
.soha-review .rv-rbadge svg{width:13px;height:13px;}
.soha-review .rv-rbadge.ok{background:var(--success-soft);border-color:var(--success);color:var(--success);}
.soha-review .rv-rbadge.fail{background:var(--error-soft);border-color:var(--error);color:#8E2C24;}
.soha-review .rv-rbadge.proc{background:var(--primary-soft);border-color:#A9CBE0;color:var(--primary);}
.soha-review .rv-thumb{width:100%;height:170px;object-fit:cover;border-radius:var(--r-md);border:2px solid var(--border);background:var(--surface-alt);}
.soha-review .rv-rhelper{font-size:13.5px;line-height:1.5;color:var(--muted);}
.soha-review .rv-share{display:flex;align-items:flex-start;gap:8px;font-size:12.5px;line-height:1.45;
  border-radius:var(--r-md);padding:9px 11px;border:2px solid;}
.soha-review .rv-share svg{flex:none;width:15px;height:15px;margin-top:1px;}
.soha-review .rv-share.ok{background:var(--success-soft);border-color:var(--success);color:#1F5A38;}
.soha-review .rv-share.warn{background:var(--warning-soft);border-color:var(--warning);color:#7A5A10;}
.soha-review .rv-share.neutral{background:var(--primary-soft);border-color:#A9CBE0;color:var(--muted);}
.soha-review .rv-result-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:auto;}

/* cooldown */
.soha-review .rv-cooldown{display:flex;align-items:flex-start;gap:13px;background:var(--warning-soft);
  border:2px solid var(--warning);border-radius:var(--r-lg);box-shadow:var(--sh-paper-sm);padding:15px 17px;}
.soha-review .rv-cooldown-ic{flex:none;width:46px;height:46px;border-radius:13px;background:var(--yellow);
  border:2px solid var(--ink);box-shadow:var(--sh-paper-sm);display:grid;place-items:center;color:var(--ink);}
.soha-review .rv-cooldown-ic svg{width:22px;height:22px;}
.soha-review .rv-cooldown-tx{display:flex;flex-direction:column;gap:6px;}
.soha-review .rv-cooldown-tx .cb{font-size:13px;font-weight:800;line-height:1.4;color:#7A5A10;}
.soha-review .rv-cooldown-tx .cs{font-size:13px;line-height:1.5;color:#7A5A10;opacity:.85;}

/* completion win banner */
.soha-review .rv-win{position:relative;overflow:hidden;display:flex;align-items:flex-start;gap:16px;
  border:2px solid;border-radius:var(--r-xl);box-shadow:var(--sh-paper);padding:clamp(18px,2.4vw,26px);}
.soha-review .rv-win.full{background:var(--success-soft);border-color:var(--success);}
.soha-review .rv-win.partial{background:var(--warning-soft);border-color:var(--warning);}
.soha-review .rv-seal{flex:none;width:54px;height:54px;border-radius:50%;display:grid;place-items:center;
  border:2px solid var(--ink);box-shadow:var(--sh-paper-sm);color:#fff;}
.soha-review .rv-win.full .rv-seal{background:var(--success);}
.soha-review .rv-win.partial .rv-seal{background:var(--warning);}
.soha-review .rv-seal svg{width:28px;height:28px;}
.soha-review .rv-win-tx{position:relative;z-index:1;display:flex;flex-direction:column;gap:11px;}
.soha-review .rv-win-tx h3{font-family:var(--font-head);font-weight:800;font-size:22px;color:var(--text);}
.soha-review .rv-win-tx p{font-size:14px;line-height:1.55;color:var(--muted);max-width:60ch;}
.soha-review .rv-win-cta{display:flex;flex-wrap:wrap;gap:11px;}
.soha-review .rv-confetti{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0;}
.soha-review .rv-confetti i{position:absolute;top:-12px;width:8px;height:12px;border-radius:2px;opacity:1;}
@media (prefers-reduced-motion:no-preference){
  .soha-review .rv-confetti i{animation:rv-fall 2.6s var(--ease) infinite;}
  @keyframes rv-fall{0%{transform:translateY(-10px) rotate(0);}100%{transform:translateY(150px) rotate(220deg);}}
}

/* sticky actions */
.soha-review .rv-sticky{position:fixed;left:240px;right:0;bottom:0;z-index:35;background:var(--surface);
  border-top:2px solid var(--border);box-shadow:0 -6px 20px rgba(34,34,34,.08);padding:13px 16px;}
.soha-review .rv-sticky-inner{max-width:1140px;margin:0 auto;display:flex;gap:14px;align-items:center;
  justify-content:space-between;flex-wrap:wrap;}
.soha-review .rv-sticky-tx .l{font-size:13.5px;font-weight:800;color:var(--text);}
.soha-review .rv-sticky-tx .s{font-size:12.5px;line-height:1.4;color:var(--muted);margin-top:2px;max-width:62ch;}

/* states */
.soha-review .rv-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
  text-align:center;padding:48px 24px;background:var(--surface);border:2px dashed var(--border);border-radius:var(--r-xl);}
.soha-review .rv-state h2{font-family:var(--font-head);font-weight:800;font-size:22px;color:var(--text);}
.soha-review .rv-state p{font-size:14px;line-height:1.55;color:var(--muted);max-width:52ch;}
.soha-review .rv-state-actions{display:flex;flex-wrap:wrap;gap:11px;margin-top:8px;justify-content:center;}

/* responsive */
@media (max-width:980px){.soha-review .rv-results{grid-template-columns:1fr;}}
@media (max-width:767px){.soha-review .rv-sticky{left:0;}}
@media (prefers-reduced-motion:reduce){
  .soha-review .rv-btn,.soha-review .rv-field,.soha-review .rv-field-edit{transition:none;}
}
`;
