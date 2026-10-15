import { Routes } from '@angular/router';
import { HomePage } from './home/home';
import { RiderPage } from './rider/rider-page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'rider', component: RiderPage },
  { path: 'rider/:code', component: RiderPage },
  { path: 'owner', loadChildren: () => import('./owner/owner.routes').then((m) => m.OWNER_ROUTES) },
  { path: '**', redirectTo: '' },
];
