import React from "react";
import { LazyMotion, domAnimation, m } from "motion/react";

const Pin = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M16 3a1 1 0 0 1 .117 1.993l-.117 .007v4.764l1.894 3.789a1 1 0 0 1 .1 .331l.006 .116v2a1 1 0 0 1 -.883 .993l-.117 .007h-4v4a1 1 0 0 1 -1.993 .117l-.007 -.117v-4h-4a1 1 0 0 1 -.993 -.883l-.007 -.117v-2a1 1 0 0 1 .06 -.34l.046 -.107l1.894 -3.791v-4.762a1 1 0 0 1 -.117 -1.993l.117 -.007h8z" />
  </svg>
);

const Card = ({
  number,
  title,
  description,
  colorTheme = "blue",
  className,
  rotate,
  colors: customColors,
}) => {
  const defaultBgColors = {
    orange: "bg-orange-50 dark:bg-orange-500/10",
    blue: "bg-blue-50 dark:bg-blue-500/10",
    purple: "bg-purple-50 dark:bg-purple-500/10",
  };
  const defaultTextColors = {
    orange: "text-orange-500 dark:text-orange-400",
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
  };
  const defaultBorderColors = {
    orange: "border-orange-100 dark:border-orange-500/20",
    blue: "border-blue-100 dark:border-blue-500/20",
    purple: "border-purple-100 dark:border-purple-500/20",
  };

  const bgColor = customColors?.bg || defaultBgColors[colorTheme];
  const textColor = customColors?.text || defaultTextColors[colorTheme];
  const borderColor = customColors?.border || defaultBorderColors[colorTheme];

  return (
    <div
      className={`relative w-full transition-transform duration-300 hover:z-30 hover:scale-105 ${rotate || ''} ${className || ''}`}
    >
      <div className="bg-white dark:bg-neutral-900 p-1.5 rounded-2xl shadow-xl shadow-brand-navy/5 dark:shadow-none border border-neutral-100 dark:border-neutral-800 h-full">
        <div
          className={`${bgColor} border ${borderColor} rounded-xl p-4 h-full flex flex-col relative overflow-hidden`}
        >
          <div className="flex justify-between items-start mb-3">
            <span
              className={`${textColor} text-2xl font-serif font-bold italic`}
            >
              {number}
            </span>
            <Pin className={`w-5 h-5 ${textColor} opacity-50`} />
          </div>
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 leading-tight mb-2">
            {title}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_CARD_POSITIONS = [
  { className: "mt-4", rotate: "rotate-2" },
  { className: "", rotate: "-rotate-2" },
  { className: "", rotate: "-rotate-1" },
  { className: "mt-4", rotate: "rotate-3" },
];

export default function HowItWorks({
  features,
  className,
  stepPositions,
}) {
  const defaultFeatures = [
    {
      title: "Create Account",
      description: "Sign up in minutes. Enter your details and verify your email to get started.",
      colorTheme: "blue",
    }
  ];

  const data = features && features.length > 0 ? features : defaultFeatures;
  const positions = stepPositions || DEFAULT_CARD_POSITIONS;

  let height = 1130;
  if (data.length === 1) height = 400;
  else if (data.length === 2) height = 450;
  else if (data.length === 3) height = 800;
  else if (data.length === 4) height = 900;
  else height = 1130;

  return (
    <LazyMotion features={domAnimation}>
      <div
        className={`bg-white dark:bg-black relative overflow-hidden ${className || ""}`}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.1]"
          style={{
            backgroundImage: "linear-gradient(#000 1px, transparent 1px)",
            backgroundSize: "100% 32px",
            marginTop: "4px",
          }}
        ></div>
        
        <div className="mx-auto relative z-10 p-6">
          <div className="text-center mb-8 relative z-20">
            <h2 className="text-2xl font-serif text-brand-navy mb-2">Cara Penggunaan</h2>
            <p className="text-sm text-brand-ocean">4 Langkah Mudah</p>
          </div>

          <div className="relative w-full">
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none hidden sm:block z-0"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
            >
              <m.path
                d="M 250 250 Q 500 50 750 250 Q 500 500 250 750 Q 500 950 750 750"
                stroke="currentColor"
                className="text-brand-ocean/40"
                strokeWidth="3"
                strokeDasharray="12 8"
                fill="none"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ strokeDashoffset: 0 }}
                animate={{
                  strokeDashoffset: -200, 
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </svg>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative w-full z-10">
              {data.map((step, index) => {
                const position = positions[index % positions.length];

                return (
                  <Card
                    key={step.title}
                    number={`0${index + 1}`}
                    title={step.title}
                    description={step.description}
                    colorTheme={step.colorTheme || "blue"}
                    colors={step.colors}
                    rotate={position.rotate}
                    className={position.className}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
