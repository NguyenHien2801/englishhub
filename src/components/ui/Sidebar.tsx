'use client'
import StudentNavbar from './StudentNavbar'
import AdminSidebar from './AdminSidebar'

interface SidebarProps {
  open: boolean
  isAdmin: boolean
  profile?: Record<string, unknown> | null
}

export default function Sidebar({ open, isAdmin, profile }: SidebarProps) {
  if (isAdmin) {
    return <AdminSidebar />
  }
  return <StudentNavbar open={open} profile={profile} />
}