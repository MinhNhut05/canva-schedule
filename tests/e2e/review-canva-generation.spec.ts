import http from "node:http";
import { PrismaClient, type Prisma } from "@prisma/client";
import { expect, test } from "@playwright/test";

const prisma = new PrismaClient();

const TEST_USER = {
  username: "admin",
  password: "password123",
};

const TEST_UPLOAD_ID = "review-canva-e2e-upload";
const ITINERARY_DESIGN_ID = "design-itinerary-e2e";
const MENU_DESIGN_ID = "design-menu-e2e";

const oneDayDraft = {
  duration: "ONE_DAY",
  title: "Tour trải nghiệm SileTravel",
  clientName: "THCS An Thạnh Tây",
  clientType: "SCHOOL",
  schoolName: "THCS An Thạnh Tây",
  tourDate: "2026-03-25",
  greetingText: "Quý thầy cô và các bạn học sinh",
  pickupLocation: "Trường THCS An Thạnh Tây",
  returnLocation: "Trường THCS An Thạnh Tây",
  reviewFlags: [],
  itinerary: {
    morning: [
      {
        text: "Khởi hành từ trường và tham quan điểm đến buổi sáng",
        sourceConfidence: "high",
        needsReview: false,
      },
    ],
    afternoon: [
      {
        text: "Tiếp tục hoạt động buổi chiều và trở về trường",
        sourceConfidence: "high",
        needsReview: false,
      },
    ],
  },
  menu: {
    morning: [{ text: "Bánh mì", needsReview: false }],
    lunch: [{ text: "Cơm phần", needsReview: false }],
    afternoon: [{ text: "Trái cây", needsReview: false }],
  },
} satisfies Prisma.InputJsonValue;

let canvaMockServer: http.Server | null = null;
let createDesignRequestCount = 0;

function designResponse(designId: string) {
  return {
    design: {
      id: designId,
      urls: {
        edit_url: `https://www.canva.com/design/${designId}/edit`,
        view_url: `https://www.canva.com/design/${designId}/view`,
      },
      thumbnail: {
        url: `https://cdn.canva.com/${designId}.png`,
      },
    },
  };
}

async function startCanvaMockServer() {
  createDesignRequestCount = 0;

  await new Promise<void>((resolve) => {
    canvaMockServer = http.createServer((req, res) => {
      const url = new URL(req.url ?? "/", "http://127.0.0.1:4010");
      const sendJson = (status: number, body: unknown) => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(body));
      };

      if (req.method === "POST" && url.pathname === "/rest/v1/oauth/token") {
        sendJson(200, {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          token_type: "Bearer",
          scope: "design:content:write",
        });
        return;
      }

      if (req.method === "POST" && url.pathname === "/rest/v1/designs") {
        createDesignRequestCount += 1;
        const designId =
          createDesignRequestCount === 1 ? ITINERARY_DESIGN_ID : MENU_DESIGN_ID;
        setTimeout(() => {
          sendJson(200, { design: { id: designId } });
        }, 200);
        return;
      }

      if (
        req.method === "PATCH" &&
        (url.pathname === `/rest/v1/designs/${ITINERARY_DESIGN_ID}` ||
          url.pathname === `/rest/v1/designs/${MENU_DESIGN_ID}`)
      ) {
        sendJson(200, { ok: true });
        return;
      }

      if (req.method === "GET" && url.pathname === `/rest/v1/designs/${ITINERARY_DESIGN_ID}`) {
        sendJson(200, designResponse(ITINERARY_DESIGN_ID));
        return;
      }

      if (req.method === "GET" && url.pathname === `/rest/v1/designs/${MENU_DESIGN_ID}`) {
        sendJson(200, designResponse(MENU_DESIGN_ID));
        return;
      }

      sendJson(404, { error: `Unhandled mock path: ${req.method} ${url.pathname}` });
    });

    canvaMockServer.listen(4010, "127.0.0.1", () => resolve());
  });
}

