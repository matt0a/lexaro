'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
export default function CTA() { return (
  <section className="py-24 sm:py-28">
    <div className="mx-auto max-w-4xl text-center">
      <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="text-3xl sm:text-5xl font-semibold tracking-tight">Upgrade the way you read.</motion.h2>
      <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} viewport={{ once: true }} className="mt-4 text-neutral-600 dark:text-neutral-300">From classrooms to boardrooms, from study notes to novels — experience documents in a whole new dimension.</motion.p>
      <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} viewport={{ once: true }} className="mt-8">
        <Link href="/get-started" className="inline-flex rounded-full bg-black text-white px-4 md:px-6 py-3 text-sm dark:bg-white dark:text-black">Create Your Account →</Link>
      </motion.div>
    </div>
  </section>
);} 
