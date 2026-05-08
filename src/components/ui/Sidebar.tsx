'use client'
import StudentSidebar from './ui/Studentsidebar'
import AdminNavbar from './ui/Adminnavbar'

interface SidebarProps {
  open: boolean
  isAdmin: boolean
}

/**
 * Routing component:
 * - isAdmin=false  → StudentSidebar (vertical, slide-in drawer)
 * - isAdmin=true   → AdminNavbar   (horizontal top bar)
 */
export default function Sidebar({ open, isAdmin }: SidebarProps) {
  if (isAdmin) {
    return <AdminNavbar />
  }
  return <StudentSidebar open={open} />
}