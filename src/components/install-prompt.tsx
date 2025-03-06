'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { 
  Alert,
  AlertDescription
} from '@/components/ui/alert';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
}

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) {
      return;
    }

    const hasDismissed = localStorage.getItem('pwaPromptDismissed');
    if (hasDismissed && (Date.now() - Number(hasDismissed)) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();

    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwaPromptDismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <Alert className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 bg-white shadow-lg border">
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <Download className="h-5 w-5 mr-2 mt-0.5" />
          <AlertDescription className="flex-1">
            Install Locksmith4U as an app for quicker access and offline use.
          </AlertDescription>
        </div>
        <div className="flex space-x-2 ml-2">
          <Button 
            size="sm" 
            variant="default" 
            onClick={handleInstall}
            className="whitespace-nowrap"
          >
            Install
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}