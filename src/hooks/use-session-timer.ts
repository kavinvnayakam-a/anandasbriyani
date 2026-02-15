
"use client"

import { useEffect, useRef, useState } from 'react';
import { useToast } from "@/hooks/use-toast";

const SESSION_DURATION_MS = 3 * 60 * 1000; // 3 minutes for demo purposes

export const useSessionTimer = (onTimeout: () => void) => {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION_MS);
  const hasTimedOut = useRef(false);

  useEffect(() => {
    let sessionStartTime = localStorage.getItem('art_cinemas_session_start');
    
    if (!sessionStartTime) {
      sessionStartTime = Date.now().toString();
      localStorage.setItem('art_cinemas_session_start', sessionStartTime);
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
      localStorage.removeItem('art_cinemas_session_start');
      
      toast({
        title: "Order Session Ending",
        description: "Your session at ART Cinemas is concluding. Enjoy the movie!",
        variant: "destructive",
      });

      onTimeout();
    };

    return () => clearInterval(intervalId);
  }, [onTimeout, toast]);

  return { 
    timeLeft,
    minutesLeft: Math.floor(timeLeft / 60000),
    secondsLeft: Math.floor((timeLeft % 60000) / 1000)
  };
};
