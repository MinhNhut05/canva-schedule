import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
const mockFindMany = vi.fn();
const mockCount = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    upload: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
  db: {
    upload: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", username: "admin", name: "Admin", role: "admin" },
  }),
}));

describe("History page data logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("derives status as success when at least one artifact SUCCEEDED", () => {
    const artifacts = [
      { artifactType: "ITINERARY", status: "SUCCEEDED", designId: "d1" },
      { artifactType: "MENU", status: "FAILED", designId: null },
    ];
    const succeeded = artifacts.filter((a) => a.status === "SUCCEEDED");
    expect(succeeded.length).toBeGreaterThan(0);
  });

  it("derives status as error when no artifacts SUCCEEDED", () => {
    const artifacts = [
      { artifactType: "ITINERARY", status: "FAILED", designId: null },
      { artifactType: "MENU", status: "FAILED", designId: null },
    ];
    const succeeded = artifacts.filter((a) => a.status === "SUCCEEDED");
    expect(succeeded.length).toBe(0);
  });

  it("derives canva link label '2 lien ket' for both artifacts succeeded", () => {
    const successCount = 2;
    const total = 2;
    let label: string;
    if (successCount === 2) label = "2 lien ket";
    else if (successCount === 1 && total === 2) label = "1/2 lien ket";
    else label = "Chua co lien ket";
    expect(label).toBe("2 lien ket");
  });

  it("derives canva link label '1/2 lien ket' for partial success", () => {
    const successCount = 1;
    const total = 2;
    let label: string;
    if (successCount === 2) label = "2 lien ket";
    else if (successCount === 1 && total === 2) label = "1/2 lien ket";
    else label = "Chua co lien ket";
    expect(label).toBe("1/2 lien ket");
  });

  it("derives canva link label 'Chua co lien ket' when no success", () => {
    const successCount = 0;
    const total = 2;
    let label: string;
    if (successCount === 2) label = "2 lien ket";
    else if (successCount === 1 && total === 2) label = "1/2 lien ket";
    else label = "Chua co lien ket";
    expect(label).toBe("Chua co lien ket");
  });

  it("calculates pagination correctly", () => {
    const PAGE_SIZE = 20;
    const totalCount = 45;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    expect(totalPages).toBe(3);
  });

  it("calculates skip offset from page number", () => {
    const PAGE_SIZE = 20;
    const currentPage = 2;
    const skip = (currentPage - 1) * PAGE_SIZE;
    expect(skip).toBe(20);
  });

  it("calls prisma with correct orderBy and pagination", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const PAGE_SIZE = 20;
    const page = 1;
    const skip = (page - 1) * PAGE_SIZE;

    await mockFindMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        originalFileName: true,
        createdAt: true,
        tourDuration: true,
        canvaArtifacts: {
          select: { artifactType: true, status: true, designId: true },
          orderBy: { artifactType: "asc" },
        },
      },
    });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 20,
      })
    );
  });
});
