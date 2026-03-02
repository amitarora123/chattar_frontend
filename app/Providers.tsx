'use client';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const Providers = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <TooltipProvider>
          {children}
          {/* {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools
              position="top"
              buttonPosition="bottom-left"
              initialIsOpen={false}
            />
          )} */}
        </TooltipProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
};

export default Providers;
