"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Unlock, ShieldCheck } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [, setAuth] = useLocalStorage('grillicious-admin-auth', false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDevLogin = () => {
    setIsLoading(true);
    
    // Simulate a quick check for a better UX
    setTimeout(() => {
      setAuth(true);
      router.push("/admin");
    }, 500);
  };

  return (
    <Card className="w-full max-w-md border-4 border-zinc-900 bg-white shadow-[12px_12px_0px_0px_#18181b] rounded-[2.5rem] overflow-hidden">
      <CardHeader className="text-center pt-10 pb-6">
        <div className="mx-auto bg-zinc-900 p-4 rounded-2xl w-fit mb-4">
          <ShieldCheck className="w-8 h-8 text-[#e76876]" />
        </div>
        <CardTitle className="text-4xl font-black uppercase italic tracking-tighter text-zinc-900 leading-none">
          Admin Portal
        </CardTitle>
        <CardDescription className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-3">
          Development Mode Active
        </CardDescription>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl p-4 text-center">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
            Geolocation security is currently disabled for development.
          </p>
        </div>

        <Button 
          onClick={handleDevLogin} 
          disabled={isLoading} 
          className="w-full h-16 text-lg font-black uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl shadow-[4px_4px_0px_0px_#e76876] active:shadow-none active:translate-y-1 transition-all"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          ) : (
            <>
              <Unlock className="mr-2 h-6 w-6 text-[#e76876]" />
              Enter Dashboard
            </>
          )}
        </Button>
        
        <p className="text-[9px] text-center text-zinc-400 font-bold uppercase tracking-widest">
          Swiss Delights Management System v1.0
        </p>
      </CardContent>
    </Card>
  );
}
