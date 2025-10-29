import React from "react";

function BasicLayout({ children }: { children: React.ReactElement }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src="/bg.png" alt="auth-background" className="h-full w-full object-cover object-top" />
        <div className="absolute inset-0 bg-black opacity-50" />
      </div>
      {children}
    </div>
  );
}

export default BasicLayout;
