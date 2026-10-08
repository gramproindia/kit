"use client";

import { Dialog } from "@/legacy-components/dialog";
import React, { useState } from "react";

export const DialogWrapper = () => {
  const [showDialog, setShowDialog] = useState(false);

  const handleOpenDialog = () => {
    setShowDialog(true);
  };

  const handleActionOne = () => {
    console.log("Action One Clicked");
    setShowDialog(false);
  };

  const handleActionTwo = () => {
    console.log("Action Two Clicked");
    setShowDialog(false);
  };

  return (
    <div className="app-container">
      <button
        onClick={handleOpenDialog}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Open Dialog
      </button>

      <Dialog
        showDialog={showDialog}
        dialogMessage="Do you want to proceed with this action?"
        dialogActionOne="Yes"
        dialogActionTwo="No"
        onDialogActionOneClick={handleActionOne}
        onDialogActionTwoClick={handleActionTwo}
      />
    </div>
  );
};
