'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { 
  PhoneCall, 
  Car, 
  Home, 
  Building2, 
  Key, 
  Shield, 
  Clock, 
  MapPin, 
  Star, 
  ChevronRight, 
  MessageCircle,
  CheckCircle2
} from 'lucide-react';

const HomePage = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Homeowner",
      text: "Called Locksmith4U after getting locked out of my house late at night. They arrived within 30 minutes and had me back inside quickly. Professional, friendly, and reasonably priced!",
      stars: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Business Owner",
      text: "We've used Locksmith4U for all our commercial locksmith needs. They installed a new access control system for our office building, and the quality of work was exceptional.",
      stars: 5
    },
    {
      name: "Jennifer Lee",
      role: "Apartment Tenant",
      text: "Needed to replace several locks after moving into a new apartment. Locksmith4U provided excellent service at a fair price and finished the job faster than expected.",
      stars: 4
    }
  ];

  const services = [
    {
      title: "Residential Locksmith",
      description: "Home lockouts, rekeying, lock installation & repair, security upgrades",
      icon: <Home className="h-10 w-10 text-primary" />,
      link: "/services/residential"
    },
    {
      title: "Automotive Locksmith",
      description: "Car lockouts, key duplication, transponder keys, ignition repair",
      icon: <Car className="h-10 w-10 text-primary" />,
      link: "/services/automotive"
    },
    {
      title: "Commercial Locksmith",
      description: "Business security, master key systems, access control, panic bars",
      icon: <Building2 className="h-10 w-10 text-primary" />,
      link: "/services/commercial"
    },
    {
      title: "Emergency Services",
      description: "24/7 emergency lockouts, broken key extraction, lock repairs",
      icon: <Shield className="h-10 w-10 text-primary" />,
      link: "/services/emergency"
    },
    {
      title: "Key Duplication",
      description: "All types of keys duplicated, including specialty and high-security keys",
      icon: <Key className="h-10 w-10 text-primary" />,
      link: "/services/key-duplication"
    },
    {
      title: "Security Upgrades",
      description: "Modern lock installations, security consultations, smart locks",
      icon: <Shield className="h-10 w-10 text-primary" />,
      link: "/services/security-upgrades"
    }
  ];

  const faqs = [
    {
      question: "How quickly can you respond to emergency lockouts?",
      answer: "Our average response time for emergency lockouts in the Las Vegas area is 20-30 minutes. We operate 24/7 for emergency services to ensure you're never left stranded."
    },
    {
      question: "Do you service all of Las Vegas?",
      answer: "Yes, we provide locksmith services throughout the entire Las Vegas metropolitan area, including Henderson, North Las Vegas, Summerlin, and surrounding communities."
    },
    {
      question: "How much does it cost to rekey a house?",
      answer: "The cost to rekey a house depends on the number of locks. Our basic rekeying service starts at $19 per lock, with discounts available for multiple locks."
    },
    {
      question: "Can you make keys for any car?",
      answer: "Yes, we can create and program keys for virtually all vehicle makes and models, including transponder keys, proximity/smart keys, and traditional keys."
    },
    {
      question: "Do you offer free estimates?",
      answer: "Yes, we provide free estimates for all locksmith services. For more complex jobs, we may need to inspect the location first to give you an accurate quote."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <Image 
            src="/hero-background.jpg" 
            alt="Locksmith background" 
            fill 
            style={{ objectFit: 'cover' }} 
            priority
          />
        </div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Las Vegas&apos;s Trusted Locksmith Service
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Professional locksmith services for residential, commercial, and automotive needs. 
              Available 24/7 for emergencies across Las Vegas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                <PhoneCall className="mr-2 h-5 w-5" /> 
                Call Now: (702) 555-1234
              </Button>
              <Button size="lg" variant="outline" className="bg-blue-800/50 text-white border-white hover:bg-blue-800">
                Our Services <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center mt-8 text-blue-100">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="ml-2 font-medium">500+ 5-star reviews across Google and Yelp</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
              <Clock className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">24/7 Emergency Service</h3>
              <p className="text-gray-700">
                Locked out? Need urgent help? Were available 24/7 for all your emergency locksmith needs in Las Vegas.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
              <Shield className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Licensed & Insured</h3>
              <p className="text-gray-700">
                Rest easy knowing all our technicians are fully licensed, bonded, and insured for your protection.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
              <MapPin className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Fast Response Time</h3>
              <p className="text-gray-700">
                Our average response time is under 30 minutes throughout the Las Vegas area. Help is always nearby.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white" id="services">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Locksmith Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From emergency lockouts to high-security installations, we provide comprehensive locksmith services for homes, businesses, and vehicles.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Link href={service.link} key={index}>
                <Card className="h-full hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="mb-4">{service.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <div className="text-blue-600 font-medium flex items-center">
                      Learn more <ChevronRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Call-to-action Section */}
      <section className="py-16 bg-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Locked Out? Need a Locksmith?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            We&apos;re just a phone call away. Our professional locksmiths are ready to help you 24/7 throughout Las Vegas.
          </p>
          <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8">
            <PhoneCall className="mr-2 h-5 w-5" /> 
            Call (702) 555-1234
          </Button>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don&apos;t just take our word for it. Here&apos;s what our satisfied customers have to say about our locksmith services.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
            <div className="mb-6">
              <div className="flex mb-2">
                {[...Array(testimonials[activeTestimonial].stars)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-lg italic mb-6">&quot;{testimonials[activeTestimonial].text}&quot;</p>
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {testimonials[activeTestimonial].name.charAt(0)}
                </div>
                <div className="ml-4">
                  <p className="font-semibold">{testimonials[activeTestimonial].name}</p>
                  <p className="text-gray-600">{testimonials[activeTestimonial].role}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button 
                  key={index}
                  className={`h-3 w-3 rounded-full ${index === activeTestimonial ? 'bg-blue-600' : 'bg-gray-300'}`}
                  onClick={() => setActiveTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose Locksmith4U?</h2>
              <p className="text-xl text-gray-600 mb-8">
                We&apos;ve been serving the Las Vegas community for over 10 years with reliable, professional, and affordable locksmith services.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">Fast Response Time</h3>
                    <p className="text-gray-600">Our technicians arrive within 30 minutes for emergency calls in the Las Vegas area.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">Fair & Transparent Pricing</h3>
                    <p className="text-gray-600">No hidden fees or surprise charges. We provide upfront pricing before any work begins.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">Experienced Technicians</h3>
                    <p className="text-gray-600">Our locksmiths are highly trained professionals with years of experience in the field.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">Satisfaction Guaranteed</h3>
                    <p className="text-gray-600">We stand behind our work with a 100% satisfaction guarantee on all services.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 relative">
              <div className="relative h-[400px] w-full rounded-lg overflow-hidden shadow-xl">
                <Image 
                  src="/locksmith-working.jpg" 
                  alt="Professional locksmith working" 
                  fill 
                  style={{ objectFit: 'cover' }} 
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-blue-700 text-white p-6 rounded-lg shadow-lg max-w-xs">
                <p className="text-lg font-semibold">Licensed, Bonded & Insured</p>
                <p className="text-sm">NVLOCKSMITH License #12345</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Areas We Serve</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our mobile locksmith services are available throughout the Las Vegas metropolitan area including:
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center max-w-4xl mx-auto">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="font-medium">Las Vegas Strip</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="font-medium">Downtown Las Vegas</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="font-medium">Henderson</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="font-medium">North Las Vegas</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="font-medium">Summerlin</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="font-medium">Spring Valley</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="font-medium">Paradise</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="font-medium">Enterprise</p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Not sure if we serve your area? Give us a call and we&apos;ll let you know!
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white" id="faq">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions about our locksmith services? Find answers to our most commonly asked questions below.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6">
                <h3 className="text-xl font-semibold mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 mb-4">
              Still have questions? We&apos;re here to help!
            </p>
            <Button className="bg-blue-700 hover:bg-blue-800">
              <MessageCircle className="mr-2 h-5 w-5" /> Contact Us
            </Button>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Secure Your Property?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Contact us today for a free consultation or emergency locksmith service. We&apos;re available 24/7 to assist you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
              <PhoneCall className="mr-2 h-5 w-5" /> 
              Call (702) 555-1234
            </Button>
            <Button size="lg" variant="outline" className="bg-blue-800/50 text-white border-white hover:bg-blue-800">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;