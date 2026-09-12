import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AnimatedRoutes } from '@/components/AnimatedRoutes'
import { PageTransition } from '@/components/PageTransition'
import { AppLayout } from '@/components/AppLayout'
import Dashboard from './pages/Dashboard'
import InternshipTracker from './pages/InternshipTracker'
import CapabilityLab from './pages/CapabilityLab'
import ResumeCoach from './pages/ResumeCoach'
import Assistant from './pages/Assistant'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: { retry: 1 },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AppLayout>
            <AnimatedRoutes>
              <Route
                path="/"
                element={
                  <PageTransition transition="slide-up">
                    <Dashboard />
                  </PageTransition>
                }
              />
              <Route
                path="/internships"
                element={
                  <PageTransition transition="slide-up">
                    <InternshipTracker />
                  </PageTransition>
                }
              />
              <Route
                path="/capability"
                element={
                  <PageTransition transition="slide-up">
                    <CapabilityLab />
                  </PageTransition>
                }
              />
              <Route
                path="/resume"
                element={
                  <PageTransition transition="slide-up">
                    <ResumeCoach />
                  </PageTransition>
                }
              />
              <Route
                path="/assistant"
                element={
                  <PageTransition transition="slide-up">
                    <Assistant />
                  </PageTransition>
                }
              />
              <Route
                path="/settings"
                element={
                  <PageTransition transition="slide-up">
                    <Settings />
                  </PageTransition>
                }
              />
              <Route
                path="*"
                element={
                  <PageTransition transition="fade">
                    <NotFound />
                  </PageTransition>
                }
              />
            </AnimatedRoutes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
