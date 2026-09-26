import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "@/pages/Index";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Code splitting: Home ships in the main bundle since it's where almost
// every visit lands and first paint there matters most. Every other route
// loads on demand — this keeps the initial JS payload small, which is the
// single biggest lever for mobile performance/Core Web Vitals on a
// JS-rendered site like this one.
const Quote = lazy(() => import("@/pages/Quote"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Technology = lazy(() => import("@/pages/Technology"));
const Portfolio = lazy(() => import("@/pages/Portfolio"));
const Testimonials = lazy(() => import("@/pages/Testimonials"));
const Admin = lazy(() => import("@/pages/Admin"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));

// The admin dashboard is an internal tool, not a customer-facing page — it
// intentionally does not get the public site's Header/Footer (with its
// customer nav links) around it, and it isn't linked from anywhere public.
function SiteChrome({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  if (isAdmin) return <>{children}</>;
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

// A near-invisible fallback rather than a spinner: route chunks are small
// and load fast on a real connection, so a visible loading state would
// mostly just flash. Keeps the page from looking "broken" for the rare
// slow-connection case without adding a jarring flicker on fast ones.
function RouteFallback() {
  return <div className="min-h-[40vh]" aria-hidden="true" />;
}

function App() {
  return (
    <BrowserRouter
     future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
      >
      <SiteChrome>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/quote" element={<Quote />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/technology" element={<Technology />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </SiteChrome>
    </BrowserRouter>
  );
}

export default App;
