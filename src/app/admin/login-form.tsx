
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Unlock, Mail, Lock, ShieldCheck } from "lucide-react";
import Image from "next/image";

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/dasara-finedine.firebasestorage.app/o/RAVOYI%20LOGO.pdf.webp?alt=media&token=f09f33b3-b303-400e-bbc4-b5dca418c8af";

export default function LoginForm() {
  const router = useRouter();
  const [auth, setAuth, isAuthLoaded] = useLocalStorage('ravoyi-admin-auth', false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthLoaded && auth === true) {
      router.push("/admin");
    }
  }, [auth, isAuthLoaded, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate authentication logic
    setTimeout(() => {
      if (email && password) {
        setAuth(true);
      } else {
        setIsLoading(false);
      }
    }, 1200);
  };

  if (!isAuthLoaded) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#b8582e] p-6 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-black blur-[120px]" />
      </div>

      <Card className="w-full max-w-md border-none bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] rounded-[3.5rem] overflow-hidden relative z-10 text-zinc-900">
        <CardHeader className="text-center pt-14 pb-8">
          <div className="relative mx-auto w-32 h-32 mb-8">
            {/* Logo Highlight Glow */}
            <div className="absolute -inset-4 bg-[#b8582e]/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative bg-white rounded-full border-4 border-[#b8582e]/10 shadow-2xl overflow-hidden h-full w-full">
              <Image 
                src={LOGO_URL} 
                alt="RAVOYI" 
                fill 
                className="object-cover" 
                priority
              />
            </div>
          </div>
          <CardTitle className="text-4xl font-black uppercase italic tracking-tighter text-zinc-900 leading-none">
            Kitchen Console
          </CardTitle>
          <CardDescription className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mt-4">
            RAVOYI Management System
          </CardDescription>
        </CardHeader>

        <CardContent className="px-10 pb-14">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Administrator Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 w-4 h-4" />
                <Input 
                  type="email" 
                  placeholder="admin@ravoyi.kitchen" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 bg-zinc-50 border-zinc-100 rounded-2xl font-bold text-zinc-900 placeholder:text-zinc-300 focus:ring-[#b8582e]/20 focus:border-[#b8582e] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Security Key</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 w-4 h-4" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 bg-zinc-50 border-zinc-100 rounded-2xl font-bold text-zinc-900 placeholder:text-zinc-300 focus:ring-[#b8582e]/20 focus:border-[#b8582e] transition-all"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit"
              disabled={isLoading} 
              className="w-full h-16 text-xs font-black uppercase tracking-[0.2em] bg-[#b8582e] hover:bg-zinc-900 text-white rounded-2xl shadow-xl shadow-[#b8582e]/20 active:scale-95 transition-all mt-6"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Unlock className="mr-2 h-4 w-4" />
                  Authenticate Access
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="h-px w-8 bg-zinc-100" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <p className="text-[8px] text-center text-zinc-300 font-bold uppercase tracking-[0.4em]">
                Authorized Personnel Only
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Footer Branding */}
      <div className="fixed bottom-8 left-0 w-full flex justify-center opacity-30 pointer-events-none">
         <p className="text-white text-[10px] font-black uppercase tracking-[1em]">GetPik Digital</p>
      </div>
    </div>
  );
}
