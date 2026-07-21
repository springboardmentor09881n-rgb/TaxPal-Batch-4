import { Component } from '@angular/core';
import { SettingsPageComponent } from '../../components/settings-page/settings-page';

@Component({
  selector: 'app-settings-page-shell',
  standalone: true,
  imports: [SettingsPageComponent],
  template: '<app-settings-page></app-settings-page>'
})
export class SettingsPageShellComponent {}
