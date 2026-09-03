import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import Crest from './Crest';

export default function Footer() {
  return (
    <footer id="contact" className="relative bg-ink border-t border-gold/15 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-16 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3">
            <Crest size={52} />
            <div>
              <p className="font-display text-3xl font-semibold text-cream leading-none">Aurelius Academy</p>
              <p className="text-[10px] uppercase tracking-[0.35em] text-gold mt-1">Where Excellence Becomes Tradition</p>
            </div>
          </div>
          <p className="mt-6 text-mist text-sm leading-relaxed max-w-md">
            A century-old institution devoted to cultivating scholarship, character and stewardship in every child — from their first day in Nursery to their final examinations in Class X.
          </p>
        </div>
        <div className="md:col-span-3">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold mb-5">Explore</p>
          <ul className="space-y-3 text-sm text-cream/75">
            <li><Link to="/admissions" className="hover:text-gold transition-colors">Admission Portal</Link></li>
            <li><Link to="/admissions?tab=track" className="hover:text-gold transition-colors">Track Application</Link></li>
            <li><Link to="/login" className="hover:text-gold transition-colors">Student Portal</Link></li>
            <li><Link to="/login?as=admin" className="hover:text-gold transition-colors">Administration</Link></li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-gold mb-5">Visit Us</p>
          <ul className="space-y-4 text-sm text-cream/75">
            <li className="flex gap-3"><MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" /> 14 Laurel Crescent, Heritage Hill, Aurelius Estate 110 021</li>
            <li className="flex gap-3"><Phone className="w-4 h-4 text-gold shrink-0 mt-0.5" /> +91 11 4000 1924</li>
            <li className="flex gap-3"><Mail className="w-4 h-4 text-gold shrink-0 mt-0.5" /> admissions@aurelius.academy</li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-gold/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] uppercase tracking-[0.2em] text-mist/70">
          <span>© {new Date().getFullYear()} Aurelius Academy. All rights reserved.</span>
          <span>Nursery · LKG · Prep · Class I – X</span>
        </div>
      </div>
    </footer>
  );
}
