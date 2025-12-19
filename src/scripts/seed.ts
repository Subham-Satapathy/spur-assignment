#!/usr/bin/env node

import { createDatabase, closeDatabase, getDatabase } from '../shared/database';
import { knowledgeEntries } from '../shared/database/schema';
import { validateConfig } from '../shared/config';
import logger from '../shared/logger';

interface SeedData {
  category: string;
  title: string;
  content: string;
  priority: number;
}

const knowledgeSeeds: SeedData[] = [
  {
    category: 'shipping',
    title: 'Shipping Regions',
    content:
      'Spur of the Moment Shop ships to all 50 US states, Canada, UK, and Australia. Because impulse buys know no borders! International shipping typically takes 7-14 business days.',
    priority: 10,
  },
  {
    category: 'shipping',
    title: 'Shipping Costs',
    content:
      'Free standard shipping on orders over $50. Standard shipping (5-7 business days) costs $5.99. Express shipping (2-3 business days) costs $12.99.',
    priority: 9,
  },
  {
    category: 'shipping',
    title: 'Order Tracking',
    content:
      'Once your order ships, you will receive a tracking number via email. You can track your order using this number on our website or the carrier\'s website.',
    priority: 8,
  },

  {
    category: 'returns',
    title: 'Return Window',
    content:
      'We accept returns within 30 days of delivery. Items must be unused, in original packaging, with all tags attached.',
    priority: 10,
  },
  {
    category: 'returns',
    title: 'Return Process',
    content:
      'To initiate a return, email support@spurshop.com with your order number. We will provide a prepaid return shipping label within 24 hours. Changed your mind? No worries - it happens on a spur of the moment!',
    priority: 9,
  },
  {
    category: 'returns',
    title: 'Refund Timeline',
    content:
      'Refunds are processed within 5-7 business days after we receive your return. The refund will be issued to your original payment method.',
    priority: 8,
  },
  {
    category: 'returns',
    title: 'Non-Returnable Items',
    content:
      'Final sale items, personalized products, and opened hygiene products cannot be returned for hygiene and safety reasons.',
    priority: 7,
  },

  {
    category: 'support',
    title: 'Customer Support Hours',
    content:
      'Our customer support team is available Monday through Friday, 9 AM to 6 PM EST. We typically respond to emails within 24 hours on business days.',
    priority: 10,
  },
  {
    category: 'support',
    title: 'Contact Methods',
    content:
      'You can reach us via email at support@spurshop.com, live chat on our website during business hours, or phone at 1-800-IMPULSE. We\'re here for all your spontaneous shopping needs!',
    priority: 9,
  },

  {
    category: 'payment',
    title: 'Accepted Payment Methods',
    content:
      'We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, and Google Pay.',
    priority: 10,
  },
  {
    category: 'payment',
    title: 'Payment Security',
    content:
      'All transactions are encrypted and secure. We use industry-standard SSL encryption to protect your payment information.',
    priority: 8,
  },


  {
    category: 'products',
    title: 'Product Availability',
    content:
      'Product availability is updated in real-time on our website. If an item shows as in stock, it is available for immediate shipment.',
    priority: 7,
  },
  {
    category: 'products',
    title: 'Product Warranties',
    content:
      'All our products come with a manufacturer\'s warranty. Warranty periods vary by product - please check the product page for specific details.',
    priority: 6,
  },
];

async function seedKnowledge() {
  const db = getDatabase();

  logger.info(`Seeding ${knowledgeSeeds.length} knowledge entries...`);

  for (const seed of knowledgeSeeds) {
    try {
      await db.insert(knowledgeEntries).values({
        category: seed.category,
        title: seed.title,
        content: seed.content,
        priority: seed.priority,
        isActive: true,
      });
      logger.debug(`Seeded: ${seed.category} - ${seed.title}`);
    } catch (error) {
      logger.error(`Failed to seed: ${seed.title}`, { error });
    }
  }

  logger.info('Knowledge base seeding completed');
}

async function main() {
  try {
    logger.info('Starting database seeding...');

    validateConfig({ skipLLM: true });

    createDatabase();

    await seedKnowledge();

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed', { error: error instanceof Error ? error.message : error });
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

main();
