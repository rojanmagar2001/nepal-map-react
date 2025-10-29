"use client";

import dynamic from "next/dynamic";

const NepalMap = dynamic(() => import("@/components/nepal-map"), {
  ssr: false,
});

export default function Home() {
  return <NepalMap />;
}
