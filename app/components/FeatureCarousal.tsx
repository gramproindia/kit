"use client";

import { slides } from "@/lib/featurecarousal";
import Image from "next/image";
import React, { useState, useEffect } from "react";

const FeatureCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-lg shadow-lg">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="w-full flex-shrink-0">
              <a href={slide.link} target="_blank" rel="noopener noreferrer">
                <Image
                  src={slide.src}
                  alt={`Slide ${slide.id}`}
                  width={800}
                  height={450}
                  className="w-full object-cover hover:opacity-90 transition-opacity duration-200"
                />
              </a>
            </div>
          ))}
        </div>

        <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1.5 sm:space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-1.5 h-1.5 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                  currentSlide === index
                    ? "bg-white shadow-lg"
                    : "bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureCarousel;
