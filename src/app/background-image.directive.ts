import {AfterViewInit, Directive, ElementRef, Input, OnDestroy} from '@angular/core';

@Directive({
  selector: '[appBackgroundImage]'
})
export class BackgroundImageDirective implements OnDestroy, AfterViewInit {

  private el: HTMLElement;
  private timer;

  constructor(el: ElementRef) {
    this.el = el.nativeElement;
  }

  @Input('artistImage') artistImage: ArtistImage;

  ngAfterViewInit() {
    if (this.artistImage.height < this.artistImage.width) {
      const ratio = this.artistImage.height / 204;
      this.el.style.backgroundSize = (this.artistImage.width / ratio) + 'px 204px';
    } else {
      this.el.style.backgroundSize = '204px';
    }
    this.el.style.backgroundPosition = 'center';
    this.el.style.backgroundImage = 'url(' + this.artistImage.url + ')';
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

}
