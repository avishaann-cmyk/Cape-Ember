import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Droplets, Clock, ThermometerSun, Scale, ChevronDown, ChevronUp } from 'lucide-react';

const BREWING_METHODS = [
  {
    id: 'french-press',
    name: 'French Press',
    icon: '🫖',
    description: 'Full-bodied, rich extraction perfect for bold flavors',
    time: '4 minutes',
    ratio: '1:15',
    grind: 'Coarse',
    temp: '93-96°C',
    bestFor: ['Ember Reserve', 'Fynbos Roast'],
    steps: [
      'Heat water to 93-96°C (just off the boil)',
      'Add coarsely ground coffee to the French Press',
      'Pour hot water in a circular motion to saturate all grounds',
      'Stir gently and place the lid on (don\'t press yet)',
      'Wait 4 minutes for optimal extraction',
      'Press the plunger down slowly and steadily',
      'Pour immediately to stop extraction'
    ],
    tips: [
      'Use a coarse grind similar to sea salt to prevent over-extraction',
      'Don\'t let coffee sit in the press after brewing - it will become bitter',
      'For Ember Reserve, try a 4:30 brew time for extra intensity'
    ]
  },
  {
    id: 'pour-over',
    name: 'Pour Over',
    icon: '☕',
    description: 'Clean, bright cup that highlights subtle flavor notes',
    time: '3-4 minutes',
    ratio: '1:16',
    grind: 'Medium-fine',
    temp: '90-94°C',
    bestFor: ['Karoo Horizon', 'Garden Route Blend'],
    steps: [
      'Place filter in dripper and rinse with hot water',
      'Add medium-fine ground coffee and create a small well in the center',
      'Pour a small amount of water to "bloom" - let it sit for 30 seconds',
      'Pour in slow, circular motions from the center outward',
      'Maintain steady water level, never letting grounds dry out',
      'Total brew time should be 3-4 minutes',
      'Remove dripper once all water has passed through'
    ],
    tips: [
      'The bloom releases CO2 - you should see bubbles forming',
      'For Karoo Horizon, use slightly cooler water (90°C) to preserve delicate florals',
      'Avoid pouring directly on the filter walls'
    ]
  },
  {
    id: 'aeropress',
    name: 'AeroPress',
    icon: '🔄',
    description: 'Versatile brewing with smooth, clean results',
    time: '1-2 minutes',
    ratio: '1:12',
    grind: 'Fine-medium',
    temp: '85-92°C',
    bestFor: ['Fynbos Roast', 'Garden Route Blend'],
    steps: [
      'Insert filter and rinse with hot water',
      'Add fine-medium ground coffee to the chamber',
      'Pour water at 85-92°C and stir for 10 seconds',
      'Insert plunger to create seal (inverted method) or proceed normally',
      'Steep for 1 minute',
      'Press down slowly over 20-30 seconds',
      'Dilute with hot water if desired for Americano-style'
    ],
    tips: [
      'The inverted method gives you more control over steep time',
      'For a stronger cup, use a finer grind and longer steep',
      'Fynbos Roast shines with the standard method at 90°C'
    ]
  },
  {
    id: 'espresso',
    name: 'Espresso',
    icon: '☕',
    description: 'Concentrated, intense coffee with rich crema',
    time: '25-30 seconds',
    ratio: '1:2',
    grind: 'Fine',
    temp: '92-96°C',
    bestFor: ['Ember Reserve', 'Fynbos Roast'],
    steps: [
      'Grind coffee fresh and fine (like table salt)',
      'Dose 18-20g of coffee into the portafilter',
      'Distribute grounds evenly and tamp with firm, level pressure',
      'Lock portafilter and start extraction immediately',
      'Aim for 36-40ml output in 25-30 seconds',
      'Look for tiger-striping in the pour',
      'Serve immediately for best flavor'
    ],
    tips: [
      'Ember Reserve produces excellent crema with chocolate notes',
      'If extraction is too fast, grind finer; too slow, grind coarser',
      'Pre-heat your cup for best results'
    ]
  },
  {
    id: 'cold-brew',
    name: 'Cold Brew',
    icon: '🧊',
    description: 'Smooth, low-acidity concentrate for refreshing drinks',
    time: '12-24 hours',
    ratio: '1:8',
    grind: 'Extra coarse',
    temp: 'Cold',
    bestFor: ['Garden Route Blend', 'Fynbos Roast'],
    steps: [
      'Use extra coarse ground coffee (like raw sugar)',
      'Combine coffee and cold/room temperature water in a jar',
      'Stir to ensure all grounds are saturated',
      'Cover and refrigerate for 12-24 hours',
      'Strain through a fine mesh sieve, then through a paper filter',
      'Store concentrate in the fridge for up to 2 weeks',
      'Dilute 1:1 with water or milk before serving over ice'
    ],
    tips: [
      'Garden Route Blend produces a naturally sweet, chocolatey cold brew',
      '18-hour steep time is the sweet spot for most palates',
      'Add a cinnamon stick during steeping for a Cape-inspired twist'
    ]
  },
  {
    id: 'moka-pot',
    name: 'Moka Pot',
    icon: '🫖',
    description: 'Strong, stovetop espresso-style coffee',
    time: '4-5 minutes',
    ratio: '1:10',
    grind: 'Fine-medium',
    temp: 'Stovetop',
    bestFor: ['Ember Reserve', 'Fynbos Roast'],
    steps: [
      'Fill the bottom chamber with hot water up to the valve',
      'Add fine-medium ground coffee to the filter basket - don\'t tamp',
      'Assemble the pot and place on medium-low heat',
      'Leave the lid open to watch the extraction',
      'When coffee starts flowing, reduce heat to minimum',
      'Remove from heat when you hear a gurgling sound',
      'Run cold water on the base to stop extraction'
    ],
    tips: [
      'Using pre-heated water prevents the coffee from getting bitter',
      'Ember Reserve is perfect for Moka Pot - bold and intense',
      'Never tamp the coffee - it should be loose in the basket'
    ]
  }
];

