import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function HistoryEmpty() {
  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="flex flex-col items-center space-y-4 py-12 text-center">
        <h2 className="text-[28px] font-semibold leading-[1.2] text-foreground">
          Chua co lich su tao Canva
        </h2>
        <p className="text-base text-muted-foreground">
          Chua co tour nao duoc tao Canva. Hay tai tai lieu de bat dau tao lich su xu ly moi.
        </p>
        <Button asChild>
          <Link href="/upload">Tai tai lieu</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
