import { Suspense } from "react";
import { redirect } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HistoryTable } from "./_components/history-table";
import { HistoryEmpty } from "./_components/history-empty";
import { HistoryPagination } from "./_components/history-pagination";
import { HistorySkeleton } from "./_components/history-skeleton";

const PAGE_SIZE = 20;

interface HistoryPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0 && String(parsedPage) === (params.page ?? "1")
      ? parsedPage
      : 1;
  const skip = (currentPage - 1) * PAGE_SIZE;
  const where = session.user.role === "admin" ? {} : { userId: session.user.id };

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
        canvaArtifacts: {
          select: {
            artifactType: true,
            status: true,
            designId: true,
          },
          orderBy: { artifactType: "asc" },
        },
      },
    }),
    prisma.upload.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (totalCount === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Lich su</h1>
        <HistoryEmpty />
      </div>
    );
  }

  const jobs = rows.map((row) => {
    const succeeded = row.canvaArtifacts.filter((a) => a.status === "SUCCEEDED");
    const total = row.canvaArtifacts.length;
    const successCount = succeeded.length;

    let status: "success" | "error";
    if (successCount > 0) {
      status = "success";
    } else {
      status = "error";
    }

    let canvaLinkLabel: string;
    if (successCount === 2) {
      canvaLinkLabel = "2 lien ket";
    } else if (successCount === 1 && total === 2) {
      canvaLinkLabel = "1/2 lien ket";
    } else if (successCount === 1) {
      canvaLinkLabel = "1 lien ket";
    } else {
      canvaLinkLabel = "Chua co lien ket";
    }

    let tourTypeLabel: string;
    if (row.tourDuration === "ONE_DAY") {
      tourTypeLabel = "Tour 1 ngay";
    } else if (row.tourDuration === "TWO_DAY") {
      tourTypeLabel = "Tour 2 ngay";
    } else if (row.tourDuration === "THREE_DAY") {
      tourTypeLabel = "Tour 3 ngay";
    } else {
      tourTypeLabel = "Chua xac dinh";
    }

    return {
      id: row.id,
      fileName: row.originalFileName,
      createdAt: row.createdAt.toISOString(),
      status,
      statusLabel: status === "success" ? "Thanh cong" : "Loi",
      tourTypeLabel,
      canvaLinkLabel,
    };
  });

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Lich su</h1>
        <Suspense fallback={<HistorySkeleton />}>
          <HistoryTable jobs={jobs} />
        </Suspense>
        {totalPages > 1 && (
          <HistoryPagination
            currentPage={currentPage}
            totalPages={totalPages}
          />
        )}
      </div>

      <section className="space-y-4" data-testid="visual-proof-surface">
        <div className="surface-hero hero-grid hero-grain rounded-xl border border-semantic-dark p-6 text-surface-hero-foreground shadow-semantic-dark">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-accent-light">Proof surface</p>
          <h2 className="mt-2 text-2xl font-semibold">Visual system contract</h2>
          <p className="mt-2 max-w-2xl text-sm text-accent-light">
            Bề mặt kỹ thuật để kiểm tra font, split dark-light surface, primitive states, và interaction cues.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>Default tag</Badge>
            <Badge variant="secondary">Secondary tag</Badge>
            <Badge variant="outline">Outline tag</Badge>
            <Badge variant="destructive">Destructive tag</Badge>
          </div>
        </div>

        <Card className="surface-panel">
          <CardHeader>
            <CardTitle>Component state checks</CardTitle>
            <CardDescription>Kiểm tra button/card/input/alert + overlay primitives.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button>Primary action</Button>
              <Button variant="secondary">Secondary action</Button>
              <Button variant="outline">Outline action</Button>
              <Button variant="ghost">Ghost action</Button>
              <Button variant="link">Inline link</Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Input value="Input sample" readOnly aria-label="Input sample" />
              <Textarea value="Textarea sample" readOnly aria-label="Textarea sample" />
            </div>

            <Alert>
              <AlertTitle>Default alert</AlertTitle>
              <AlertDescription>Thông báo trạng thái mặc định cho surface nhẹ.</AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertTitle>Destructive alert</AlertTitle>
              <AlertDescription>Thông báo huỷ/xoá với cue thị giác tách biệt.</AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Tooltip trigger</Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={8}>Low-noise helper text</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">Open sheet</Button>
                </SheetTrigger>
                <SheetContent side="right" data-testid="proof-sheet-content">
                  <SheetTitle>Sheet primitive</SheetTitle>
                  <SheetDescription>Overlay + panel tone cho mobile navigation style.</SheetDescription>
                </SheetContent>
              </Sheet>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Open alert dialog</Button>
                </AlertDialogTrigger>
                <AlertDialogContent data-testid="proof-alert-dialog-content">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm destructive action</AlertDialogTitle>
                    <AlertDialogDescription>
                      Dialog dùng button variants để giữ action/cancel semantics.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Confirm</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
