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

const MOCK_ACCESS_TOKEN = "mock-access-token";
const MOCK_REFRESH_TOKEN = "mock-refresh-token";

type CanvaTextField = {
  type: string;
  text: string;
};

type CanvaPatchData = Record<string, CanvaTextField>;

type StoredCanvaToken = {
  id: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  cooldownUntil: Date | null;
  scope: string | null;
  tokenType: string;
};

const capturedDesignPayloads = new Map<string, CanvaPatchData[]>();
let originalCanvaTokens: StoredCanvaToken[] = [];

const oneDayDraft = {
  duration: "ONE_DAY",
  programName: "CHƯƠNG TRÌNH TRẢI NGHIỆM NGOẠI KHÓA",
  title: "LONG TUYỀN 2 - SUỐI TIÊN",
  clientName: "Trường tiểu học Long Tuyền 2",
  clientType: "SCHOOL",
  schoolName: "Trường tiểu học Long Tuyền 2",
  tourDate: "2026-03-18",
  greetingText: "Quý thầy cô và các bạn học sinh",
  pickupLocation: "Trường tiểu học Long Tuyền 2",
  returnLocation: "Trường tiểu học Long Tuyền 2",
  reviewFlags: [],
  itinerary: {
    morning: [
      {
        timeLabel: "6:00",
        text: "Quý thầy cô và các bạn học sinh dùng bữa sáng tại nhà hàng.",
        sourceConfidence: "high",
        needsReview: false,
      },
    ],
    afternoon: [
      {
        timeLabel: "13:00",
        text:
          "Quý thầy cô và các bạn học sinh tự do tham quan và vui chơi tại Công viên văn hóa Suối Tiên:\n• Tham quan Giang Sơn Bách Thú.\n• Tham quan thủy cung Suối Tiên.\n• Trải nghiệm các trò chơi: Vũ điệu ong vàng, Chuyến tàu mơ ước, Ngựa phi nước đại, Phi cơ, Lâu đài tuyết, film 9D, Vương quốc cá sấu, Tinh tú thiên hà, Ghế bay, Tàu lượn siêu tốc, Xe điện đụng, Đĩa bay hành tinh lạ.",
        sourceConfidence: "high",
        needsReview: false,
      },
      {
        timeLabel: "15:30",
        text: "Khởi hành về lại điểm hẹn.",
        sourceConfidence: "high",
        needsReview: false,
      },
    ],
  },
  menu: {
    morning: [{ text: "Bún bò/ Hủ tiếu nam vang, Trà đá", needsReview: false }],
    lunch: [
      { text: "Cơm trưa", needsReview: false },
      { text: "Canh rau", needsReview: false },
    ],
    afternoon: [{ text: "Nước suối", needsReview: false }],
  },
} satisfies Prisma.InputJsonValue;

let canvaMockServer: http.Server | null = null;

async function backupCanvaTokens() {
  originalCanvaTokens = await prisma.canvaToken.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      accessToken: true,
      refreshToken: true,
      expiresAt: true,
      cooldownUntil: true,
      scope: true,
      tokenType: true,
    },
  });
}

async function restoreCanvaTokens() {
  await prisma.canvaToken.deleteMany();

  if (originalCanvaTokens.length === 0) {
    return;
  }

  await prisma.canvaToken.createMany({
    data: originalCanvaTokens,
  });
}

async function clearMockCanvaTokens() {
  await prisma.canvaToken.deleteMany({
    where: {
      OR: [
        { accessToken: MOCK_ACCESS_TOKEN },
        { refreshToken: MOCK_REFRESH_TOKEN },
      ],
    },
  });
}

async function seedSuccessfulMockCanvaToken() {
  await prisma.canvaToken.deleteMany();
  await prisma.canvaToken.create({
    data: {
      accessToken: MOCK_ACCESS_TOKEN,
      refreshToken: MOCK_REFRESH_TOKEN,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      tokenType: "Bearer",
      scope: "design:content:write",
    },
  });
}

async function ensureNoMockCanvaTokensRemain() {
  const tokens = await prisma.canvaToken.findMany({
    select: { accessToken: true, refreshToken: true },
  });

  const hasMockTokens = tokens.some(
    (token) => token.accessToken === MOCK_ACCESS_TOKEN || token.refreshToken === MOCK_REFRESH_TOKEN,
  );

  expect(hasMockTokens).toBe(false);
}

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

async function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return null;
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function resetCapturedDesignPayloads() {
  capturedDesignPayloads.clear();
}

function captureDesignPayload(designId: string, body: unknown) {
  if (!body || typeof body !== "object" || !("data" in body)) {
    return;
  }

  const data = (body as { data?: unknown }).data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return;
  }

  const payloads = capturedDesignPayloads.get(designId) ?? [];
  payloads.push(data as CanvaPatchData);
  capturedDesignPayloads.set(designId, payloads);
}

