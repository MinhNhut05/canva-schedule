import { Suspense } from "react";
import { redirect } from "next/navigation";

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
  const currentPage = Math.max(1, Number(params.page ?? 1));
  const skip = (currentPage - 1) * PAGE_SIZE;

  const [rows, totalCount] = await Promise.all([
    prisma.upload.findMany({
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
    prisma.upload.count(),
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
  );
}
