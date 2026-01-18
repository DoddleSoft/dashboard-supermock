"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader } from "@/components/ui/Loader";

export default function Home() {
  const router = useRouter();
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        router.push("/auth/login");
      }, 1000); // 1 second

      return () => clearTimeout(timer);
    }
  }, [loading, router]);

  return <Loader />;
}
