import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PageLayout = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#FDFCFA] text-[#1C1917] p-8 md:p-16">
        <div className="max-w-3xl mx-auto">
            <Link to="/" className="inline-flex items-center text-[#78716C] hover:text-[#5046E5] mb-8 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-[#1C1917]">{title}</h1>
            <div className="prose prose-stone max-w-none text-[#78716C]">
                {children}
            </div>
        </div>
    </div>
);

// --- Product Section ---
export const ProductPage = () => (
    <PageLayout title="Product">
        <p className="text-lg mb-4">The unified operations platform for service-based businesses.</p>
        <p>Reduce chaos. Increase visibility. Automate everything. CareOps brings all your critical business functions into one seamless interface.</p>
    </PageLayout>
);

export const FeaturesPage = () => (
    <PageLayout title="Features">
        <ul className="list-disc pl-5 space-y-2">
            <li><strong>Smart Scheduling:</strong> AI-powered dispatch and calendar management.</li>
            <li><strong>Customer CRM:</strong> 360-degree view of every client interaction.</li>
            <li><strong>Automated Invoicing:</strong> Get paid faster with integrated payments.</li>
            <li><strong>Real-time Analytics:</strong> Business intelligence at your fingertips.</li>
        </ul>
    </PageLayout>
);

export const PricingPage = () => (
    <PageLayout title="Pricing">
        <div className="grid md:grid-cols-2 gap-8 my-8">
            <div className="p-6 border border-[#E7E5E4] rounded-xl bg-white">
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <p className="text-3xl font-bold mb-4">$29<span className="text-sm font-normal text-[#78716C]">/mo</span></p>
                <p className="mb-4">Perfect for small teams starting out.</p>
                <Button className="w-full bg-[#5046E5] hover:bg-[#3F37C9]">Get Started</Button>
            </div>
            <div className="p-6 border border-[#5046E5] rounded-xl bg-[#F5F4F0]">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <p className="text-3xl font-bold mb-4">$79<span className="text-sm font-normal text-[#78716C]">/mo</span></p>
                <p className="mb-4">For growing businesses needing automation.</p>
                <Button className="w-full bg-[#5046E5] hover:bg-[#3F37C9]">Get Started</Button>
            </div>
        </div>
    </PageLayout>
);

export const IntegrationsPage = () => (
    <PageLayout title="Integrations">
        <p>Connect CareOps with the tools you already use.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {['Stripe', 'Quickbooks', 'Gmail', 'Slack', 'Zapier', 'Twilio', 'Google Calendar', 'Zoom'].map(tool => (
                <div key={tool} className="p-4 border border-[#E7E5E4] rounded-lg text-center font-medium bg-white">
                    {tool}
                </div>
            ))}
        </div>
    </PageLayout>
);

export const ChangelogPage = () => (
    <PageLayout title="Changelog">
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-bold">v2.1.0 - Feb 2026</h3>
                <p>Added AI-powered route optimization for field technicians.</p>
            </div>
            <div>
                <h3 className="text-lg font-bold">v2.0.5 - Jan 2026</h3>
                <p>Improved mobile dashboard performance and updated color scheme.</p>
            </div>
        </div>
    </PageLayout>
);

export const RoadmapPage = () => (
    <PageLayout title="Roadmap">
        <div className="space-y-4">
            <div className="p-4 border-l-4 border-[#5046E5] bg-[#F5F4F0]">
                <h3 className="font-bold">Q2 2026</h3>
                <p>Advanced Inventory Management & Barcode Scanning.</p>
            </div>
            <div className="p-4 border-l-4 border-[#E7E5E4] bg-white">
                <h3 className="font-bold">Q3 2026</h3>
                <p>Customer Portal & Mobile App for Clients.</p>
            </div>
        </div>
    </PageLayout>
);

// --- Resources Section ---
export const ResourcesPage = () => (<PageLayout title="Resources"><p>Guides, tutorials, and whitepapers to help you grow your business.</p></PageLayout>);
export const DocumentationPage = () => (<PageLayout title="Documentation"><p>Technical documentation for setting up and customizing CareOps.</p></PageLayout>);
export const APIReferencePage = () => (<PageLayout title="API Reference"><p>Full API documentation for developers building on top of CareOps.</p></PageLayout>);
export const BlogPage = () => (<PageLayout title="Blog"><p>Latest industry news, tips, and CareOps updates.</p></PageLayout>);
export const CommunityPage = () => (<PageLayout title="Community"><p>Join thousands of service business owners sharing advice.</p></PageLayout>);
export const SupportPage = () => (<PageLayout title="Support"><p>Need help? Contact our support team 24/7.</p></PageLayout>);

// --- Company Section ---
export const CompanyPage = () => (<PageLayout title="Company"><p>Learn more about our mission to streamline service businesses.</p></PageLayout>);
export const AboutPage = () => (<PageLayout title="About Us"><p>CareOps was founded in 2024 with a simple goal: make service operations effortless.</p></PageLayout>);
export const CareersPage = () => (<PageLayout title="Careers"><p>We're hiring! Join us in building the future of service operations.</p></PageLayout>);
export const ContactPage = () => (
    <PageLayout title="Contact Us">
        <p className="mb-4">We'd love to hear from you.</p>
        <p>Email: <strong>hello@careops.com</strong></p>
        <p>Phone: <strong>+1 (555) 123-4567</strong></p>
        <p>Address: <strong>123 Innovation Dr, Tech City, TC 90210</strong></p>
    </PageLayout>
);

// --- Legal Section ---
export const PrivacyPolicyPage = () => (
    <PageLayout title="Privacy Policy">
        <p className="mb-4">Last updated: February 2026</p>
        <p>Your privacy is important to us. This policy outlines how we collect, use, and protect your data.</p>
        <p>...</p>
    </PageLayout>
);

export const TermsOfServicePage = () => (
    <PageLayout title="Terms of Service">
        <p className="mb-4">By using CareOps, you agree to these terms.</p>
        <p>1. Acceptance of Terms...</p>
        <p>2. User Accounts...</p>
    </PageLayout>
);

export const CookiesPage = () => (
    <PageLayout title="Cookie Policy">
        <p>We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.</p>
    </PageLayout>
);
