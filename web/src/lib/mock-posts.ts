// Mock blog data - will be replaced with Supabase later

import { BlogPost } from './blog';

export const mockPosts: BlogPost[] = [
    {
        id: '1',
        title: 'Why Most AI Implementations Fail (And How to Fix It)',
        slug: 'why-ai-implementations-fail',
        excerpt: 'After 17 years in enterprise systems, I\'ve seen the same patterns destroy AI projects over and over. Here\'s what actually works.',
        content: `
# Why Most AI Implementations Fail

After 17 years building enterprise systems, I've watched companies pour millions into AI initiatives only to see them crumble. The pattern is always the same.

## The Problem Isn't the Technology

Everyone blames the AI. "The model wasn't accurate enough." "The data was bad." "We needed more training."

**Wrong.**

The problem is almost never technical. It's architectural.

## Three Patterns That Kill AI Projects

### 1. The Pilot Trap

Companies run a successful pilot, declare victory, then try to scale it. But pilots are designed to succeed. They have dedicated resources, hand-picked data, and motivated teams.

Production is different. Production is chaos.

### 2. The Integration Nightmare

AI doesn't exist in a vacuum. It needs to talk to your CRM, your ERP, your legacy systems from 2003 that nobody understands anymore.

Most teams underestimate this by 10x.

### 3. The Maintenance Blind Spot

You built it. It works. You move on.

Six months later, the model has drifted, the data pipeline is broken, and nobody knows how to fix it because the original team is gone.

## What Actually Works

The companies that succeed treat AI like infrastructure, not a project.

- **Design for production from day one**
- **Build observability into everything**
- **Own the maintenance story before launch**

This isn't sexy. It doesn't make good demos. But it's the difference between a proof-of-concept and a production system that generates millions.

---

*Want to discuss your AI architecture? [Let's talk](/contact).*
    `,
        coverImage: '/blog/ai-failure.jpg',
        category: 'AI Systems',
        published: true,
        publishedAt: '2026-01-28',
        readingTime: '5 min',
        author: {
            name: 'Anwesh Rath',
        },
    },
    {
        id: '2',
        title: 'The Architecture of Scale: Lessons from Building for Billions',
        slug: 'architecture-of-scale',
        excerpt: 'What I learned during my time at Microsoft about building systems that don\'t break when reality hits.',
        content: `
# The Architecture of Scale

When I joined Microsoft, I thought I understood scale. I didn't.

## The Numbers That Break Your Brain

At enterprise scale, everything you thought you knew becomes wrong.

- 1 million requests per second
- 99.99% uptime required
- Global distribution across 50+ regions
- Teams of hundreds working on the same codebase

The rules change completely.

## Principles That Actually Matter

### 1. Everything Fails

Not "might fail." Will fail. Design for it.

Every service, every database, every network call—assume it's going to break at the worst possible moment.

### 2. Simple Beats Clever

That elegant algorithm you're proud of? It's a liability.

At scale, boring is beautiful. Boring is maintainable. Boring is debuggable at 3 AM when production is on fire.

### 3. Measure Everything

You can't fix what you can't see.

Instrument aggressively. Log generously. Build dashboards before you think you need them.

## The Meta-Lesson

Scale isn't about technology. It's about systems thinking.

The best engineers I worked with weren't the smartest coders. They were the ones who could see the whole system, anticipate failure modes, and design for the reality of production.

---

*Building something that needs to scale? [Let's architect it together](/contact).*
    `,
        coverImage: '/blog/scale.jpg',
        category: 'Enterprise',
        published: true,
        publishedAt: '2026-01-15',
        readingTime: '6 min',
        author: {
            name: 'Anwesh Rath',
        },
    },
    {
        id: '3',
        title: 'The Psychology of Persuasion in Product Design',
        slug: 'psychology-of-persuasion',
        excerpt: 'How understanding human behavior transformed my approach to building products that people actually use.',
        content: `
# The Psychology of Persuasion in Product Design

After leaving Microsoft, I went deep into psychology. NLP. Persuasion. Human behavior.

It changed everything about how I build products.

## The Insight That Changed My Thinking

People don't buy products. They buy better versions of themselves.

This sounds like marketing fluff, but it's actually a technical specification. It tells you exactly what to build and how to build it.

## Practical Applications

### Friction is a Feature

Sometimes you want friction. Sign-up flows that are too easy attract the wrong users.

Strategic friction filters for intent.

### Defaults Are Decisions

Every default you set is a decision you're making for your user. Most people never change defaults.

Choose wisely.

### Progress Creates Momentum

Show people how far they've come. Progress bars. Streaks. Levels.

This isn't gamification. It's acknowledging human psychology.

## The Deeper Truth

The best products aren't about technology. They're about understanding people.

Study psychology. Study persuasion. Study what makes humans tick.

Then encode that understanding into your systems.

---

*Want to build products that resonate? [Let's talk](/contact).*
    `,
        coverImage: '/blog/psychology.jpg',
        category: 'Product',
        published: true,
        publishedAt: '2026-01-05',
        readingTime: '4 min',
        author: {
            name: 'Anwesh Rath',
        },
    },
];

export function getAllPosts(): BlogPost[] {
    return mockPosts.filter(post => post.published);
}

export function getPostBySlug(slug: string): BlogPost | undefined {
    return mockPosts.find(post => post.slug === slug && post.published);
}

export function getPostsByCategory(category: string): BlogPost[] {
    return mockPosts.filter(post => post.category === category && post.published);
}
