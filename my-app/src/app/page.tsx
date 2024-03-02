"use client";

import styles from "./page.module.css";
import React from "react";
import { Web3ContextProvider } from "@/hooks/Web3Context";
import { Issue } from "@/pages/Issue";

export default function Home() {
  return (
    <Web3ContextProvider>
      <main className={styles.main}>
        <Issue />
      </main>
    </Web3ContextProvider>

  );
}
