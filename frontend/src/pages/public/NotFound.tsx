import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#FDFCFA] text-[#1C1917]">
            <h1 className="text-9xl font-bold mb-4 tracking-tighter text-[#1C1917]">404</h1>
            <h2 className="text-2xl font-semibold mb-6 text-[#1C1917]">Page Not Found</h2>
            <p className="text-[#78716C] mb-8 text-center max-w-md">
                The page you are looking for doesn't exist or has been moved.
                It might be a broken link or a typo.
            </p>

            <div className="flex gap-4">
                <Button asChild className="bg-[#5046E5] hover:bg-[#3F37C9] text-white">
                    <Link to="/">Go Home</Link>
                </Button>
                <Button variant="outline" asChild className="border-[#E7E5E4] text-[#1C1917] hover:bg-[#F5F4F0]">
                    <Link to="/contact">Contact Support</Link>
                </Button>
            </div>
        </div>
    );
}
