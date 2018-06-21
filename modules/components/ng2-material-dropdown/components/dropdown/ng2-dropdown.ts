import {
    Component,
    ContentChild,
    Output,
    EventEmitter,
    Input,
    ElementRef
} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import {
    delay,
    first,
    flatMap,
    merge,
    takeUntil,
    auditTime,
    map,
    distinctUntilChanged,
    startWith
} from 'rxjs/operators';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { empty } from 'rxjs/observable/empty';
import { never } from 'rxjs/observable/never';
import detectPassiveEvents from 'detect-passive-events';

import { Ng2DropdownButton } from '../button/ng2-dropdown-button';
import { Ng2DropdownMenu } from '../menu/ng2-dropdown-menu';
import { DropdownStateService } from '../../services/dropdown-state.service';

@Component({
    selector: 'ng2-dropdown',
    templateUrl: './template.html',
    providers: [ DropdownStateService ]
})
export class Ng2Dropdown {
    // get children components
    @ContentChild(Ng2DropdownButton) public button: Ng2DropdownButton;
    @ContentChild(Ng2DropdownMenu) public menu: Ng2DropdownMenu;

    // outputs
    @Output() public onItemClicked: EventEmitter<string> = new EventEmitter<string>();
    @Output() public onItemSelected: EventEmitter<string> = new EventEmitter<string>();
    @Output() public onShow: EventEmitter<Ng2Dropdown> = new EventEmitter<Ng2Dropdown>();
    @Output() public onHide: EventEmitter<Ng2Dropdown> = new EventEmitter<Ng2Dropdown>();

    @Input() public anchorEl: ElementRef;
    @Input() public hideOnBlur = true;
    private onDestroy: EventEmitter<any> = new EventEmitter<any>();
    public onPositionChanged: EventEmitter<any> = new EventEmitter<any>();


    constructor(private state: DropdownStateService) {
        this.onShow.pipe(
                delay(100), // wait for Angular creating `a-dropdown__backdrop` element
                flatMap(_ => {
                    // then when it got clicked
                    return fromEvent(this.menu.getBackdropElement(), 'click')
                    .pipe(
                        first(), // for the first time only
                        merge(
                            // or when window got blur
                            this.hideOnBlur ? fromEvent(window, 'blur').pipe(first()) : never()
                        )
                    );
                }),
                takeUntil(this.onDestroy)
            )
            .subscribe(_ => {
                // we hide the menu
                this.hide();
            });

        this.onShow
            .pipe(
                flatMap(v => {
                    if (this.anchorEl) {
                        // this.updatePost({ x: 0, y: 0 }, false);
                        let aObservable: Observable<any>;
                        if (detectPassiveEvents.hasSupport) {
                            // https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md
                            aObservable = fromEvent(window, 'scroll', { passive: true });
                        } else {
                            aObservable = fromEvent(window, 'scroll');
                        }
                        return aObservable.pipe(
                            merge(fromEvent(window, 'resize')),
                            merge(fromEvent(window, 'orientationchange')),
                            startWith(0), // this will help update the menu post for the time the menu got shown
                            // delay(10),
                            auditTime(100),
                            takeUntil(this.onHide),
                            map(_ => this.anchorEl.nativeElement.getBoundingClientRect()),
                            map(rect => this.menu.calcPositionOffset(rect, this.anchorEl.nativeElement)),
                            distinctUntilChanged((x: any, y: any) => x.top === y.top && x.left === y.left),
                        );
                    }
                    return empty();
                }),
                takeUntil(this.onDestroy))
            .subscribe(p => this.updatePost(p));
    }

    /**
     * @name toggleMenu
     * @desc toggles menu visibility
     */
    public toggleMenu(): void {
        this.state.menuState.isVisible ? this.hide() : this.show();
    }

    /**
     * - hides dropdown
     * @name hide
     */
    public hide(): void {
        this.menu.hide();
        this.onHide.emit(this);
    }

    /**
     * - shows dropdown
     * @name show
     * @param position
     */
    public show(position: ClientRect | ElementRef = this.button.getPosition()): void {

        var menuWidth = 0;
        if (position instanceof ElementRef) {
            this.anchorEl = position;
            menuWidth = (this.anchorEl.nativeElement as HTMLElement).getBoundingClientRect().width;
        }
        this.menu.show(menuWidth);
        this.onShow.emit(this);
    }


    public ngOnInit() {
        this.state.dropdownState.onItemClicked.subscribe(item => {
            this.onItemClicked.emit(item);

            if (item.preventClose) {
                return;
            }

            this.hide.call(this);
        });

        if (this.button) {
            this.button.onMenuToggled.subscribe(() => {
                this.toggleMenu();
            });
        }

        this.state.dropdownState.onItemSelected.subscribe(item => this.onItemSelected.emit(item));
    }

    private updatePost(position) {
        const rect = (this.anchorEl.nativeElement as HTMLElement).getBoundingClientRect();
        this.menu.updatePosition(position, rect.width);
        this.onPositionChanged.emit();
    }
}
