import { notFound, redirect } from "next/navigation";

import { loadCanvaArtifacts } from "@/app/(app)/review/[id]/actions";
import { ReviewPage } from "@/components/review/review-page";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDraft } from "@/lib/review/draft";
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
    where: { id },
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

  const draft = await getDraft(id);
  const canvaArtifacts = await loadCanvaArtifacts(upload.id);
  const templatePair = upload.tourDuration
    ? await resolveTemplatePair(upload.tourDuration as TourDuration)
    : null;
  const cooldownUntil = await getGlobalCooldown();

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
      canvaArtifacts={canvaArtifacts}
      templatePair={templatePair}
      initialCooldownUntil={cooldownUntil?.toISOString() ?? null}
    />
  );
}
