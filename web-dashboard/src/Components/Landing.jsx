import { useState, useEffect } from 'react';
import { ArrowRight, Package, Activity, Shield, Zap, MapPin, BarChart3, Bell, Truck, Eye, Cloud, Wifi, Database, Cpu } from 'lucide-react';

export default function Landing({ onGetStarted }) {
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 overflow-hidden">
      {/* 🎭 Hero Section with Parallax */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-purple-900 to-pink-900">
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
              transform: `translateY(${scrollY * 0.5}px)`
            }}
          />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                right: `${Math.random() * 100}%`,
                bottom: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${8 + Math.random() * 6}s`,
                opacity: 0.25 + Math.random() * 0.3,
                transform: `scale(${0.5 + Math.random() * 1.5})`
              }}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <div className="animate-fade-in">
            <div className="inline-block mb-8 transform hover:scale-110 transition-transform duration-300">
              <div className="flex items-center gap-4 bg-white bg-opacity-10 backdrop-blur-2xl px-8 py-4 rounded-full border border-white border-opacity-20 shadow-2xl">
                <Package size={40} className="text-white animate-pulse" />
                <h1 className="text-4xl font-extrabold text-white tracking-wider">TRACEON</h1>
              </div>
            </div>

            <h2 className="text-7xl font-black mb-6 leading-tight animate-slide-up">
              <span className="text-white">Smart Logistics</span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 animate-gradient">
                Monitoring System
              </span>
            </h2>

            <p className="text-2xl text-white text-opacity-90 mb-12 max-w-3xl mx-auto animate-slide-up animation-delay-200 leading-relaxed">
              Real-time IoT parcel tracking powered by <span className="font-bold text-cyan-300">ESP32</span>, 
              <span className="font-bold text-green-300"> MPU6050</span>, and 
              <span className="font-bold text-orange-300"> DHT11</span> sensors
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up animation-delay-400">
              <button
                onClick={onGetStarted}
                className="group px-12 py-5 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-2xl font-bold text-xl hover:shadow-2xl transition-all hover:scale-110 flex items-center gap-3 border-2 border-white border-opacity-20"
              >
                Get Started
                <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </button>
              <a 
                href="#features"
                className="px-12 py-5 bg-white bg-opacity-10 backdrop-blur-lg text-white rounded-2xl font-bold text-xl hover:bg-opacity-20 transition-all border-2 border-white hover:scale-110"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Live Dashboard Preview */}
          <div 
            className="mt-20 animate-float"
            style={{ transform: `translateY(${scrollY * -0.2}px)` }}
          >
            <div className="bg-white bg-opacity-5 backdrop-blur-2xl rounded-3xl p-10 border border-white border-opacity-10 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: Package, label: 'Active Parcels', value: '1,234', color: 'from-blue-500 to-cyan-500', trend: '+12%' },
                  { icon: Activity, label: 'Devices Online', value: '89', color: 'from-green-500 to-emerald-500', trend: '+5%' },
                  { icon: Bell, label: 'Alerts Today', value: '12', color: 'from-orange-500 to-red-500', trend: '-8%' }
                ].map((stat, i) => (
                  <div 
                    key={i} 
                    className="group bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 text-center backdrop-blur-lg hover:scale-105 transition-all duration-300 border border-white/10 hover:border-white/30 cursor-pointer"
                  >
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg`}>
                      <stat.icon className="text-white" size={32} />
                    </div>
                    <p className="text-white text-opacity-70 text-sm mb-2 uppercase tracking-wide">{stat.label}</p>
                    <p className="text-white text-5xl font-black mb-2">{stat.value}</p>
                    <p className={`text-sm font-semibold ${stat.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.trend} this week
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-white rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* 🚀 Features Section with Interactive Cards */}
      <div id="features" className="relative bg-gray-900 py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h3 className="text-6xl font-black text-white mb-6 animate-fade-in">
              Complete Logistics Control
            </h3>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
              Track every parcel with <span className="text-primary-400 font-bold">enterprise-grade IoT monitoring</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Activity,
                title: 'Real-Time Monitoring',
                description: 'Live temperature, humidity, and motion tracking every 2 seconds',
                gradient: 'from-blue-500 via-cyan-500 to-teal-500',
                delay: 0
              },
              {
                icon: Shield,
                title: 'Smart Alerts',
                description: 'Instant notifications for threshold breaches and mishandling',
                gradient: 'from-red-500 via-pink-500 to-rose-500',
                delay: 100
              },
              {
                icon: MapPin,
                title: 'Journey Timeline',
                description: 'Complete delivery lifecycle from warehouse to customer',
                gradient: 'from-green-500 via-emerald-500 to-teal-500',
                delay: 200
              },
              {
                icon: BarChart3,
                title: 'Advanced Analytics',
                description: 'Beautiful charts and reports for data-driven decisions',
                gradient: 'from-purple-500 via-indigo-500 to-blue-500',
                delay: 300
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative animate-fade-in"
                style={{ animationDelay: `${feature.delay}ms` }}
                onMouseEnter={() => setActiveFeature(i)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 rounded-3xl blur-xl transition-opacity duration-500`} />
                <div className="relative bg-gray-800 rounded-3xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  <div className="relative">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                      <feature.icon size={36} className="text-white" />
                    </div>
                    <h4 className="text-2xl font-bold mb-4 text-white">{feature.title}</h4>
                    <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🎨 Tech Stack Showcase */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h3 className="text-6xl font-black text-white mb-6">
              Powered by Modern Tech
            </h3>
            <p className="text-2xl text-gray-400">
              Built with cutting-edge <span className="text-green-400 font-bold">IoT</span> and{' '}
              <span className="text-blue-400 font-bold">web technologies</span>
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { icon: Cpu, name: 'ESP32', desc: 'IoT Hardware', color: 'from-green-500 to-emerald-500' },
              { icon: Cloud, name: 'React', desc: 'Dashboard UI', color: 'from-blue-500 to-cyan-500' },
              { icon: Database, name: 'Firebase', desc: 'Real-time DB', color: 'from-orange-500 to-yellow-500' },
              { icon: Wifi, name: 'MPU6050', desc: 'Motion Sensor', color: 'from-purple-500 to-pink-500' }
            ].map((tech, i) => (
              <div
                key={i}
                className="group relative bg-gray-800 rounded-3xl p-8 text-center hover:bg-gray-750 transition-all duration-300 border border-gray-700 hover:border-gray-600 hover:scale-110 cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${tech.color} opacity-0 group-hover:opacity-20 rounded-3xl blur-xl transition-opacity duration-500`} />
                <div className="relative">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${tech.color} flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg`}>
                    <tech.icon className="text-white" size={32} />
                  </div>
                  <p className="text-white text-2xl font-black mb-2">{tech.name}</p>
                  <p className="text-gray-400 text-sm uppercase tracking-wide">{tech.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🎯 CTA Section */}
      <div className="relative bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 py-32">
        <div className="absolute inset-0 bg-black opacity-20" />
        <div className="relative container mx-auto px-4 text-center">
          <h3 className="text-6xl font-black text-white mb-6 animate-pulse">
            Ready to Transform Your Logistics?
          </h3>
          <p className="text-2xl text-white text-opacity-90 mb-12 max-w-3xl mx-auto">
            Join <span className="font-bold text-yellow-300">hundreds</span> of businesses using TRACEON for{' '}
            <span className="font-bold text-cyan-300">smarter deliveries</span>
          </p>
          <button
            onClick={onGetStarted}
            className="inline-block px-16 py-6 bg-white text-primary-600 rounded-2xl font-black text-2xl hover:bg-opacity-90 transition-all hover:scale-110 shadow-2xl"
          >
            Start Tracking Now →
          </button>
        </div>
      </div>

      {/* 📊 Footer */}
      <div className="bg-gray-950 py-12 text-center border-t border-gray-800">
        <p className="text-gray-500 text-lg">
          © 2025 <span className="text-primary-400 font-bold">TRACEON</span> - Smart Logistics Monitoring System
        </p>
        <p className="text-gray-600 text-sm mt-2">
          Powered by ESP32 • React • Firebase • MPU6050 • DHT11
        </p>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(50px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out both;
        }
        .animate-slide-up {
          animation: slide-up 1s ease-out both;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
}


