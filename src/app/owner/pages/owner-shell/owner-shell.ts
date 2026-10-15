import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-owner-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './owner-shell.html',
})
export class OwnerShell {
  readonly menus = [
    { path: '/owner/customers', label: 'ลูกค้า', icon: '👥' },
    { path: '/owner/orders', label: 'ออเดอร์', icon: '🍱' },
    { path: '/owner/routes', label: 'จัดเส้นทาง', icon: '🗺️' },
  ];
}
