import React from "react";

export default function LogoIcon({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      {/* Hex field frame */}
      <path
        d="M20 3 L34 11 L34 29 L20 37 L6 29 L6 11 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity="0.25"
      />
      {/* Sprout / leaf */}
      <path
        d="M20 11 C15 14, 13 21, 20 29 C27 21, 25 14, 20 11 Z"
        fill="currentColor"
      />
      {/* Leaf vein */}
      <path
        d="M20 14 L20 27"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Side leaves */}
      <path
        d="M20 19 C17 18, 15 19, 14.5 21 C16 22, 18.5 21.5, 20 19 Z"
        fill="white"
        opacity="0.35"
      />
      <path
        d="M20 19 C23 18, 25 19, 25.5 21 C24 22, 21.5 21.5, 20 19 Z"
        fill="white"
        opacity="0.35"
      />
    </svg>
  );
}