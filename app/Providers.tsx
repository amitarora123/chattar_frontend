"use client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const Providers = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5,
      },
    },
  });

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GoogleOAuthProvider clientId={googleClientId}>
          {children}
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools position="top" buttonPosition="top-right" initialIsOpen={false} />
          )}
        </GoogleOAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default Providers;
