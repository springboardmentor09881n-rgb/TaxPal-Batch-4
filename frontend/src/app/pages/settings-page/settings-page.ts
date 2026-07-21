import { Component } from '@angular/core';
import { SettingsPage as SettingsPageComponentImpl } from '../../components/settings-page/settings-page';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [SettingsPageComponentImpl],
  template: '<app-settings></app-settings>'
})
export class SettingsPageComponent {}
