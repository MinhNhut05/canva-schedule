import "server-only";

import { canvaFetch } from "./client";

export interface DesignUrls {
  editUrl: string;
  viewUrl: string;
  thumbnailUrl?: string;
}

export async function getFreshDesignUrls(designId: string): Promise<DesignUrls> {
  const response = await canvaFetch(`/designs/${designId}`);

  if (!response.ok) {
    throw new Error(`Canva design lookup failed (${response.status})`);
  }

  const payload = await response.json();
  const design = payload?.design;

  return {
    editUrl: design?.urls?.edit_url ?? "",
    viewUrl: design?.urls?.view_url ?? "",
    thumbnailUrl: design?.thumbnail?.url,
  };
}
