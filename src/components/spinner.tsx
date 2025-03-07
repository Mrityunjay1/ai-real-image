import React, { ComponentPropsWithoutRef } from "react";

const Spinner = ({ className, ...rest }: ComponentPropsWithoutRef<"span">) => {
  return (
    <span className={`relative block opacity-[.65] ${className}`} {...rest}>
      {Array.from(Array(8).keys()).map((_, i) => (
        <span
          key={i}
          className="absolute top-0 left-0 w-1 h-1 bg-gray-300 rounded-full "
          style={{
            transform: `rotate(${i * 45}deg)`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: "1s",
            animationIterationCount: "infinite",
            animationName: "spin",
            animationTimingFunction: "linear",
          }}
        ></span>
      ))}
    </span>
  );
};

export default Spinner;
