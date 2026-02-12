
import { Outlet } from "react-router-dom";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";

export default function WorkspaceLayout() {
    return (
        <div className="flex min-h-screen bg-background flex-col">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-auto bg-background">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
