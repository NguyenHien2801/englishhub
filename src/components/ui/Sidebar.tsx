'use client'
import Studentsidebar from './Studentsidebar' 
import Adminnavbar from './Adminnavbar'       

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
    return <Studentsidebar open={open} />  // admin dùng sidebar dọc
  }
  return <Adminnavbar />  // sinh viên dùng navbar ngang
}