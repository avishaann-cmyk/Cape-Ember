import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Leaf, MapPin, Heart } from 'lucide-react';
import { setPageSEO } from '../lib/seo';

const AboutPage = () => {
  React.useEffect(() => {
    setPageSEO({
      title: 'About Cape Ember Coffee Co. | South African Landscapes in Every Cup',
      description: 'Discover the Cape Ember story: premium coffee inspired by South African landscapes and crafted with trusted roasting partners.',
      canonicalPath: '/about',
      image: 'https://customer-assets.emergentagent.com/job_axis-creator/artifacts/11b4v0fr_IMG_6815.jpeg'
    });
  }, []);

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('https://customer-assets.emergentagent.com/job_axis-creator/artifacts/11b4v0fr_IMG_6815.jpeg')`
          }}
        />
        <div className="absolute inset-0 hero-overlay" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="overline text-[#A94826] mb-4 block">Our Story</span>
          <h1 className="font-heading text-5xl md:text-6xl text-white mb-6">
            From Landscape to Cup
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            We collaborate with experienced South African roasting partners to create exceptional coffees inspired by South Africa's most beautiful landscapes.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-4xl text-[#2D2622] mb-6">
                A Journey Through South Africa
              </h2>
              <p className="text-[#5C534C] text-lg mb-4">
                Every Cape Ember blend tells a story of a place. From the delicate fynbos 
                of the Cape Peninsula to the vast, open horizons of the Karoo, we've 
                translated the essence of South Africa's most beautiful landscapes into 
                coffee experiences.
              </p>
              <p className="text-[#5C534C] text-lg mb-4">
                Cape Ember Coffee Co. works with carefully selected South African roasting partners 
                who share our unwavering commitment to quality. Together, we create small-batch coffees 
                that authentically capture the character and spirit of each landscape they represent.
              </p>
              <p className="text-[#5C534C] text-lg">
                Our mission is simple: to bring the beauty of South Africa into your 
                daily coffee ritual, one cup at a time.
              </p>
            </div>
            <div className="aspect-square overflow-hidden">
              <img
                src="https://customer-assets.emergentagent.com/job_axis-creator/artifacts/iu170te7_8FCEC634-E08A-49A5-B9F5-A1FADCEE6008.png"
                alt="Cape Ember Coffee - South African Landscape"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-[#F2EEE8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="overline text-[#A94826] mb-2 block">What We Believe</span>
            <h2 className="font-heading text-4xl text-[#2D2622]">Our Values</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                icon: Coffee, 
                title: 'Quality First', 
                desc: 'We partner with experienced roasters who share our commitment to exceptional coffee.' 
              },
              { 
                icon: Leaf, 
                title: 'Landscape Inspired', 
                desc: 'Every blend reflects a unique South African landscape, turning every brew into a journey.' 
              },
              { 
                icon: MapPin, 
                title: 'Proudly South African', 
                desc: 'Inspired by the beauty, heritage and spirit of South Africa — from coastlines to mountains.' 
              },
              { 
                icon: Heart, 
                title: 'Coffee Experiences', 
                desc: 'Creating memorable moments that allow you to explore South Africa from home.' 
              },
            ].map((value, idx) => (
              <div key={idx} className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-white border border-[#E5DCD0] text-[#A94826]">
                  <value.icon size={28} />
                </div>
                <h3 className="font-heading text-xl text-[#2D2622] mb-2">{value.title}</h3>
                <p className="text-[#5C534C] text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Blends */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="overline text-[#A94826] mb-2 block">The Collection</span>
            <h2 className="font-heading text-4xl text-[#2D2622] mb-4">
              Inspired by the Land
            </h2>
            <p className="text-[#5C534C] max-w-2xl mx-auto">
              Each blend in our collection is named after and inspired by a distinct South African landscape.
            </p>
          </div>

          <div className="space-y-12">
            {[
              {
                name: 'Fynbos Roast',
                desc: 'Inspired by the wild fynbos of the Cape, this medium roast offers a grounded, comforting cup with natural sweetness. Smooth, nutty, and perfectly balanced for everyday enjoyment.',
                image: 'https://customer-assets.emergentagent.com/job_axis-creator/artifacts/s93qex0b_77A74D65-C0D2-4A33-9348-2B0D5FE7082C.jpeg'
              },
              {
                name: 'Garden Route Blend',
                desc: 'A tribute to South Africa\'s iconic coast. This balanced house blend offers a smooth cup with hints of cocoa and gentle citrus notes — perfect for any time of day.',
                image: 'https://customer-assets.emergentagent.com/job_axis-creator/artifacts/bvwasl9r_81ABD9FE-73FC-4C42-BF11-D3A0A1024683.jpeg'
              },
              {
                name: 'Ember Reserve',
                desc: 'For those who appreciate depth and intensity. This premium dark roast delivers a bold, lingering finish with rich dark chocolate notes and a full-bodied character.',
                image: 'https://customer-assets.emergentagent.com/job_axis-creator/artifacts/urotn845_DA24A032-67E2-4343-9612-0534B6EA7394.jpeg'
              },
              {
                name: 'Karoo Horizon',
                desc: 'From the vast, open plains of the Karoo. This expressive light roast offers delicate blueberry and wildflower notes with a relaxed honey finish — a limited release for adventurous palates.',
                image: 'https://customer-assets.emergentagent.com/job_axis-creator/artifacts/7rra3n1s_38C77683-E4ED-4917-95F8-08997E2C06FE.jpeg'
              },
            ].map((blend, idx) => (
              <div 
                key={idx} 
                className={`grid md:grid-cols-2 gap-8 items-center ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className={idx % 2 === 1 ? 'md:order-2' : ''}>
                  <h3 className="font-heading text-3xl text-[#D05C23] mb-4">{blend.name}</h3>
                  <p className="text-[#5C534C] text-lg">{blend.desc}</p>
                </div>
                <div className={`aspect-video overflow-hidden ${idx % 2 === 1 ? 'md:order-1' : ''}`}>
                  <img
                    src={blend.image}
                    alt={blend.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-[#2D2622]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-4xl text-white mb-6">
            Begin Your South African Coffee Journey
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Explore the four signature coffees in a calm, premium collection inspired by South African landscapes.
          </p>
          <Link 
            to="/shop" 
            className="btn-primary inline-block"
            data-testid="about-cta"
          >
            Shop the Collection
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
