import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import styles from '@/styles/Pricing.module.css'; // Ensure this CSS module exists or is created
import ClientAnimatedBackground from '@/components/ClientAnimatedBackground';
import { RiCheckboxCircleLine } from 'react-icons/ri'; // Use icon from react-icons

const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  // Example pricing data structure
  const tiers = [
    {
      name: 'Free',
      tagline: 'Basic market monitoring',
      priceMonthly: 0,
      priceAnnual: 0,
      features: [
        'Basic market metrics',
        'Limited historical data (24h)',
        '2-3 standard widgets',
        'Dashboard refresh: 60 seconds',
      ],
      isPopular: false,
      buttonText: 'Get Started',
      buttonLink: '/register',
      tierClass: styles.freeTier,
    },
    {
      name: 'Standard',
      tagline: 'Enhanced real-time insights',
      priceMonthly: 19.99,
      priceAnnual: 19.99 * 12 * 0.8, // 20% discount
      features: [
        'Real-time market data',
        'Full widget customization',
        '7-day historical data',
        'Basic alerts system',
        'Limited API calls (100/day)',
        'Dashboard refresh: 10 seconds',
      ],
      isPopular: true,
      buttonText: 'Choose Standard',
      buttonLink: '/register',
      tierClass: styles.standardTier,
    },
    {
      name: 'Professional',
      tagline: 'Advanced trading toolkit',
      priceMonthly: 49.99,
      priceAnnual: 49.99 * 12 * 0.8, // 20% discount
      features: [
        'Everything in Standard',
        'Advanced technical indicators',
        '30-day historical data',
        'Custom dashboard layouts',
        'Priority customer support',
        'Increased API limits (1000/day)',
      ],
      isPopular: false,
      buttonText: 'Choose Professional',
      buttonLink: '/register',
      tierClass: styles.professionalTier,
    },
    // Add Enterprise tier if needed
  ];

  const getPrice = (tier: typeof tiers[0]) => {
    const price = isAnnual ? tier.priceAnnual / 12 : tier.priceMonthly;
    return price === 0 ? '0' : price.toFixed(2);
  };

  const getPricePeriod = (tier: typeof tiers[0]) => {
    if (tier.priceMonthly === 0) return 'forever';
    return isAnnual ? 'per month, billed annually' : 'per month';
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Pricing | FutureWatch - Crypto Intelligence Dashboard</title>
        <meta name="description" content="Choose the right FutureWatch plan for your crypto trading needs." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />
      
      {/* Positioned Background Wrapper */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: -1 }}>
        <ClientAnimatedBackground opacity={0.3} />
      </div>

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <h1 className={styles.title}>Find the Plan That's Right For You</h1>
          <p className={styles.subtitle}>Start free or unlock powerful features with our paid plans.</p>
          
          {/* Pricing Toggle */}
          <div className={styles.pricingToggle}>
            <span className={!isAnnual ? styles.activeToggle : styles.inactiveToggle}>Monthly</span>
            <label className={styles.toggleSwitch}>
              <input type="checkbox" checked={isAnnual} onChange={() => setIsAnnual(!isAnnual)} />
              <span className={styles.slider}></span>
            </label>
            <span className={isAnnual ? styles.activeToggle : styles.inactiveToggle}>
              Annually <span className={styles.discount}>Save 20%</span>
            </span>
          </div>
        </section>

        {/* Pricing Tiers Section */}
        <section className={styles.pricingSection}>
          <div className={styles.pricingTiersContainer}>
            {tiers.map((tier) => (
              <div key={tier.name} className={`${styles.pricingTier} ${tier.tierClass}`}>
                {tier.isPopular && <div className={styles.popularBadge}>Most Popular</div>}
                <div className={styles.tierHeader}>
                  <h2 className={styles.tierName}>{tier.name}</h2>
                  <p className={styles.tierTagline}>{tier.tagline}</p>
                </div>
                
                <div className={styles.tierPrice}>
                  <span className={styles.priceAmount}>${getPrice(tier)}</span>
                  <span className={styles.pricePeriod}>/ {getPricePeriod(tier)}</span>
                </div>
                
                <ul className={styles.tierFeatures}>
                  {tier.features.map((feature, index) => (
                    <li key={index} className={styles.feature}>
                      <RiCheckboxCircleLine size={16} className={styles.featureIcon} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href={tier.buttonLink} className={styles.tierButton}>
                  {tier.buttonText}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className={styles.faqSection}>
          <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h3>What payment methods do you accept?</h3>
              <p>We accept all major credit cards (Visa, Mastercard, American Express) and PayPal for secure payments.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>Can I change my plan later?</h3>
              <p>Yes, you can upgrade or downgrade your plan at any time through your account settings. Changes will be prorated for the current billing cycle.</p>
            </div>
             <div className={styles.faqItem}>
              <h3>Is there a discount for annual billing?</h3>
              <p>Absolutely! You can save 20% on your subscription fee by choosing the annual billing option compared to paying monthly.</p>
            </div>
             <div className={styles.faqItem}>
              <h3>What is the cancellation policy?</h3>
              <p>You can cancel your subscription at any time. Your access will continue until the end of the current billing period (monthly or annual). We do not offer refunds for partial periods.</p>
            </div>
             <div className={styles.faqItem}>
              <h3>What kind of support is included?</h3>
              <p>All plans include email support. Standard plans receive standard support responses within 24-48 hours. Professional plans benefit from priority support with faster response times.</p>
            </div>
             <div className={styles.faqItem}>
              <h3>Do you offer enterprise solutions?</h3>
              <p>Yes, we offer custom enterprise plans for teams and organizations needing tailored features, dedicated support, and custom API access. Please contact our sales team for more details.</p>
            </div>
          </div>
        </section>

        {/* CTA Section Placeholder */}
         <section className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>Ready to get started?</h2>
          <p className={styles.ctaText}>Choose a plan or contact us for more information.</p>
          <div className={styles.ctaButtons}>
            <Link href="/register" className={styles.primaryButton}>
              Sign Up Now
            </Link>
             <Link href="/contact" className={styles.secondaryButton}>
              Contact Sales
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Pricing; 