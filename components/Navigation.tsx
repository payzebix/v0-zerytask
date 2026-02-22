'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Rocket,
  Users,
  TrendingUp,
  User,
  Zap,
  DollarSign,
  BarChart3,
  Tag,
  Link2,
} from 'lucide-react'

interface NavigationProps {
  isAdmin: boolean
}

export function Navigation({ isAdmin }: NavigationProps) {
  const pathname = usePathname()

  if (isAdmin) {
    const adminLinks = [
      { href: '/admin', label: 'Home', icon: Home },
      { href: '/admin/mission-profiles', label: 'Profiles', icon: Zap },
      { href: '/admin/mission-categories', label: 'Categories', icon: Tag },
      { href: '/admin/missions', label: 'Missions', icon: Rocket },
      { href: '/admin/social-networks', label: 'Networks', icon: Link2 },
      { href: '/admin/mission-verification', label: 'Verify', icon: TrendingUp },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/requests', label: 'Requests', icon: DollarSign },
      { href: '/admin/system', label: 'System', icon: BarChart3 },
    ]

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex justify-around items-center h-20 md:left-0 md:right-auto md:w-64 md:border-r md:border-t-0 md:flex-col md:items-start md:px-4 md:py-6 md:justify-start md:h-full md:top-0 overflow-y-auto">
        {adminLinks.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || pathname.startsWith(link.href.split('/').slice(0, -1).join('/'))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 ${
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={20} />
              <span className="hidden md:inline text-sm font-medium">{link.label}</span>
            </Link>
          )
        })}
      </nav>
    )
  }

  const userLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/missions', label: 'Missions', icon: Rocket },
    { href: '/exchange', label: 'Exchange', icon: DollarSign },
    { href: '/referrals', label: 'Referrals', icon: Users },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl">
      <div className="flex justify-around items-center h-20 max-w-7xl mx-auto">
        {userLinks.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full py-2 px-3 transition-all duration-200 relative group ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1 font-medium">{link.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
