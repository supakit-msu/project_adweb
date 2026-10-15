import { Routes } from '@angular/router';
import { OwnerShell } from './pages/owner-shell/owner-shell';
import { Customers } from './pages/customers/customers';
import { Orders } from './pages/orders/orders';
import { RoutesPage } from './pages/routes/routes';

export const OWNER_ROUTES: Routes = [
  {
    path: '',
    component: OwnerShell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'customers' },
      { path: 'customers', component: Customers },
      { path: 'orders', component: Orders },
      { path: 'routes', component: RoutesPage },
    ],
  },
];
