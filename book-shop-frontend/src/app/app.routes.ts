import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { DetailComponent } from './pages/detail/detail';
import { CartComponent } from './pages/cart/cart';
import { WishlistComponent } from './pages/wishlist/wishlist';
import { AdminComponent } from './pages/admin/admin';
import { ProfileComponent } from './pages/profile/profile';
import { ChatbotComponent } from './pages/chatbot/chatbot';
import { authGuard } from './guards/auth.guard';
import { userGuard } from './guards/user.guard';
import { CreatePostComponent } from './pages/posts/create-post';
import { MinePostsComponent } from './pages/posts/mine-posts';
import { PostsListComponent } from './pages/posts/posts-list';
import { PostDetailComponent } from './pages/posts/post-detail';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy';
import { TermsOfServiceComponent } from './pages/terms-of-service/terms-of-service';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'detail/:id', component: DetailComponent },
  { path: 'cart', component: CartComponent },
  { path: 'wishlist', component: WishlistComponent },
  { path: 'chatbot', component: ChatbotComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [userGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  { path: 'posts', component: PostsListComponent },
  { path: 'posts/create', component: CreatePostComponent, canActivate: [userGuard] },
  { path: 'posts/create/:id', component: CreatePostComponent, canActivate: [userGuard] },
  { path: 'posts/mine', component: MinePostsComponent, canActivate: [userGuard] },
  { path: 'posts/:id', component: PostDetailComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'terms-of-service', component: TermsOfServiceComponent },
];