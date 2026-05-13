import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { DetailComponent } from './pages/detail/detail';
import { CartComponent } from './pages/cart/cart';
import { WishlistComponent } from './pages/wishlist/wishlist';
import { AdminComponent } from './pages/admin/admin';
import { ProfileComponent } from './pages/profile/profile';
import { authGuard } from './guards/auth.guard';
import { userGuard } from './guards/user.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'detail/:id', component: DetailComponent },
  { path: 'cart', component: CartComponent },
  { path: 'wishlist', component: WishlistComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [userGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] }
];