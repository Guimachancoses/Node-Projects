import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PoButtonModule, PoIconModule } from '@po-ui/ng-components';

interface ErrorPageData {
  readonly code: string;
  readonly title: string;
  readonly message: string;
}

@Component({
  selector: 'app-error-page',
  imports: [PoButtonModule, PoIconModule],
  templateUrl: './error.page.html',
  styleUrl: './error.page.scss',
})
export class ErrorPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly data = this.route.snapshot.data as ErrorPageData;

  goHome(): void {
    void this.router.navigateByUrl('/ordens');
  }

  goBack(): void {
    if (history.length > 1) {
      history.back();
      return;
    }
    this.goHome();
  }
}