const BLEND_RECOMMENDATIONS = [
  {
    id: 'fynbos-roast',
    name: 'Fynbos Roast',
    roast: 'Medium',
    profile: 'Smooth · Nutty · Balanced',
    description: 'This versatile medium roast works beautifully across all brewing methods. Its balanced profile makes it forgiving for beginners while rewarding for experienced brewers.',
    idealMethods: ['French Press', 'AeroPress', 'Pour Over'],
    grindTip: 'Medium grind works best - adjust finer for espresso, coarser for French Press',
    flavorTip: 'To bring out the nutty sweetness, try brewing at 92°C',
    image: 'https://customer-assets.emergentagent.com/job_axis-creator/artifacts/s93qex0b_77A74D65-C0D2-4A33-9348-2B0D5FE7082C.jpeg'
  },
  {
    id: 'garden-route',
    name: 'Garden Route Blend',
    roast: 'Medium',
    profile: 'Smooth · Cocoa · Gentle Citrus',
    description: 'Our house blend is designed for everyday enjoyment. The cocoa notes shine in milk-based drinks while the citrus brightness comes through in black coffee.',
    idealMethods: ['Pour Over', 'Cold Brew', 'AeroPress'],
    grindTip: 'Medium-fine for pour over brings out the cocoa; extra coarse for cold brew highlights sweetness',
    flavorTip: 'This blend makes exceptional cold brew with natural sweetness',
    image: 'https://customer-assets.emergentagent.com/job_axis-creator/artifacts/bvwasl9r_81ABD9FE-73FC-4C42-BF11-D3A0A1024683.jpeg'
  },
  {
    id: 'ember-reserve',
    name: 'Ember Reserve',
    roast: 'Dark',
    profile: 'Rich · Dark Chocolate · Intense',
    description: 'Our boldest offering demands respect. Best brewed with methods that showcase its intensity - espresso and French Press bring out the dark chocolate depth.',
    idealMethods: ['Espresso', 'French Press', 'Moka Pot'],
    grindTip: 'Fine for espresso, coarse for French Press - avoid medium grinds which can taste bitter',
    flavorTip: 'Extend French Press time to 4:30 for maximum body and chocolate notes',
    image: 'https://customer-assets.emergentagent.com/job_axis-creator/artifacts/urotn845_DA24A032-67E2-4343-9612-0534B6EA7394.jpeg'
  },
  {
    id: 'karoo-horizon',
    name: 'Karoo Horizon',
    roast: 'Light',
    profile: 'Floral · Blueberry · Bright',
    description: 'This delicate Ethiopian requires gentle treatment. Lower temperatures and careful extraction preserve the floral aromatics and fruit-forward brightness.',
    idealMethods: ['Pour Over', 'AeroPress'],
    grindTip: 'Medium-fine grind, and don\'t over-extract - stop at 3 minutes',
    flavorTip: 'Use 90°C water to preserve the delicate blueberry and floral notes',
    image: 'https://customer-assets.emergentagent.com/job_axis-creator/artifacts/7rra3n1s_38C77683-E4ED-4917-95F8-08997E2C06FE.jpeg'
  }
];

