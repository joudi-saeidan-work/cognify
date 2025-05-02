"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const DashboardPwaInstaller = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleInstallClick = () => {
    setIsDialogOpen(true);
  };

  const handleDialogConfirm = () => {
    // Open the installation page in a new tab
    window.open("/install", "_blank");
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Install Audio Recorder</span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install Cognify Audio Recorder</DialogTitle>
            <DialogDescription>
              The installation will open in a new tab, so you can continue using
              the web app. Once installed, you can access the audio recorder
              directly from your device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDialogConfirm}>Open Install Page</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardPwaInstaller;