function getCapturedPayloadCount(designId: string) {
  return capturedDesignPayloads.get(designId)?.length ?? 0;
}

function getLatestCapturedPayload(designId: string): CanvaPatchData {
  const payloads = capturedDesignPayloads.get(designId) ?? [];
  const latest = payloads.at(-1);

  if (!latest) {
    throw new Error(`No captured Canva payload for ${designId}`);
  }

  return latest;
}

async function startCanvaMockServer() {
  resetCapturedDesignPayloads();

  await new Promise<void>((resolve) => {
    canvaMockServer = http.createServer(async (req, res) => {
      const url = new URL(req.url ?? "/", "http://127.0.0.1:4010");
      const sendJson = (status: number, body: unknown) => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(body));
      };

      if (req.method === "POST" && url.pathname === "/rest/v1/oauth/token") {
        sendJson(200, {
          access_token: MOCK_ACCESS_TOKEN,
          refresh_token: MOCK_REFRESH_TOKEN,
          expires_in: 3600,
          token_type: "Bearer",
          scope: "design:content:write",
        });
        return;
      }

      if (req.method === "POST" && url.pathname === "/rest/v1/designs") {
        const body = await readJsonBody(req);
        const title =
          body && typeof body === "object" && "title" in body
            ? String((body as { title?: unknown }).title ?? "")
            : "";
        const designId = title.includes("Lịch trình")
          ? ITINERARY_DESIGN_ID
          : MENU_DESIGN_ID;

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
        const body = await readJsonBody(req);
        const designId = url.pathname.endsWith(ITINERARY_DESIGN_ID)
          ? ITINERARY_DESIGN_ID
          : MENU_DESIGN_ID;

        captureDesignPayload(designId, body);
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
  await page.getByRole("button", { name: "Vào không gian làm việc" }).click();
  await expect(page).toHaveURL(/\/upload/, { timeout: 10000 });
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
      canvaOptions: { mergeMenuIntoItinerary: false },
      aiModel: "mock-model",
      aiAttemptCount: 1,
      clientType: "SCHOOL",
      tourDuration: "ONE_DAY",
    },
  });
}

