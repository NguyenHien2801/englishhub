'use client'
import Studentsidebar from './Studentsidebar' 
import Adminnavbar from './Adminnavbar'       

interface SidebarProps {
  open: boolean
  isAdmin: boolean
}

export default function Sidebar({ open, isAdmin }: SidebarProps) {
  if (isAdmin) {
    return <Studentsidebar open={open} />  // admin → sidebar dọc
  }
  return <Adminnavbar />  // sinh viên → navbar ngang
}