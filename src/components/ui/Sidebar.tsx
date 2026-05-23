'use client'
import StudentNavbar from './StudentNavbar'

interface SidebarProps {
  open: boolean
  profile?: Record<string, unknown> | null
}

export default function Sidebar({ open, profile }: SidebarProps) {
  return <StudentNavbar open={open} profile={profile} />
}