async function stopCanvaMockServer() {
  if (!canvaMockServer) return;

  await new Promise<void>((resolve, reject) => {
    canvaMockServer?.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  canvaMockServer = null;
}

async function signIn(page: import("@playwright/test").Page) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.fill("#username", TEST_USER.username);
  await page.fill("#password", TEST_USER.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

async function seedApprovedReviewUpload() {
  const user = await prisma.user.findUnique({
    where: { username: TEST_USER.username },
    select: { id: true },
  });

  if (!user) {
    throw new Error("Seed user admin is missing. Run prisma db seed first.");
  }

  await prisma.canvaArtifact.deleteMany({ where: { uploadId: TEST_UPLOAD_ID } });
  await prisma.upload.deleteMany({ where: { id: TEST_UPLOAD_ID } });

  await prisma.upload.create({
    data: {
      id: TEST_UPLOAD_ID,
      userId: user.id,
      originalFileName: "sample-tour-vi.pdf",
      detectedMime: "application/pdf",
      sourceKind: "upload",
      sizeBytes: 1024,
      status: "COMPLETED",
      rawText: "Chương trình tour mẫu",
      normalizedText: "Chương trình tour mẫu",
      qualityScore: 0.95,
      qualityLevel: "GOOD",
      warningMessages: [],
      aiStatus: "READY_FOR_REVIEW",
      reviewStatus: "PENDING_REVIEW",
      structuredDraft: oneDayDraft,
      reviewFlags: [],
      aiModel: "mock-model",
      aiAttemptCount: 1,
      clientType: "SCHOOL",
      tourDuration: "ONE_DAY",
    },
  });
}

test.describe("Review to Canva generation flow", () => {
  test.beforeAll(async () => {
    await startCanvaMockServer();
  });

  test.afterAll(async () => {
    await stopCanvaMockServer();
    await prisma.$disconnect();
  });

  test.beforeEach(async () => {
    await seedApprovedReviewUpload();
  });

  test("covers approval gate, template confirmation, generation, actions, and revisit persistence", async ({
    page,
    context,
  }) => {
    await signIn(page);
    await page.goto(`/review/${TEST_UPLOAD_ID}`);

    await expect(page.getByText("Xác nhận mẫu Canva")).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^Xác nhận$/ })).toBeVisible();

    await page.getByRole("button", { name: /^Xác nhận$/ }).click();

    await expect(
      page.getByRole("heading", { name: "Nội dung đã được duyệt" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Xác nhận mẫu Canva" }),
    ).toBeVisible();
    await expect(page.getByText("Tour 1 ngày — Lịch trình")).toBeVisible();
    await expect(page.getByText("Tour 1 ngày — Thực đơn")).toBeVisible();

    await page.getByRole("button", { name: "Tạo Canva" }).first().click();

    await expect(
      page.getByText("Quá trình này thường mất 10–30 giây."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Đang tạo Canva..." }),
    ).toBeVisible();

    await expect(page.getByText("Lịch trình")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Thực đơn")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Liên kết Canva đã sẵn sàng.")).toHaveCount(2);

    const canvaLinks = page.getByRole("link", { name: "Mở trong Canva" });
    await expect(canvaLinks).toHaveCount(2);
    await expect(canvaLinks.nth(0)).toHaveAttribute(
      "href",
      new RegExp(ITINERARY_DESIGN_ID),
    );
    await expect(canvaLinks.nth(1)).toHaveAttribute(
      "href",
      new RegExp(MENU_DESIGN_ID),
    );

    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value: string) => {
            (window as typeof window & { __copied?: string }).__copied = value;
          },
        },
      });
    });

    await page.getByRole("button", { name: "Sao chép link" }).first().click();
    await expect(page.getByText("Đã sao chép liên kết Canva.")).toBeVisible();
    await expect(
      page.evaluate(() => (window as typeof window & { __copied?: string }).__copied),
    ).resolves.toContain(ITINERARY_DESIGN_ID);

    const [newTab] = await Promise.all([
      context.waitForEvent("page"),
      canvaLinks.nth(0).click(),
    ]);
    await newTab.waitForLoadState();
    await expect(newTab).toHaveURL(new RegExp(ITINERARY_DESIGN_ID));
    await newTab.close();

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto(`/review/${TEST_UPLOAD_ID}`);
    await expect(page.getByRole("heading", { name: "Lịch trình" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Thực đơn" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Mở trong Canva" })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Sao chép link" })).toHaveCount(2);
  });
});
