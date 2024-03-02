"use client";

import styles from "./page.module.css";
import React, { useEffect, useState } from "react";
import { Web3ContextProvider } from "../hooks/Web3Context";
import { Header } from "./Header";
import Root from "@/pages/Root";
import Content from "@/pages/Content";

export default function Home() {
  const [param, setParam] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    const cid = url.searchParams.get("cid");
    if (cid) {
      setParam(cid);
    }
  }, []);

  return (
    <Web3ContextProvider>
      <main className={styles.main}>
        <Header />
        <>___________</>
        {param ? <Content cid={param} /> : <Root />}
      </main>
    </Web3ContextProvider>
  );
}
