import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-brand-gold mb-4">404</h1>
          <h2 className="text-3xl font-bold text-brand-dark mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Oops! The page you're looking for doesn't exist. It might have been
            moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        <div className="space-y-4">
          <Link to="/">
            <Button className="bg-brand-gold hover:bg-brand-gold-dark text-brand-dark font-semibold w-full">
              <Home className="mr-2 h-4 w-4" />
              Go Back Home
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>

        <div className="mt-8">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <a href="#contact" className="text-brand-gold hover:underline">
              Contact us
            </a>{" "}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
