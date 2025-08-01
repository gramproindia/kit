"use client";

import React, { useState } from "react";
import { MessageCircle, X, Minimize2 } from "lucide-react";

interface FloatingChatbotProps {
  chatbotUrl?: string;
  buttonPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  primaryColor?: string;
  chatTitle?: string;
}

const FloatingChatbot: React.FC<FloatingChatbotProps> = ({
  chatbotUrl = "https://gbs-form-builder.vercel.app/bblock-chat",
  buttonPosition = "bottom-right",
  primaryColor = "from-blue-500 to-purple-600",
  chatTitle = "AI Assistant",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const toggleChat = () => {
    if (isOpen && !isMinimized) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
      setIsLoading(true);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Position classes based on prop
  const getPositionClasses = () => {
    switch (buttonPosition) {
      case "bottom-left":
        return {
          button: "bottom-6 left-6",
          widget: "bottom-24 left-6",
        };
      case "top-right":
        return {
          button: "top-6 right-6",
          widget: "top-24 right-6",
        };
      case "top-left":
        return {
          button: "top-6 left-6",
          widget: "top-24 left-6",
        };
      default: // bottom-right
        return {
          button: "bottom-6 right-6",
          widget: "bottom-24 right-6",
        };
    }
  };

  const positions = getPositionClasses();

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className={`fixed ${
          positions.button
        } w-14 h-14 bg-gradient-to-r ${primaryColor}
          hover:shadow-xl transform hover:scale-110 transition-all duration-300 z-50 
          flex items-center justify-center group rounded-full shadow-lg text-white
          ${isOpen && !isMinimized ? "rotate-180" : ""}`}
        aria-label="Toggle chat"
      >
        {isOpen && !isMinimized ? (
          <X className="w-6 h-6 transition-transform duration-300" />
        ) : (
          <MessageCircle className="w-6 h-6 transition-transform duration-300" />
        )}

        {/* Pulse effect when closed */}
        {!isOpen && (
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${primaryColor} animate-ping opacity-20`}
          ></div>
        )}
      </button>

      {/* Chat Widget */}
      {isOpen && (
        <div
          className={`fixed ${
            positions.widget
          } z-40 transition-all duration-300 ease-in-out
          ${isMinimized ? "w-80 h-12" : "w-96 h-[600px] max-h-[80vh]"}`}
        >
          {/* Chat Header */}
          <div
            className={`bg-gradient-to-r ${primaryColor} text-white px-4 py-3 
            rounded-t-lg flex items-center justify-between shadow-lg`}
          >
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-medium text-sm">{chatTitle}</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={minimizeChat}
                className="p-1 hover:bg-white/20 rounded transition-colors duration-200"
                aria-label="Minimize chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={closeChat}
                className="p-1 hover:bg-white/20 rounded transition-colors duration-200"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <div className="relative bg-white rounded-b-lg shadow-xl overflow-hidden">
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-sm">Loading chat...</p>
                  </div>
                </div>
              )}

              {/* Iframe */}
              <iframe
                src={chatbotUrl}
                className="w-full h-[548px] border-0"
                title="AI Chatbot"
                onLoad={handleIframeLoad}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}

      {/* Backdrop for mobile */}
      {isOpen && !isMinimized && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={closeChat}
        />
      )}
    </>
  );
};

export default FloatingChatbot;
