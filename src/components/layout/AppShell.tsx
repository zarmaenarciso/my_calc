import {
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UserCog,
  X,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuthSession, useSignOut } from '../../features/auth/api'
import { emailToUsername } from '../../features/auth/schemas'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: <LayoutDashboard className="size-4 shrink-0" aria-hidden="true" />,
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: <UserCog className="size-4 shrink-0" aria-hidden="true" />,
  },
]

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: auth } = useAuthSession()
  const signOut = useSignOut()
  const navigate = useNavigate()

  const userLabel =
    auth?.user?.displayName || emailToUsername(auth?.user?.email) || 'Account'

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => {
        setMobileMenuOpen(false)
        void navigate('/login', { replace: true })
      },
    })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900 md:flex-row dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop Collapsible Sidebar */}
      <aside
        aria-label="Primary sidebar"
        className={cn(
          'hidden shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 md:flex dark:border-slate-800 dark:bg-slate-900',
          sidebarCollapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-3 dark:border-slate-800">
          {!sidebarCollapsed ? (
            <span className="flex items-center gap-2 font-semibold tracking-tight">
              <ShieldCheck
                className="size-5 text-indigo-600 dark:text-indigo-400"
                aria-hidden="true"
              />
              <span>Calc App</span>
            </span>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="mx-auto md:mx-0"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>

        <nav aria-label="Main navigation" className="flex-1 space-y-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100',
                  sidebarCollapsed && 'justify-center px-2',
                )
              }
            >
              {item.icon}
              {!sidebarCollapsed ? <span>{item.label}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-2 dark:border-slate-800">
          <div className="space-y-2">
            {!sidebarCollapsed ? (
              <p className="truncate px-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                {userLabel}
              </p>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              isLoading={signOut.isPending}
              aria-label="Sign out"
              className={cn(
                'w-full justify-start',
                sidebarCollapsed && 'justify-center px-0',
              )}
            >
              <LogOut className="size-4 shrink-0" aria-hidden="true" />
              {!sidebarCollapsed ? <span>Sign out</span> : null}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Top Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-sm md:hidden dark:border-slate-800 dark:bg-slate-900/90">
          <span className="flex items-center gap-2 font-semibold tracking-tight">
            <ShieldCheck
              className="size-5 text-indigo-600 dark:text-indigo-400"
              aria-hidden="true"
            />
            <span>Calc App</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            aria-label={
              mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </Button>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen ? (
          <nav
            aria-label="Mobile drawer navigation"
            className="border-b border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    )
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                isLoading={signOut.isPending}
                className="w-full justify-start"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span>Sign out ({userLabel})</span>
              </Button>
            </div>
          </nav>
        ) : null}

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-20 sm:px-6 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav
          aria-label="Mobile bottom navigation"
          className="fixed inset-x-0 bottom-0 z-20 flex h-14 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-sm md:hidden dark:border-slate-800 dark:bg-slate-900/95"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 rounded-md px-3 py-1 text-xs font-medium',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400',
                )
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
