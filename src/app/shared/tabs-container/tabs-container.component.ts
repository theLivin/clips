import {
  Component,
  AfterContentInit,
  ContentChildren,
  QueryList,
} from '@angular/core';
import { TabComponent } from '../tab/tab.component';

@Component({
  selector: 'app-tabs-container',
  templateUrl: './tabs-container.component.html',
  styleUrl: './tabs-container.component.css',
})
export class TabsContainerComponent implements AfterContentInit {
  @ContentChildren(TabComponent) tabs: QueryList<TabComponent> =
    new QueryList();

  ngAfterContentInit(): void {
    const activeTabs = this.tabs.filter((tab) => tab.isActive);
    if (!activeTabs || activeTabs.length === 0) {
      this.selectTab(this.tabs.first);
    }
  }

  selectTab(tab: TabComponent): boolean {
    this.tabs.forEach((tab) => (tab.isActive = false));
    tab.isActive = true;
    return false;
  }

  getClass(isActive: boolean): string {
    if (!isActive) return 'hover:text-white';
    else return 'hover:text-white text-white bg-indigo-400';
  }
}
