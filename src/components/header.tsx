"use client"
import { CartIcon } from "@/components/cart-icon";
import SessionTimer from "@/components/session-timer";

type HeaderProps = {
  tableId: string | null;
  onCartClick: () => void;
  timeLeft: number;
};

export function Header({ tableId, onCartClick, timeLeft }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-background border-b-4 border-foreground">
      <div className="container mx-auto flex h-24 items-center justify-between px-4 md:px-6">
        <div className="text-3xl font-extrabold text-foreground">
          Grillicious
        </div>
        <div className="flex items-center gap-4">
          {tableId && (
            <>
              {/* Mobile timer and table ID */}
              <div className="flex items-center gap-4 sm:hidden">
                  <SessionTimer timeLeft={timeLeft} />
                  <div className="flex items-center gap-2 rounded-md border-2 border-foreground bg-card px-3 py-1.5 text-foreground shadow-[2px_2px_0px_#000]">
                      <span className="text-sm">TABLE</span>
                      <span className="text-lg">{tableId}</span>
                  </div>
              </div>
              {/* Desktop timer and table ID */}
              <div className="hidden sm:flex items-center gap-4">
                  <div className="flex items-center gap-3">
                      <SessionTimer timeLeft={timeLeft} />
                      <p className="text-xs text-muted-foreground max-w-40">
                        Order within 10mins as the session will be cleared post 10mins.
                      </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border-2 border-foreground bg-card px-3 py-1.5 text-foreground shadow-[2px_2px_0px_#000]">
                      <span className="text-sm">TABLE</span>
                      <span className="text-lg">{tableId}</span>
                  </div>
              </div>
            </>
          )}
          <div className="hidden md:block">
            <CartIcon onOpen={onCartClick} />
          </div>
        </div>
      </div>
    </header>
  );
}