test.describe("Review to Canva generation flow", () => {
  test.beforeAll(async () => {
    await backupCanvaTokens();
    await clearMockCanvaTokens();
    await startCanvaMockServer();
  });

  test.afterAll(async () => {
    await stopCanvaMockServer();
    await clearMockCanvaTokens();
    await restoreCanvaTokens();
    await ensureNoMockCanvaTokensRemain();
    await prisma.$disconnect();
  });

  test.beforeEach(async () => {
    resetCapturedDesignPayloads();
    await seedApprovedReviewUpload();
    await seedSuccessfulMockCanvaToken();
  });

  test("captures canonical one-day payload changes when the saved merge option changes", async ({
    page,
  }) => {
    await signIn(page);
    await page.goto(`/review/${TEST_UPLOAD_ID}`);

    const mergeSwitch = page.getByRole("switch", {
      name: "Có nhập menu vào lịch trình không?",
    });

    await expect(page.getByText("Xác nhận mẫu Canva")).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^Xác nhận nội dung$/ })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Có nhập menu vào lịch trình không?" }),
    ).toBeVisible();
    await expect(mergeSwitch).not.toBeChecked();

    await page.getByRole("button", { name: /^Xác nhận nội dung$/ }).click();

    await expect(page.getByText("Giai đoạn 4 · Tạo thiết kế Canva")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Xác nhận mẫu Canva" }),
    ).toBeVisible();
    await expect(page.getByText("Tour 1 ngày — Lịch trình")).toBeVisible();
    await expect(page.getByText("Tour 1 ngày — Thực đơn")).toBeVisible();

    await page.getByRole("button", { name: "Tạo Canva" }).first().click();

    await expect(
      page.getByText("Quá trình này thường mất 10–30 giây."),
    ).toBeVisible();
    await expect
      .poll(() => getCapturedPayloadCount(ITINERARY_DESIGN_ID), {
        timeout: 15000,
      })
      .toBe(1);

    await expect(
      page.getByRole("heading", { name: "Lịch trình", exact: true }),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: "Thực đơn", exact: true }),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Liên kết Canva đã sẵn sàng.")).toHaveCount(2);

    const initialItineraryPayload = getLatestCapturedPayload(ITINERARY_DESIGN_ID);
    expect(initialItineraryPayload["program_label"]).toEqual({
      type: "text",
      text: "CHƯƠNG TRÌNH TRẢI NGHIỆM NGOẠI KHÓA",
    });
    expect(initialItineraryPayload["title"]).toEqual({
      type: "text",
      text: "LONG TUYỀN 2 - SUỐI TIÊN",
    });
    expect(initialItineraryPayload["morning_block"].text).toContain(
      "06 giờ 00:\nQuý thầy cô và các bạn học sinh dùng bữa sáng tại nhà hàng.",
    );
    expect(initialItineraryPayload["morning_block"].text).not.toContain("Món ăn:");
    expect(initialItineraryPayload["afternoon_block"].text).toContain(
      "13 giờ 00:\nSau khi dùng bữa, Quý thầy cô và các bạn học sinh tự do tham quan và vui chơi tại Công viên văn hóa Suối Tiên:",
    );
    expect(initialItineraryPayload["afternoon_block"].text).toContain(
      "Giang Sơn Bách Thú.",
    );
    expect(initialItineraryPayload["afternoon_block"].text).toContain(
      "Thủy cung Suối Tiên.",
    );
    expect(initialItineraryPayload["afternoon_block"].text).toContain(
      "Các trò chơi tuổi thơ, phổ thông, cảm giác mạnh.",
    );
    expect(initialItineraryPayload["afternoon_block"].text).toContain(
      "15 giờ 30:\nĐoàn khởi hành về Trường tiểu học Long Tuyền 2.",
    );
    expect(initialItineraryPayload["afternoon_block"].text).not.toContain("Món ăn:");

    await mergeSwitch.click();
    await expect(page.getByText("Đã lưu tùy chọn tạo Canva.")).toBeVisible();
    await expect(
      page.getByText("Nội dung 1 ngày hiện có thể quá dài cho mẫu Canva."),
    ).toBeVisible();
    await expect(mergeSwitch).toBeChecked();

    await page.getByRole("button", { name: "Tạo lại Canva" }).first().click();

    await expect
      .poll(() => getCapturedPayloadCount(ITINERARY_DESIGN_ID), {
        timeout: 15000,
      })
      .toBe(2);

    const mergedItineraryPayload = getLatestCapturedPayload(ITINERARY_DESIGN_ID);
    expect(mergedItineraryPayload["morning_block"].text).toContain(
      "06 giờ 00:\nQuý thầy cô và các bạn học sinh dùng bữa sáng tại nhà hàng.\nMón ăn: Bún bò/ Hủ tiếu nam vang\nNước uống: Trà đá",
    );
    expect(mergedItineraryPayload["afternoon_block"].text).toContain(
      "13 giờ 00:\nSau khi dùng bữa, Quý thầy cô và các bạn học sinh tự do tham quan và vui chơi tại Công viên văn hóa Suối Tiên:",
    );
    expect(mergedItineraryPayload["afternoon_block"].text).toContain(
      "Món ăn: Cơm trưa, Canh rau",
    );
    expect(mergedItineraryPayload["afternoon_block"].text).toContain(
      "Nước uống: Nước suối",
    );
    expect(mergedItineraryPayload["afternoon_block"].text).toContain(
      "15 giờ 30:\nĐoàn khởi hành về Trường tiểu học Long Tuyền 2.",
    );
    expect(
      mergedItineraryPayload["afternoon_block"].text.indexOf("Món ăn: Cơm trưa, Canh rau"),
    ).toBeLessThan(
      mergedItineraryPayload["afternoon_block"].text.indexOf("15 giờ 30"),
    );
    expect(mergedItineraryPayload["afternoon_block"].text).not.toContain("Thực đơn trưa:");
    expect(mergedItineraryPayload["afternoon_block"].text).not.toContain("\n\n");
    expect(mergedItineraryPayload["afternoon_block"].text).not.toBe(
      initialItineraryPayload["afternoon_block"].text,
    );

    const canvaLinks = page.getByRole("link", { name: "Mở trong Canva" });
    await expect(canvaLinks).toHaveCount(2);
    const canvaHrefs = await canvaLinks.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href") ?? ""),
    );
    expect(canvaHrefs.some((href) => href.includes(ITINERARY_DESIGN_ID))).toBe(true);
    expect(canvaHrefs.some((href) => href.includes(MENU_DESIGN_ID))).toBe(true);

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
    ).resolves.toMatch(new RegExp(`${ITINERARY_DESIGN_ID}|${MENU_DESIGN_ID}`));

    await expect(canvaLinks.nth(0)).toHaveAttribute(
      "href",
      new RegExp(`${ITINERARY_DESIGN_ID}|${MENU_DESIGN_ID}`),
    );
    await expect(canvaLinks.nth(0)).toHaveAttribute("target", "_blank");
    await expect(canvaLinks.nth(0)).toHaveAttribute("rel", /noreferrer/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto(`/review/${TEST_UPLOAD_ID}`);
    await expect(
      page.getByRole("heading", { name: "Lịch trình", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Thực đơn", exact: true }),
    ).toBeVisible();
    await expect(mergeSwitch).toBeChecked();
    await expect(
      page.getByText("Nội dung 1 ngày hiện có thể quá dài cho mẫu Canva."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Mở trong Canva" })).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Sao chép link" })).toHaveCount(2);
  });
});
