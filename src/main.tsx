import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import "../styles/globals.css";
import { Routes } from "./Routes";

const queryClient = new QueryClient();

async function bootstrap() {
  if (import.meta.env.DEV) {
    const { startMocks } = await import("./mocks");
    await startMocks();
  }

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <Routes />
        <Toaster />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

bootstrap();
