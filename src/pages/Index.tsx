
import { FeatureCard } from "@/components/feature-card";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { Navbar } from "@/components/navbar";
import { Heading } from "@/components/ui/heading";
import { FileText, WrenchIcon, CreditCard, Building2 } from "lucide-react";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <HeroSection />
      
      <main className="flex-grow">
        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Heading as="h2">Everything You Need in One Place</Heading>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Our portal provides all the tools you need to manage your commercial property experience efficiently.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                title="Work Orders"
                description="Submit and track maintenance requests for your space with real-time updates."
                icon={WrenchIcon}
              />
              <FeatureCard
                title="Document Repository"
                description="Access all your important documents like leases, addenda, and building policies."
                icon={FileText}
              />
              <FeatureCard
                title="Payment Portal"
                description="Pay your rent securely online and view your payment history."
                icon={CreditCard}
              />
            </div>
          </div>
        </section>
        
        {/* About Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <div className="bg-navy-100 p-8 rounded-lg shadow-lg">
                  <Building2 className="h-16 w-16 text-navy-600 mb-4" />
                  <Heading as="h2" className="mb-4">About Our Building</Heading>
                  <p className="text-gray-600 mb-6">
                    Our commercial property is designed to provide a comfortable, modern environment for your business to thrive. 
                    With state-of-the-art facilities and responsive management, we aim to create the perfect space for your success.
                  </p>
                  <p className="text-gray-600">
                    Our management team is dedicated to ensuring that your experience here is seamless and productive. 
                    From timely maintenance to clear communication, we're here to support your business needs.
                  </p>
                </div>
              </div>
              <div className="md:w-1/2 mt-8 md:mt-0">
                <Heading as="h3" className="mb-6">Why Choose Our Portal</Heading>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 bg-navy-100 rounded-full p-1">
                      <WrenchIcon className="h-5 w-5 text-navy-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-lg font-semibold">Fast Maintenance Response</h4>
                      <p className="text-gray-600">Submit work orders 24/7 and get quick responses from our maintenance team.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 bg-navy-100 rounded-full p-1">
                      <FileText className="h-5 w-5 text-navy-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-lg font-semibold">Secure Document Storage</h4>
                      <p className="text-gray-600">All your important documents are stored securely and accessible whenever you need them.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 bg-navy-100 rounded-full p-1">
                      <CreditCard className="h-5 w-5 text-navy-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-lg font-semibold">Easy Payment Processing</h4>
                      <p className="text-gray-600">Pay rent and other fees securely online without the hassle of checks or money orders.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