const BrewGuidePage = () => {
  const [expandedMethod, setExpandedMethod] = useState('french-press');
  const [selectedBlend, setSelectedBlend] = useState('fynbos-roast');

  const toggleMethod = (methodId) => {
    setExpandedMethod(expandedMethod === methodId ? null : methodId);
  };

  const selectedBlendData = BLEND_RECOMMENDATIONS.find(b => b.id === selectedBlend);

  return (
    <div className="min-h-screen pt-20 md:pt-24">
      {/* Hero */}
      <section className="bg-[#2D2622] text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="overline text-[#A94826] mb-4 block">Master Your Brew</span>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl mb-6">
            Cape Ember Brewing Guide
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Unlock the full potential of your Cape Ember coffee with our blend-specific 
            brewing recommendations. Each roast has unique characteristics that shine with 
            the right technique.
          </p>
        </div>
      </section>

      {/* Quick Reference */}
      <section className="py-12 bg-[#F2EEE8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Scale, label: 'Coffee Ratio', value: '1:15 to 1:17' },
              { icon: ThermometerSun, label: 'Water Temp', value: '90-96°C' },
              { icon: Droplets, label: 'Water Quality', value: 'Filtered' },
              { icon: Clock, label: 'Grind Fresh', value: 'Before brewing' },
            ].map((item, idx) => (
              <div key={idx} className="text-center p-4">
                <item.icon size={32} className="mx-auto text-[#A94826] mb-2" />
                <p className="text-sm text-[#5C534C]">{item.label}</p>
                <p className="font-semibold text-[#2D2622]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blend Selector */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="overline text-[#A94826] mb-2 block">Choose Your Blend</span>
            <h2 className="font-heading text-3xl md:text-4xl text-[#2D2622] mb-4">
              Brewing Recommendations by Blend
            </h2>
            <p className="text-[#5C534C] max-w-2xl mx-auto">
              Select your Cape Ember blend to see personalized brewing tips and ideal methods.
            </p>
          </div>

          {/* Blend Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {BLEND_RECOMMENDATIONS.map((blend) => (
              <button
                key={blend.id}
                onClick={() => setSelectedBlend(blend.id)}
                className={`px-6 py-3 font-medium transition-all ${
                  selectedBlend === blend.id
                    ? 'bg-[#A94826] text-white'
                    : 'bg-[#F2EEE8] text-[#5C534C] hover:bg-[#E5DCD0]'
                }`}
                data-testid={`blend-tab-${blend.id}`}
              >
                {blend.name}
              </button>
            ))}
          </div>

          {/* Selected Blend Info */}
          {selectedBlendData && (
            <div className="grid md:grid-cols-2 gap-8 items-center bg-[#F2EEE8] border border-[#E5DCD0] p-8">
              <div className="aspect-square max-w-sm mx-auto">
                <img
                  src={selectedBlendData.image}
                  alt={selectedBlendData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="badge badge-primary">{selectedBlendData.roast} Roast</span>
                </div>
                <h3 className="font-heading text-3xl text-[#2D2622] mb-2">
                  {selectedBlendData.name}
                </h3>
                <p className="text-[#A94826] font-medium mb-4">{selectedBlendData.profile}</p>
                <p className="text-[#5C534C] mb-6">{selectedBlendData.description}</p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-[#2D2622] mb-2">Ideal Brewing Methods</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedBlendData.idealMethods.map((method, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white border border-[#E5DCD0] text-sm text-[#5C534C]">
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2D2622] mb-1">Grind Tip</h4>
                    <p className="text-sm text-[#5C534C]">{selectedBlendData.grindTip}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2D2622] mb-1">Flavor Tip</h4>
                    <p className="text-sm text-[#5C534C]">{selectedBlendData.flavorTip}</p>
                  </div>
                </div>

                <Link
                  to={`/product/${selectedBlendData.id}`}
                  className="btn-primary inline-block mt-6"
                  data-testid={`shop-${selectedBlendData.id}`}
                >
                  Shop {selectedBlendData.name}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Brewing Methods */}
      <section className="section-padding bg-[#FAFAF7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="overline text-[#A94826] mb-2 block">Step by Step</span>
            <h2 className="font-heading text-3xl md:text-4xl text-[#2D2622] mb-4">
              Brewing Methods
            </h2>
            <p className="text-[#5C534C]">
              Detailed guides for each brewing method, optimized for Cape Ember coffees.
            </p>
          </div>

          <div className="space-y-4">
            {BREWING_METHODS.map((method) => (
              <div
                key={method.id}
                className="border border-[#E5DCD0] bg-white overflow-hidden"
                data-testid={`method-${method.id}`}
              >
                <button
                  onClick={() => toggleMethod(method.id)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-[#F2EEE8] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{method.icon}</span>
                    <div>
                      <h3 className="font-heading text-xl text-[#2D2622]">{method.name}</h3>
                      <p className="text-sm text-[#5C534C]">{method.description}</p>
                    </div>
                  </div>
                  {expandedMethod === method.id ? (
                    <ChevronUp size={24} className="text-[#A94826]" />
                  ) : (
                    <ChevronDown size={24} className="text-[#5C534C]" />
                  )}
                </button>

                {expandedMethod === method.id && (
                  <div className="p-6 pt-0 border-t border-[#E5DCD0] animate-fade-in">
                    {/* Quick specs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-[#F2EEE8]">
                      <div className="text-center">
                        <Clock size={20} className="mx-auto text-[#A94826] mb-1" />
                        <p className="text-xs text-[#5C534C]">Brew Time</p>
                        <p className="font-semibold text-[#2D2622] text-sm">{method.time}</p>
                      </div>
                      <div className="text-center">
                        <Scale size={20} className="mx-auto text-[#A94826] mb-1" />
                        <p className="text-xs text-[#5C534C]">Ratio</p>
                        <p className="font-semibold text-[#2D2622] text-sm">{method.ratio}</p>
                      </div>
                      <div className="text-center">
                        <Coffee size={20} className="mx-auto text-[#A94826] mb-1" />
                        <p className="text-xs text-[#5C534C]">Grind</p>
                        <p className="font-semibold text-[#2D2622] text-sm">{method.grind}</p>
                      </div>
                      <div className="text-center">
                        <ThermometerSun size={20} className="mx-auto text-[#A94826] mb-1" />
                        <p className="text-xs text-[#5C534C]">Temp</p>
                        <p className="font-semibold text-[#2D2622] text-sm">{method.temp}</p>
                      </div>
                    </div>

                    {/* Best for */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-[#2D2622] mb-2">Best Cape Ember Blends</h4>
                      <div className="flex flex-wrap gap-2">
                        {method.bestFor.map((blend, idx) => (
                          <span key={idx} className="px-3 py-1 bg-[#A94826]/10 text-[#A94826] text-sm font-medium">
                            {blend}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-[#2D2622] mb-3">How to Brew</h4>
                      <ol className="space-y-2">
                        {method.steps.map((step, idx) => (
                          <li key={idx} className="flex gap-3 text-[#5C534C]">
                            <span className="flex-shrink-0 w-6 h-6 bg-[#A94826] text-white text-sm flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Tips */}
                    <div className="bg-[#F2EEE8] p-4">
                      <h4 className="font-semibold text-[#2D2622] mb-2">Pro Tips</h4>
                      <ul className="space-y-1">
                        {method.tips.map((tip, idx) => (
                          <li key={idx} className="text-sm text-[#5C534C] flex gap-2">
                            <span className="text-[#A94826]">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-[#2D2622]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl text-white mb-6">
            Ready to Start Brewing?
          </h2>
          <p className="text-white/70 mb-8">
            Explore our collection of premium South African-inspired coffees and find your perfect blend.
          </p>
          <Link to="/shop" className="btn-primary inline-block" data-testid="brew-guide-shop-cta">
            Shop All Coffee
          </Link>
        </div>
      </section>
    </div>
  );
};

export default BrewGuidePage;
