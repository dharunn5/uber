import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Clock, Shield, Star } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Go anywhere with UberClone
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Request a ride, hop in, and go. Or become a driver and earn money on your schedule.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/signup?type=rider"
                  className="bg-white text-black px-8 py-4 rounded-md font-semibold hover:bg-gray-100 transition-colors duration-200 text-center"
                >
                  Get started
                </Link>
                <Link
                  to="/signup?type=driver"
                  className="border border-white text-white px-8 py-4 rounded-md font-semibold hover:bg-white hover:text-black transition-colors duration-200 text-center"
                >
                  Drive & earn
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Car in city"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why choose UberClone?
            </h2>
            <p className="text-xl text-gray-600">
              The features that make your journey better
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy booking</h3>
              <p className="text-gray-600">
                Book a ride in just a few taps with our intuitive app
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick arrival</h3>
              <p className="text-gray-600">
                Get matched with nearby drivers for fast pickup times
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Safe & secure</h3>
              <p className="text-gray-600">
                All drivers are background-checked for your safety
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Top rated</h3>
              <p className="text-gray-600">
                Highly rated drivers and excellent customer service
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join millions of riders and drivers worldwide
          </p>
          <Link
            to="/signup"
            className="bg-white text-black px-8 py-4 rounded-md font-semibold hover:bg-gray-100 transition-colors duration-200 inline-flex items-center space-x-2"
          >
            <span>Sign up now</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;