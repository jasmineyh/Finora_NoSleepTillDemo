import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl gradient-purple-pink flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
          <span className="text-3xl font-bold text-white">404</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">Page Not Found</h1>
        <p className="text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button className="rounded-xl gradient-purple-pink text-white border-0 mt-2">
            <Home className="w-4 h-4 mr-2" /> Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}