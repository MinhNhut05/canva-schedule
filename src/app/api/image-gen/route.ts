import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { generateImages } from "@/lib/ai/image-client";
import { putImage } from "@/lib/storage/s3";

export const runtime = "nodejs";

const bodySchema = z.object({
  prompt: z.string().trim().min(1, "Vui lòng nhập mô tả ảnh."),
  size: z.enum(["auto", "1024x1024", "1024x1536", "1536x1024"]),
  n: z.number().int().min(1).max(4),
});

function buildKey(userId: string, batchId: string, index: number) {
  return `generated-images/${userId}/${Date.now()}-${batchId}-${index + 1}.png`;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục." },
        { status: 401 },
      );
    }

    const payload = await request.json().catch(() => null);
    const parsedBody = bodySchema.safeParse(payload);

    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: parsedBody.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." },
        { status: 400 },
      );
    }

    const images = await generateImages({
      prompt: parsedBody.data.prompt,
      size: parsedBody.data.size,
      n: parsedBody.data.n,
      userId: session.user.id,
    });

    const batchId = randomBytes(4).toString("hex");
    const uploaded = await Promise.all(
      images.map(async (image, index) => {
        const key = buildKey(session.user.id, batchId, index);
        const url = await putImage({
          key,
          bytes: image.bytes,
          contentType: image.contentType,
        });

        return { url, key };
      }),
    );

    return NextResponse.json({
      success: true,
      data: {
        images: uploaded,
      },
    });
  } catch (error) {
    const message = error instanceof Error && error.message.trim() ? error.message : "Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại sau.";

    return NextResponse.json(
      { success: false, error: message },
      { status: error instanceof Error && error.message.includes("Phiên đăng nhập") ? 401 : 500 },
    );
  }
}
