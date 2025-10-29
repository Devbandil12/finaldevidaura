import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Leaf, Droplet, Shield, Sparkles, Crown, Heart } from 'lucide-react';

// Image paths — keep these in public/assets or update paths to imports
const HERO_IMG = '/assets/hero-perfume-DQj9vy7X.jpg';
const FOUNDER_IMG = '/assets/founder-portrait-BO_Bk75A.jpg';
const BOTANICALS_IMG = '/assets/botanicals-C3IDq9Eo.jpg';

export default function AboutUs() {
    useEffect(() => {
        AOS.init({ duration: 900, once: true, easing: 'ease-in-out' });
    }, []);

    return (
        <div className="relative overflow-hidden bg-background text-foreground font-sans">

            {/* fixed gradient glow layer (uses global .gradient-glow) */}
            <div
                className="fixed top-0 left-0 w-full h-[150vh] gradient-glow pointer-events-none -z-10"
                style={{ transform: 'translateY(20%)' }}
                aria-hidden
            />

            <div className="text-center pt-24 px-4">
                <h2
                    className="text-5xl md:text-6xl font-black text-gray-900 drop-shadow-lg"
                    data-aos="fade-down"
                >
                    Our Story
                </h2>
                <p
                    className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-gray-600"
                    data-aos="fade-down"
                    data-aos-delay="100"
                >
                    The journey of resilience, artistry, and authenticity behind every bottle.
                </p>
            </div>

            {/* FOUNDER / ORIGIN */}
            <section className="relative py-32 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">

                        <div data-aos="fade-right" className="relative">
                            <div className="relative rounded-3xl overflow-hidden bg-card shadow-medium group">
                                <img src={FOUNDER_IMG} alt="David Laurent, Master Perfumer and Founder" className="w-full h-[600px] object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
                                <div className="absolute bottom-8 left-8 text-primary-foreground">
                                    <h3 className="font-display text-3xl font-bold mb-2">David Laurent</h3>
                                    <p className="text-secondary text-sm tracking-widest uppercase">Founder &amp; Master Perfumer</p>
                                </div>
                            </div>
                            <div className="absolute -top-8 -right-8 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
                        </div>

                        <div data-aos="fade-left" className="space-y-6">
                            <div className="inline-block">
                                <span className="text-accent text-sm font-semibold tracking-widest uppercase">The Origin Story</span>
                            </div>

                            <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight">From Ashes to Artistry</h2>
                            <div className="w-20 h-1 bg-gradient-to-r from-secondary to-accent rounded-full" />

                            <blockquote className="border-l-4 border-accent pl-6 italic text-lg text-muted-foreground my-8">"When the world felt devoid of meaning, I turned to scent. It became my anchor, my way of reclaiming beauty in a fractured world."</blockquote>

                            <div className="space-y-4 text-foreground/80 leading-relaxed">
                                <p>
                                    David Laurent's journey began not in a laboratory, but in the depths of personal struggle. Confronted by loss and searching for meaning, he discovered that fragrance could capture what words could not—the essence of memory, emotion, and hope.
                                </p>
                                <p>
                                    Rejecting mass production and synthetic shortcuts, David embarked on a global quest to source the purest, most ethically harvested botanicals. From remote mountainsides to ancient forests, each ingredient tells a story of preservation and respect.
                                </p>
                                <p className="font-medium text-foreground">Devid Aura is not just a brand—it's a testament to resilience, a celebration of authenticity, and an invitation to discover your own unique essence.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* PILLARS */}
            <section className="relative py-32 px-6 md:px-12 bg-gradient-to-b from-muted/30 to-background">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20" data-aos="fade-up">
                        <span className="text-accent text-sm font-semibold tracking-widest uppercase">Our Pillars</span>
                        <h2 className="text-3xl md:text-6xl font-display font-bold mt-4 mb-6">Built on Truth</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Every bottle of Devid Aura embodies these unwavering principles</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 lg:gap-12">

                        <div data-aos="fade-up" data-aos-delay="0" className="relative group">
                            <div className="bg-card rounded-3xl p-10 shadow-soft hover:shadow-gold transition-all border border-border h-full">
                                <div className="text-accent mb-6 transform group-hover:scale-110 transition-transform"><Leaf className="h-12 w-12" /></div>
                                <h3 className="text-2xl font-display font-bold mb-4">Purity</h3>
                                <p className="text-muted-foreground leading-relaxed">We source only the finest, ethically harvested natural essences from untouched corners of the earth. No compromises, no shortcuts—just nature's truest expression.</p>
                                <div className="absolute -z-10 top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-accent/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        <div data-aos="fade-up" data-aos-delay="100" className="relative group">
                            <div className="bg-card rounded-3xl p-10 shadow-soft hover:shadow-gold transition-all border border-border h-full">
                                <div className="text-accent mb-6 transform group-hover:scale-110 transition-transform"><Droplet className="h-12 w-12" /></div>
                                <h3 className="text-2xl font-display font-bold mb-4">Uniqueness</h3>
                                <p className="text-muted-foreground leading-relaxed">Each fragrance is a singular creation, never replicated. We celebrate individuality, crafting scents that resonate with your soul's unique frequency.</p>
                                <div className="absolute -z-10 top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-accent/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        <div data-aos="fade-up" data-aos-delay="200" className="relative group">
                            <div className="bg-card rounded-3xl p-10 shadow-soft hover:shadow-gold transition-all border border-border h-full">
                                <div className="text-accent mb-6 transform group-hover:scale-110 transition-transform"><Shield className="h-12 w-12" /></div>
                                <h3 className="text-2xl font-display font-bold mb-4">Trust</h3>
                                <p className="text-muted-foreground leading-relaxed">Born from struggle, our brand stands on transparency and integrity. Every promise kept, every ingredient disclosed, every story truthfully told.</p>
                                <div className="absolute -z-10 top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-accent/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* PROCESS / CREATION */}
            <section className="relative py-32 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">

                        <div data-aos="fade-right" className="space-y-6 lg:order-1 order-2">
                            <span className="text-accent text-sm font-semibold tracking-widest uppercase">The Process</span>
                            <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight">The Art of Creation</h2>
                            <div className="w-20 h-1 bg-gradient-to-r from-secondary to-accent rounded-full" />

                            <div className="space-y-6 mt-8">
                                <div className="flex gap-4 items-start group">
                                    <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-primary transition-all"><Sparkles className="h-6 w-6" /></div>
                                    <div>
                                        <h4 className="font-display font-semibold text-lg mb-2">Ethical Sourcing</h4>
                                        <p className="text-muted-foreground leading-relaxed">We journey to the world's most pristine locations, working directly with farmers and harvesters who share our commitment to sustainability.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start group">
                                    <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-primary transition-all"><Crown className="h-6 w-6" /></div>
                                    <div>
                                        <h4 className="font-display font-semibold text-lg mb-2">Master Blending</h4>
                                        <p className="text-muted-foreground leading-relaxed">David personally crafts each formula, balancing rare essences with intuition honed through years of struggle and discovery.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start group">
                                    <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-primary transition-all"><Heart className="h-6 w-6" /></div>
                                    <div>
                                        <h4 className="font-display font-semibold text-lg mb-2">Patient Maturation</h4>
                                        <p className="text-muted-foreground leading-relaxed">Like fine wine, our fragrances age in carefully controlled environments, allowing notes to harmonize into timeless compositions.</p>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div data-aos="fade-left" className="relative lg:order-2 order-1">
                            <div className="relative rounded-3xl overflow-hidden bg-card shadow-medium">
                                <img src={BOTANICALS_IMG} alt="Pure botanical ingredients for luxury perfume" className="w-full h-[600px] object-cover" />
                            </div>
                            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-secondary/20 rounded-full blur-3xl" />
                        </div>

                    </div>
                </div>
            </section>

            {/* CTA / DISCOVER */}
            <section className="relative py-32 px-6 md:px-12 overflow-hidden">
                <div className="absolute inset-0 gradient-gold opacity-20 -z-10" />
                <div className="max-w-4xl mx-auto text-center" data-aos="fade-up">
                    <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Discover Your Signature</h2>
                    <p className="text-lg text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">Every soul has a scent story waiting to be told. Let Devid Aura guide you to a fragrance as unique and authentic as you are.</p>
                    <motion.button whileHover={{ scale: 1.05 }} className="cta-btn inline-flex items-center justify-center gap-2 bg-gradient-to-r from-secondary to-accent text-primary-foreground font-semibold px-12 py-4 text-lg rounded-full shadow-gold hover:shadow-2xl transition-all">
                        Explore Our Collection
                    </motion.button>

                    {/* decorative floating dots */}
                    <div className="absolute top-1/2 left-10 w-2 h-2 bg-accent rounded-full animate-float" />
                    <div className="absolute top-1/4 right-20 w-3 h-3 bg-secondary rounded-full animate-float" style={{ animationDelay: '1s' }} />
                    <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-accent rounded-full animate-float" style={{ animationDelay: '2s' }} />
                </div>
            </section>

        </div>
    );
}
