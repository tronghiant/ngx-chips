import {
    Component,
    ElementRef,
    Renderer,
    ContentChildren,
    QueryList,
    Input,
    trigger,
    style,
    transition,
    animate,
    keyframes,
    state
} from '@angular/core';

import { ACTIONS, arrowKeysHandler } from './actions';

import { Ng2MenuItem } from '../menu-item/ng2-menu-item';
import { DropdownStateService } from '../../services/dropdown-state.service';
import { ViewportRuler } from '../../services/viewport-ruler';

const noop: Function = () => {};

@Component({
    selector: 'ng2-dropdown-menu',
    styleUrls: [ './style.scss' ],
    templateUrl: './template.html',
    animations: [
        trigger('fade', [
            state('visible', style(
                {display: 'block', height: '*', width: '*'}
            )),
            state('hidden', style(
                {display: 'none', overflow: 'hidden', height: 0, width: 0}
            )),
            transition('hidden => visible', [
                animate('250ms ease-in', keyframes([
                    style({opacity: 0, offset: 0}),
                    style({opacity: 1, offset: 1, height: '*', width: '*'}),
                ]))
            ]),
            transition('visible => hidden', [
                animate('350ms ease-out', keyframes([
                    style({opacity: 1, offset: 0}),
                    style({opacity: 0, offset: 1, width: '0', height: '0'}),
                ]))
            ])
        ]),
        trigger('opacity', [
            transition('hidden => visible', [
                animate('450ms ease-in', keyframes([
                    style({opacity: 0, offset: 0}),
                    style({opacity: 1, offset: 1}),
                ]))
            ]),
            transition('visible => hidden', [
                animate('250ms ease-out', keyframes([
                    style({opacity: 1, offset: 0}),
                    style({opacity: 0.5, offset: 0.3}),
                    style({opacity: 0, offset: 1}),
                ]))
            ])
        ])
    ]
})
export class Ng2DropdownMenu {
    /**
     * @name width
     * @type {number} [2, 4, 6]
     */
    @Input() public width = 4;

    /**
     * @description if set to true, the first element of the dropdown will be automatically focused
     * @name focusFirstElement
     * @type {boolean}
     */
    @Input() public focusFirstElement = true;

    /**
     * @description sets dropdown offset from the button
     * @name offset {string} follow format '<number> <number>' ex. '0 20'
     */
    @Input() public offset: string;

    public get offsetX(): number {
        if (!this.offset) {
            return 0;
        }
        const v = this.offset.split(' ', 2).shift();
        return parseInt(v!.replace('px', ''), 10);
    }

    public get offsetY(): number {
        if (!this.offset || this.offset.indexOf(' ') === -1) {
            return 0;
        }
        const v = this.offset.split(' ', 2).pop();
        return parseInt(v!.replace('px', ''), 10);
    }

    /**
     * @name appendToBody
     * @type {boolean}
     */
    @Input() public appendToBody = true;

    /**
     * @name items
     * @type {QueryList<Ng2MenuItem>}
     */
    @ContentChildren(Ng2MenuItem) public items: QueryList<Ng2MenuItem>;


    private listeners = {
        arrowHandler: noop,
        handleKeypress: noop
    };

    constructor(public state: DropdownStateService,
                private element: ElementRef,
                private viewportRuler: ViewportRuler,
                private renderer: Renderer) {}

    /**
     * @name show
     * @shows menu and selects first item
     */
    public show(width = 0): void {
        // update state
        this.state.menuState.isVisible = true;

        const element = this.getMenuElement();

        if (width > 0) {
            this.renderer.setElementStyle(element, 'width', `${width}px`);
        }
        // setting handlers
        this.listeners.handleKeypress = this.renderer.listen(document!.body, 'keydown', this.handleKeypress.bind(this));
        this.listeners.arrowHandler = this.renderer.listen(window, 'keydown', arrowKeysHandler);
    }

    /**
     * @name hide
     * @desc hides menu
     */
    public hide(): void {
        this.state.menuState.isVisible = false;

        // reset selected item state
        this.state.dropdownState.unselect();

        // call function to unlisten
        this.listeners.arrowHandler();
        this.listeners.handleKeypress();
    }

    /**
     * @name updatePosition
     * @desc updates the menu position every time it is toggled
     * @param position {ClientRect}
     */
    public updatePosition(position: ClientRect, width = 0): void {

        const element = this.getMenuElement();

        if (position) {
            this.renderer.setElementStyle(element, 'top', position.top + '');
            this.renderer.setElementStyle(element, 'left', position.left + '');
        }

        if (width > 0) {
            this.renderer.setElementStyle(element, 'width', `${width}px`);
        }
    }

    /**
     * @name handleKeypress
     * @desc executes functions on keyPress based on the key pressed
     * @param $event
     */
    public handleKeypress($event): void {
        const key = $event.keyCode;
        const items = this.items.toArray();
        const index = items.indexOf(this.state.dropdownState.selectedItem);

        if (!ACTIONS.hasOwnProperty(key)) {
            return;
        }

        ACTIONS[key].call(this, index, items, this.state.dropdownState);
    }

    /**
     * @name getMenuElement
     * @returns {Element}
     */
    private getMenuElement(): Element {
        return this.element.nativeElement.children[0];
    }

    /**
     * @name getBackdropElement
     * @returns {Element}
     */
    public getBackdropElement(): Element {
        return this.element.nativeElement.children[1];
    }

    /**
     * @name calcPositionOffset
     * @param rect
     * @returns {{top: string, left: string}}
     */
    public calcPositionOffset(rect, anchor: HTMLElement): { top: string, left: string } {

        const vRect = this.viewportRuler.getViewportRect();

        const top = (this.appendToBody ? vRect.top : 0) + rect.top;
        const left = (this.appendToBody ? vRect.left : 0) + rect.left;
        const menuHeight = (this.getMenuElement() as HTMLElement).offsetHeight;
        const menuWidth =
         anchor ? anchor.getBoundingClientRect().width : (this.getMenuElement() as HTMLElement).offsetWidth;

        let topPx;
        let leftPx;


        // Available space at the top and bottom
        const topAvailable = rect.top - this.offsetY;
        const bottomAvailable = vRect.height - (rect.bottom + this.offsetY);

        if (
            rect.bottom + this.offsetY + menuHeight > vRect.height &&
            bottomAvailable < topAvailable
        ) {
            // NOTE: 上に表示
            topPx = `${top - menuHeight - this.offsetY}px`;
        } else {
            // NOTE: 下に表示
            topPx = `${top + rect.height + this.offsetY}px`;
        }

        if (rect.right + this.offsetX + menuWidth > vRect.width) {
            // 右にはみ出す => 右寄せ表示
            leftPx = `${left + rect.width - menuWidth - this.offsetX}px`;
        } else {
            // その他、左寄せ表示
            leftPx = `${left + this.offsetX}px`;
        }

        return {
            top: topPx,
            left: leftPx
        };
    }

    public ngOnInit() {
        if (this.appendToBody) {
            // append menu element to the body
            document!.body!.appendChild(this.element.nativeElement);
        }
    }

    public ngDoCheck() {
        if (this.state.menuState.isVisible) {
            // select first item unless user disabled this option
            if (this.focusFirstElement &&
                this.items.first &&
                !this.state.dropdownState.selectedItem) {
                this.state.dropdownState.select(this.items.first, false);
            }
        }
    }

    public ngOnDestroy() {
        const elem = this.element.nativeElement;
        elem.parentNode.removeChild(elem);

        if (this.listeners.handleKeypress) {
            this.listeners.handleKeypress();
        }
    }
}
