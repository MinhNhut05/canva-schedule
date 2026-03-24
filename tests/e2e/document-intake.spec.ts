import { expect, test } from "@playwright/test";

const TEST_USER = {
  username: "admin",
  password: "password123",
};

const PDF_FIXTURE = "tests/fixtures/documents/sample-tour-vi.pdf";
const DOCX_FIXTURE = "tests/fixtures/documents/sample-tour-vi.docx";
const EMPTY_PDF_FIXTURE = "tests/fixtures/documents/empty-no-text.pdf";
const UNSUPPORTED_FIXTURE = "tests/fixtures/documents/not-a-pdf.bin";

async function signIn(page: import("@playwright/test").Page) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.fill("#username", TEST_USER.username);
  await page.fill("#password", TEST_USER.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe("Document intake flow", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.goto("/upload");
    await expect(page).toHaveURL(/\/upload/);
  });

  test("truy cập trang tải lên và thấy tiêu đề tiếng Việt có dấu", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Tải lên và trích xuất tài liệu" })
    ).toBeVisible();
    await expect(
      page.getByText(
        "Tải file PDF hoặc DOCX để lấy văn bản thô trước khi chuyển sang bước AI."
      )
    ).toBeVisible();
    await expect(page.getByText("Mỗi lần chỉ xử lý 1 file để dễ kiểm tra kết quả trích xuất.")).toBeVisible();
  });

  test("sidebar hiển thị nhãn điều hướng tiếng Việt", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Bảng điều khiển" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tải tài liệu" })).toBeVisible();
    await expect(page.getByText("Lịch sử")).toBeVisible();
    await expect(page.getByText("Cài đặt")).toBeVisible();
    await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
  });

  test("tải lên PDF và hiển thị phần xem trước metadata", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(PDF_FIXTURE);

    await expect(page.getByText("Thông tin file đã chọn")).toBeVisible();
    await expect(page.getByText("sample-tour-vi.pdf")).toBeVisible();
    await expect(page.getByText("PDF", { exact: true })).toBeVisible();
    await expect(page.getByText("Sẵn sàng xử lý")).toBeVisible();
    await expect(page.locator("text=/[0-9]+\\.[0-9]{2} (KB|MB)/").first()).toBeVisible();
  });

  test("tải lên DOCX và hiển thị phần xem trước metadata", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(DOCX_FIXTURE);

    await expect(page.getByText("Thông tin file đã chọn")).toBeVisible();
    await expect(page.getByText("sample-tour-vi.docx")).toBeVisible();
    await expect(page.getByText("DOCX", { exact: true })).toBeVisible();
    await expect(page.getByText("Sẵn sàng xử lý")).toBeVisible();
  });

  test("từ chối file không hỗ trợ với thông báo tiếng Việt có dấu", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(UNSUPPORTED_FIXTURE);

    await expect(
      page.getByText(
        "Định dạng file không được hỗ trợ. Vui lòng chọn file PDF hoặc DOCX."
      )
    ).toBeVisible();
    await expect(page.getByText("Thông tin file đã chọn")).not.toBeVisible();
  });

  test("bấm xử lý sẽ gửi file, hiện trạng thái đang xử lý và trả về kết quả trích xuất", async ({ page }) => {
    await page.evaluate(() => {
      const originalFetch = window.fetch.bind(window);

      window.fetch = async (input, init) => {
        const requestUrl =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : String(input);

        if (requestUrl.includes("/api/uploads")) {
          await new Promise((resolve) => window.setTimeout(resolve, 400));
        }

        return originalFetch(input, init);
      };
    });

    await page.locator('input[type="file"]').setInputFiles(PDF_FIXTURE);
    await expect(page.getByText("sample-tour-vi.pdf")).toBeVisible();
    await page.getByRole("button", { name: /^Xử lý$/ }).click();

    await expect(page.getByRole("button", { name: "Đang xử lý..." })).toBeVisible();
    await expect(page.getByText("Đang phân tích file và trích xuất văn bản...")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Kết quả trích xuất" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Đã trích xuất văn bản thành công.")).toBeVisible();
    await expect(page.getByText("sample-tour-vi.pdf").first()).toBeVisible();
    await expect(page.getByText("Tốt", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nội dung văn bản" })).toBeVisible();
    await expect(page.getByText("CHƯƠNG TRÌNH TOUR")).toBeVisible();
  });

  test("hiển thị cảnh báo chất lượng cho PDF rỗng nhưng vẫn cho kiểm tra nội dung", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(EMPTY_PDF_FIXTURE);
    await page.getByRole("button", { name: /^Xử lý$/ }).click();

    await expect(page.getByRole("heading", { name: "Kết quả trích xuất" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Chất lượng trích xuất thấp")).toBeVisible();
    await expect(
      page.getByText(
        "Nội dung lấy ra có thể không chính xác. Bạn có thể tiếp tục kiểm tra hoặc tải file khác để thử lại."
      )
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Tiếp tục kiểm tra" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tải file khác" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nội dung văn bản" })).toBeVisible();
    await expect(
      page.getByText("Văn bản trích xuất sẽ hiển thị ở đây sau khi xử lý.")
    ).toBeVisible();
  });

  test("hành động chọn file khác sẽ đặt lại form tải lên", async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(PDF_FIXTURE);
    await expect(page.getByText("sample-tour-vi.pdf")).toBeVisible();

    await page.getByRole("button", { name: "Chọn file khác" }).click();

    await expect(page.getByText("Thông tin file đã chọn")).not.toBeVisible();
    await expect(page.getByText("sample-tour-vi.pdf")).not.toBeVisible();
    await expect(page.getByText("Kéo và thả file vào đây")).toBeVisible();
  });
});
