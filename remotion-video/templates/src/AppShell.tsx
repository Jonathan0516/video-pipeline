import React from "react";

// Provider harness for component mode (B): imported project components often
// assume app-level context (router, i18n, data cache, global store). Wrap them
// here so they render deterministically inside Remotion without a live backend.
//
// This is a TEMPLATE. Uncomment/adapt the providers your target project needs.
// Keep everything deterministic: seed data statically, no network, no timers.
//
//   import { MemoryRouter } from "react-router-dom";
//   import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
//   import { I18nextProvider } from "react-i18next";
//   import i18n from "<project>/src/i18n";
//
// const queryClient = new QueryClient({
//   defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
// });
// // Pre-seed any cache entries the component reads:
// // queryClient.setQueryData(["me"], fixtures.me);

export const AppShell: React.FC<{ route?: string; children: React.ReactNode }> = ({
  children,
}) => {
  // return (
  //   <QueryClientProvider client={queryClient}>
  //     <I18nextProvider i18n={i18n}>
  //       <MemoryRouter initialEntries={[route ?? "/"]}>{children}</MemoryRouter>
  //     </I18nextProvider>
  //   </QueryClientProvider>
  // );
  return <>{children}</>;
};
