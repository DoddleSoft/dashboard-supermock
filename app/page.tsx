"use client";

import { Loader } from "@/components/ui/Loader";

export default function Home() {
  return (
    <Loader
      subtitle="Please wait while we load your data..."
      redirectTo="/auth/login"
      redirectDelay={1000}
    />
  );
}
