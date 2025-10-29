import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Link2, Shield, Sparkles, Crown, Heart } from 'lucide-react';
import HeroImage from "../assets/images/our-story.png";

// Royalty-free Unsplash image URLs
const FOUNDERS_IMG = 'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?auto=format&fit=crop&w=1600&q=80';
const BOTANICALS_IMG = 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1600&q=80';

export default function AboutUs() {
    const cardVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.2,
                duration: 0.8,
                ease: [0.25, 0.1, 0.25, 1],
            },
        }),
    };

    const pillars = [
        {
            icon: <Leaf className="h-12 w-12" />,
            title: 'Purity',
            text: 'Every drop is crafted with natural precision and unfiltered authenticity. No excess, no compromise — just the true spirit of nature refined into scent.',
        },
        {
            icon: <Link2 className="h-12 w-12" />,
            title: 'Bond',
            text: 'Devid Aura is built on connection — between friends, creators, and every soul who wears it. A shared essence that unites individuality through emotion.',
        },
        {
            icon: <Shield className="h-12 w-12" />,
            title: 'Trust',
            text: 'Born from sincerity and perseverance, our promise is transparency — every note, every story, told with honesty and grace.',
        },
    ];

    return (
        <div className="relative overflow-hidden bg-white text-gray-900 py-12">
            {/* Hero Section */}
            <section className="relative h-[50vh] flex flex-col items-center justify-center text-center overflow-hidden">
                {/* Background image with smooth zoom + fade animation */}
                <motion.img
                    src={HeroImage}
                    alt="Luxury perfume bottle with artistic shadows"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    initial={{ scale: 1.1, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    viewport={{ once: true }}
                />

                {/* Gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/30" />

                {/* Text content */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    viewport={{ once: true }}
                    className="relative z-10 px-6 max-w-4xl mx-auto text-white"
                >
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-7xl font-black mb-6 tracking-tight drop-shadow-lg"
                    >
                        Our Story
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        viewport={{ once: true }}
                        className="max-w-2xl mx-auto text-lg md:text-2xl text-gray-200 leading-relaxed"
                    >
                        The bond of two friends, a shared dream, and the fragrance that became their aura.
                    </motion.p>
                </motion.div>
            </section>

            {/* Founders Section */}
            <section className="relative py-12 px-6 md:px-12">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="rounded-3xl overflow-hidden shadow-2xl group">
                            <img
                                src={FOUNDERS_IMG}
                                alt="Founders of Devid Aura"
                                className="w-full h-[600px] object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                            <div className="absolute bottom-8 left-8 text-white">
                                <h3 className="font-display text-3xl font-bold mb-2">
                                    Harshvardhan Singh Jadon & Yomesh Chaudhary
                                </h3>
                                <p className="text-gray-300 text-sm tracking-widest uppercase">
                                    Co-Founders & Dreamers
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <span className="text-gray-500 text-sm font-semibold tracking-widest uppercase">
                            The Beginning
                        </span>
                        <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight">
                            From Friendship to Fragrance
                        </h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-gray-800 to-gray-400 rounded-full" />

                        <blockquote className="border-l-4 border-gray-800 pl-6 italic text-lg text-gray-600 my-8">
                            "We didn’t know how to start a business, but we knew what we wanted to create — a scent that carries emotion, trust, and identity."
                        </blockquote>

                        <div className="space-y-4 text-gray-700 leading-relaxed">
                            <p>
                                Devid Aura was born from the unwavering trust between two childhood friends. United by a dream and guided by passion, Harshvardhan and Yomesh built more than a perfume brand — they built an experience that reflects who you are.
                            </p>
                            <p>
                                With no roadmap but endless determination, their journey transformed mistakes into lessons and curiosity into art. Every bottle of Devid Aura holds that story — a blend of purity, bond, and trust.
                            </p>
                            <p className="font-medium text-gray-900">
                                This is not just fragrance. It’s aura — your essence, reimagined.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Pillars Section */}
            <section className="relative py-12 px-6 md:px-12 overflow-hidden">
                <div className="max-w-7xl mx-auto text-center mb-24">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-gray-500 text-sm font-semibold tracking-widest uppercase"
                    >
                        Our Pillars
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-display font-bold mt-4 mb-6"
                    >
                        Built on Essence
                    </motion.h2>
                    <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        whileInView={{ opacity: 1, scaleX: 1 }}
                        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                        viewport={{ once: true }}
                        className="mx-auto w-24 h-[2px] bg-gradient-to-r from-black via-gray-600 to-gray-400 rounded-full mb-8"
                    />
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        viewport={{ once: true }}
                        className="text-lg text-gray-600 max-w-2xl mx-auto"
                    >
                        The foundation of Devid Aura — crafted from conviction, connection, and clarity.
                    </motion.p>
                </div>

                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
                    {pillars.map((pillar, i) => (
                        <motion.div
                            key={pillar.title}
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-100px' }}
                            className="relative bg-white/80 backdrop-blur-md border border-gray-200 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1"
                        >
                            <div className="p-10 flex flex-col items-center text-center space-y-6">
                                <div className="text-gray-900">{pillar.icon}</div>
                                <h3 className="text-2xl font-bold font-display">{pillar.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{pillar.text}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Process Section */}
            <section className="relative py-12 px-6 md:px-12">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <span className="text-gray-500 text-sm font-semibold tracking-widest uppercase">
                            The Process
                        </span>
                        <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight">
                            The Craft of Aura
                        </h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-gray-800 to-gray-400 rounded-full" />

                        <div className="space-y-6 mt-8">
                            <div className="flex gap-4 items-start group">
                                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-800 group-hover:bg-gray-800 group-hover:text-white transition-all">
                                    <Sparkles className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-display font-semibold text-lg mb-2">Ethical Origins</h4>
                                    <p className="text-gray-600 leading-relaxed">
                                        Our ingredients are gathered from ethical sources worldwide — distilled with respect for both craft and planet.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start group">
                                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-800 group-hover:bg-gray-800 group-hover:text-white transition-all">
                                    <Crown className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-display font-semibold text-lg mb-2">Artisanal Blending</h4>
                                    <p className="text-gray-600 leading-relaxed">
                                        Each blend is balanced through instinct and memory — where science meets soul to create timeless harmony.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start group">
                                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-800 group-hover:bg-gray-800 group-hover:text-white transition-all">
                                    <Heart className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-display font-semibold text-lg mb-2">Aged in Emotion</h4>
                                    <p className="text-gray-600 leading-relaxed">
                                        Every fragrance matures in time, absorbing depth and character — much like the journey that created it.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="rounded-3xl overflow-hidden shadow-xl">
                            <img
                                src={BOTANICALS_IMG}
                                alt="Botanical perfume creation"
                                className="w-full h-[600px] object-cover"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-12 px-6 md:px-12 text-center overflow-hidden">
                <div className="max-w-4xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-display font-bold mb-6"
                    >
                        Find the Aura Within
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        viewport={{ once: true }}
                        className="text-lg text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto"
                    >
                        Devid Aura isn’t worn — it’s felt. Discover the fragrance that mirrors your soul and transforms presence into poetry.
                    </motion.p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center justify-center gap-2 bg-black text-white font-semibold px-12 py-4 text-lg rounded-full shadow-lg hover:shadow-2xl transition-all"
                    >
                        Explore Collection
                    </motion.button>
                </div>
            </section>
            {/* Emotional Outro Section */}
            <section className="relative h-[50vh] flex flex-col items-center justify-center text-center overflow-hidden">
                {/* Background image */}
                <motion.img
                    src="https://images.unsplash.com/photo-1621311290280-7d1469c2d575?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170"
                    alt="Feel the Aura background"
                    className="absolute inset-0 w-full h-full object-cover"
                    initial={{ scale: 1.1, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    viewport={{ once: true }}
                />

                {/* Overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/30" />

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    viewport={{ once: true }}
                    className="relative z-10 px-6 max-w-4xl mx-auto text-white"
                >
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-7xl font-black mb-6 tracking-tight drop-shadow-lg"
                    >
                        Feel the Aura
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        viewport={{ once: true }}
                        className="max-w-2xl mx-auto text-lg md:text-2xl text-gray-200 leading-relaxed mb-10"
                    >
                        More than a perfume — it’s a presence that moves with you.
                        A silent language of confidence, elegance, and truth.
                    </motion.p>
                </motion.div>
            </section>
        </div>
    );
}
