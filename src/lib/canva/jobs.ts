import "server-only";

import { canvaFetch } from "./client";

export interface GenerationJobResult {
  designId: string;
  editUrl: string;
  viewUrl: string;
  thumbnailUrl?: string;
}

export interface DirectDesignResult {
  mode: "design";
  designId: string;
}

export interface AutofillJobHandle {
  mode: "job";
  jobId: string;
}

export type CreateDesignResult = DirectDesignResult | AutofillJobHandle;
export type AutofillJobResult = GenerationJobResult;

const POLL_DELAYS_MS = [2000, 3000, 5000, 5000, 5000, 5000] as const;
const POLL_TIMEOUT_MS = 120_000; // 2 minutes (D-15)

export async function createAutofillJob(
  templateId: string,
  data: Record<string, { type: "text"; text: string }>,
  title: string
): Promise<string> {
  const response = await canvaFetch("/autofills", {
    method: "POST",
    body: JSON.stringify({
      brand_template_id: templateId,
      title,
      data,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown");
    throw new Error(`Canva generation failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  const jobId = payload?.job?.id;

  if (!jobId) {
    throw new Error("Canva generation returned no job ID");
  }

  return jobId as string;
}

export async function createDesignFromTemplate(
  sourceTemplateId: string,
  data: Record<string, { type: "text"; text: string }>,
  title: string
): Promise<CreateDesignResult> {
  const copyResponse = await canvaFetch("/designs", {
    method: "POST",
    body: JSON.stringify({
      design_id: sourceTemplateId,
      title,
    }),
  });

  if (!copyResponse.ok) {
    const errorText = await copyResponse.text().catch(() => "unknown");

    if (copyResponse.status === 400 || copyResponse.status === 404) {
      const jobId = await createAutofillJob(sourceTemplateId, data, title);
      return { mode: "job", jobId };
    }

    throw new Error(`Canva design copy failed (${copyResponse.status}): ${errorText}`);
  }

  const copyPayload = await copyResponse.json();
  const newDesignId = copyPayload?.design?.id;

  if (!newDesignId) {
    throw new Error("Canva design copy returned no design ID");
  }

  try {
    await populateDesignContent(newDesignId as string, data);
  } catch {
    // Best effort only: the copied design still exists and remains editable.
  }

  return {
    mode: "design",
    designId: newDesignId as string,
  };
}

async function populateDesignContent(
  designId: string,
  data: Record<string, { type: "text"; text: string }>
): Promise<void> {
  const response = await canvaFetch(`/designs/${designId}`, {
    method: "PATCH",
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown");
    throw new Error(
      `Canva design content update failed (${response.status}): ${errorText}`
    );
  }
}

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function pollAutofillJob(jobId: string): Promise<AutofillJobResult> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  for (const delayMs of POLL_DELAYS_MS) {
    await sleep(delayMs);

    if (Date.now() > deadline) {
      throw new Error("Canva tao thiet ke qua lau (vuot 2 phut). Vui long thu lai.");
    }

    const response = await canvaFetch(`/autofills/${jobId}`);
    if (!response.ok) {
      throw new Error(`Canva poll failed (${response.status})`);
    }

    const payload = await response.json();
    const job = payload?.job;

    if (job?.status === "success") {
      const design = job?.result?.design;
      return {
        designId: design?.id ?? "",
        editUrl: design?.urls?.edit_url ?? "",
        viewUrl: design?.urls?.view_url ?? "",
        thumbnailUrl: design?.thumbnail?.url,
      };
    }

    if (job?.status === "failed") {
      throw new Error(job?.error?.message ?? "Canva autofill failed");
    }
  }

  throw new Error("Canva generation timed out after polling");
}

export { POLL_DELAYS_MS, POLL_TIMEOUT_MS };
