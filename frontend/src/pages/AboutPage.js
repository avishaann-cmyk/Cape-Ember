import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Leaf, MapPin, Heart } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen pt-20 md:pt-24">
      {/* Hero */}
      <section className="relative h-[60vh] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('https://images.pexels.com/photos/5306368/pexels-photo-5306368.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940')`
          }}
        />
        <div className="absolute inset-0 hero-overlay" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="overline text-[#A94826] mb-4 block">Our Story</span>
          <h1 className="font-heading text-5xl md:text-6xl text-white mb-6">
            From Landscape to Cup
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Cape Ember Coffee Co. was born from a love of South African landscapes and the ritual of a perfect cup of coffee.
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
                We source premium beans and roast them in small batches at our Cape Town 
                roastery, ensuring every bag delivers the freshest, most flavorful coffee 
                possible.
              </p>
              <p className="text-[#5C534C] text-lg">
                Our mission is simple: to bring the beauty of South Africa into your 
                daily coffee ritual, one cup at a time.
              </p>
            </div>
            <div className="aspect-square overflow-hidden">
              <img
                src="https://images.pexels.com/photos/29795384/pexels-photo-29795384.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                alt="Cape Ember Coffee packaging"
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
                desc: 'We never compromise on quality. Every bean is carefully selected and roasted to perfection.' 
              },
              { 
                icon: Leaf, 
                title: 'Sustainability', 
                desc: 'We partner with farms that share our commitment to environmental responsibility.' 
              },
              { 
                icon: MapPin, 
                title: 'Local Pride', 
                desc: 'We celebrate South African heritage and support our local community.' 
              },
              { 
                icon: Heart, 
                title: 'Passion', 
                desc: 'Coffee is our passion. We put love into every step of the process.' 
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
                region: 'Cape Peninsula',
                desc: 'Like the unique fynbos biome, this blend is smooth, balanced, and distinctly South African. Nutty undertones with a clean finish.',
                image: 'https://images.pexels.com/photos/15093129/pexels-photo-15093129.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'
              },
              {
                name: 'Garden Route Blend',
                region: 'Garden Route',
                desc: 'Journey through lush forests and coastal cliffs with this smooth blend featuring cocoa richness and gentle citrus notes.',
                image: 'https://images.pexels.com/photos/17303602/pexels-photo-17303602.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'
              },
              {
                name: 'Ember Reserve',
                region: 'Drakensberg',
                desc: 'Bold as the mountain peaks, this dark roast is rich, intense, and deeply satisfying. For those who like their coffee strong.',
                image: 'https://images.pexels.com/photos/14498531/pexels-photo-14498531.jpeg'
              },
              {
                name: 'Karoo Horizon',
                region: 'Great Karoo',
                desc: 'Bright and expansive like the Karoo sky at dawn. Blueberry notes dance with floral undertones in this limited edition blend.',
                image: 'https://images.pexels.com/photos/12039675/pexels-photo-12039675.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'
              },
            ].map((blend, idx) => (
              <div 
                key={idx} 
                className={`grid md:grid-cols-2 gap-8 items-center ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className={idx % 2 === 1 ? 'md:order-2' : ''}>
                  <span className="overline text-[#A94826] mb-2 block">{blend.region}</span>
                  <h3 className="font-heading text-3xl text-[#2D2622] mb-4">{blend.name}</h3>
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
            Ready to Experience South Africa?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Start your journey with our Landscape Range Bundle and discover all four signature blends.
          </p>
          <Link 
            to="/product/landscape-bundle" 
            className="btn-primary inline-block"
            data-testid="about-cta"
          >
            Shop the Bundle
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
