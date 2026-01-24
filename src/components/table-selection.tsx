"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function TableSelection() {
  const router = useRouter();
  const tables = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleSelectTable = (tableNumber: number) => {
    router.push(`/?table=${tableNumber}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl border-4 border-foreground shadow-[8px_8px_0px_#000]">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold text-foreground">
            Welcome to Grillicious!
          </CardTitle>
          <CardDescription className="text-lg text-foreground pt-2">
            Please select your table number to start your order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {tables.map((table) => (
              <Button
                key={table}
                onClick={() => handleSelectTable(table)}
                className="h-20 text-2xl font-bold bg-card text-card-foreground border-2 border-foreground shadow-[4px_4px_0px_#000] hover:bg-accent hover:text-accent-foreground active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                {table}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
