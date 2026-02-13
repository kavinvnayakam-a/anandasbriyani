"use client"

import { useEffect, useRef, useState } from 'react';
import { useToast } from "@/hooks/use-toast";

const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export const useSessionTimer = (onTimeout: () => void) => {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_MS);
  const hasTimedOut = useRef(false);

  useEffect(() => {
    let sessionStartTime = localStorage.getItem('dasara_session_start');
    
    if (!sessionStartTime) {
      sessionStartTime = Date.now().toString();
      localStorage.setItem('dasara_session_start', sessionStartTime);
    }

    const startTime = parseInt(sessionStartTime);
    const endTime = startTime + SESSION_DURATION_MS;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const remaining = endTime - now;

      if (remaining <= 0) {
        clearInterval(intervalId);
        setTimeLeft(0);
        
        if (!hasTimedOut.current) {
          hasTimedOut.current = true;
          handleExpiry();
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    const handleExpiry = () => {
      localStorage.removeItem('dasara_session_start');
      
      toast({
        title: "Dining Session Expired",
        description: "Your session at Dasara has ended. Thank you for visiting.",
        variant: "destructive",
      });

      onTimeout();

      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    };

    return () => clearInterval(intervalId);
  }, [onTimeout, toast]);

  return { 
    timeLeft,
    minutesLeft: Math.floor(timeLeft / 60000),
    secondsLeft: Math.floor((timeLeft % 60000) / 1000)
  };
};