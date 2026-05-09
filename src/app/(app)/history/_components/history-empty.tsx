import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function HistoryEmpty() {
  return (
    <Card className="surface-panel-glass mx-auto max-w-xl border-semantic-light shadow-semantic-light">
      <CardContent className="flex flex-col items-center space-y-5 px-6 py-12 text-center">
        <div className="space-y-3">
          <h2 className="text-[28px] font-semibold leading-[1.2] text-foreground">
            Chưa có lịch sử tạo Canva
          </h2>
          <p className="max-w-md text-base leading-7 text-muted-foreground">
            Chưa có tour nào được tạo Canva. Hãy tải tài liệu để bắt đầu một luồng xử lý mới.
          </p>
        </div>
        <Button asChild className="glow-accent focus-ring-premium transition-premium hover-lift-subtle">
          <Link href="/upload">
            Tải tài liệu
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
