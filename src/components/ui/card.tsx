import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean;
  rivets?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hoverLift = false,
  rivets = false,
  ...props
}) => {
  return (
    <div
      className={`skeuo-card rounded-2xl p-6 ${
        hoverLift ? "skeuo-card-hover cursor-pointer" : ""
      } ${className}`}
      {...props}
    >
      {rivets && (
        <>
          <span className="skeuo-rivet absolute top-3 left-3 pointer-events-none" />
          <span className="skeuo-rivet absolute top-3 right-3 pointer-events-none" />
          <span className="skeuo-rivet absolute bottom-3 left-3 pointer-events-none" />
          <span className="skeuo-rivet absolute bottom-3 right-3 pointer-events-none" />
        </>
      )}
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <h3 className={`text-xl font-black text-slate-800 tracking-tight skeuo-embossed-text ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <p className={`text-sm text-slate-600 mt-1 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`space-y-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`mt-6 pt-4 border-t border-slate-200/90 flex justify-end gap-3 ${className}`} {...props}>
    {children}
  </div>
);

