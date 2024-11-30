import { 
  RiDashboardLine, 
  RiGalleryLine, 
  RiArticleLine, 
  RiVideoLine, 
  RiUserSmileLine, 
  RiUserSettingsLine 
} from 'react-icons/ri';

export type NavigationItem = {
  label: string;
  path: string;
  icon: typeof RiDashboardLine;
  adminOnly: boolean;
};

export const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: RiDashboardLine,
    adminOnly: false
  },
  {
    label: 'Wedding Gallery',
    path: '/weddings',
    icon: RiGalleryLine,
    adminOnly: false
  },
  {
    label: 'Blog',
    path: '/blog',
    icon: RiArticleLine,
    adminOnly: false
  },
  {
    label: 'Films',
    path: '/films',
    icon: RiVideoLine,
    adminOnly: false
  },
  {
    label: 'Testimonials',
    path: '/testimonials',
    icon: RiUserSmileLine,
    adminOnly: false
  },
  {
    label: 'Users',
    path: '/users',
    icon: RiUserSettingsLine,
    adminOnly: true
  }
]; 