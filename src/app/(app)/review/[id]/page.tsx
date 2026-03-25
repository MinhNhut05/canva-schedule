import { notFound, redirect } from "next/navigation";

import { ReviewPage } from "@/components/review/review-page";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDraft } from "@/lib/review/draft";

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
    where: { id, userId: session.user.id },
    select: {
      id: true,
      originalFileName: true,
      aiStatus: true,
      reviewStatus: true,
      aiErrorMessage: true,
      clientType: true,
      tourDuration: true,
    },
  });

  if (!upload) {
    notFound();
  }

  const draft = await getDraft(id);

  return (
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
    />
  );
}
