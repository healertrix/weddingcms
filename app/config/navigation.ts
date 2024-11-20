import { 
  RiDashboardLine, 
  RiUserLine, 
  RiVideoLine, 
  RiArticleLine, 
  RiHeartsLine, 
  RiStarLine 
} from 'react-icons/ri';

export type NavigationItem = {
  label: string;
  path: string;
  icon: typeof RiDashboardLine;
};

export const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: RiDashboardLine
  },
  {
    label: 'Wedding Gallery',
    path: '/weddings',
    icon: RiHeartsLine
  },
  {
    label: 'Blog',
    path: '/blog',
    icon: RiArticleLine
  },
  {
    label: 'Films',
    path: '/films',
    icon: RiVideoLine
  },
  {
    label: 'Testimonials',
    path: '/testimonials',
    icon: RiStarLine
  },
  {
    label: 'Users',
    path: '/users',
    icon: RiUserLine
  }
]; 