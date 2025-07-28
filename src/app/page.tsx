import Header from '@/components/layout/Header'
import Hero from '@/components/home/Hero'
import Services from '@/components/home/Services'
import About from '@/components/home/About'
import Booking from '@/components/home/Booking'
import Contact from '@/components/home/Contact'
import Footer from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Services />
      <About />
      <Booking />
      <Contact />
      <Footer />
    </main>
  )
} 