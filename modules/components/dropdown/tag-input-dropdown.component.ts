import {
    Component,
    ContentChildren,
    EventEmitter,
    forwardRef,
    Injector,
    Input,
    QueryList,
    TemplateRef,
    Type,
    ViewChild,
    ElementRef
} from '@angular/core';

// rx
import { Observable } from 'rxjs/Observable';
import { filter, first, debounceTime } from 'rxjs/operators';

import { Ng2Dropdown, Ng2MenuItem } from '../ng2-material-dropdown/ng2-dropdown.module';
import { OptionsProvider } from '../../core/providers/options-provider';
import { TagInputComponent } from '../tag-input/tag-input';
import { TagInputDropdownOptions } from '../../defaults';
import { TagModel } from '../../core/accessor';

const defaults: Type<TagInputDropdownOptions> = forwardRef(() => OptionsProvider.defaults.dropdown);

@Component({
    selector: 'tag-input-dropdown',
    templateUrl: './tag-input-dropdown.template.html'
})
export class TagInputDropdown {
    /**
     * @name dropdown
     */
    @ViewChild(Ng2Dropdown) public dropdown: Ng2Dropdown;

    /**
     * @name menuTemplate
     * @desc reference to the template if provided by the user
     */
    @ContentChildren(TemplateRef) public templates: QueryList<TemplateRef<any>>;

    /**
     * @name offset
     */
    @Input() public offset: string = defaults().offset;

    /**
     * @name focusFirstElement
     */
    @Input() public focusFirstElement = defaults().focusFirstElement;

    /**
     * - show autocomplete dropdown if the value of input is empty
     * @name showDropdownIfEmpty
     */
    @Input() public showDropdownIfEmpty = defaults().showDropdownIfEmpty;

    /**
     * @description observable passed as input which populates the autocomplete items
     * @name autocompleteObservable
     */
    @Input() public autocompleteObservable: (text: string) => Observable<any>;

    /**
     * - desc minimum text length in order to display the autocomplete dropdown
     * @name minimumTextLength
     */
    @Input() public minimumTextLength = defaults().minimumTextLength;

    /**
     * - number of items to display in the autocomplete dropdown
     * @name limitItemsTo
     */
    @Input() public limitItemsTo: number = defaults().limitItemsTo;

    /**
     * @name displayBy
     */
    @Input() public displayBy = defaults().displayBy;

    /**
     * @name identifyBy
     */
    @Input() public identifyBy = defaults().identifyBy;

    /**
     * @description a function a developer can use to implement custom matching for the autocomplete
     * @name matchingFn
     */
    @Input() public matchingFn: (value: string, target: TagModel) => boolean = defaults().matchingFn;

    /**
     * @name appendToBody
     */
    @Input() public appendToBody = defaults().appendToBody;

    /**
     * @name keepOpen
     * @description option to leave dropdown open when adding a new item
     */
    @Input() public keepOpen = defaults().keepOpen;

    /**
     * list of items that match the current value of the input (for autocomplete)
     * @name items
     */
    public items: TagModel[] = [];

    /**
     * @name tagInput
     */
    public tagInput: TagInputComponent = this.injector.get(TagInputComponent);

    /**
     * @name _autocompleteItems
     */
    private _autocompleteItems: TagModel[] = [];

    /**
     * @name autocompleteItems
     * @param items
     */
    public set autocompleteItems(items: TagModel[]) {
        this._autocompleteItems = items;
    }

    /**
     * @name autocompleteItems
     * @desc array of items that will populate the autocomplete
     */
    @Input() public get autocompleteItems(): TagModel[] {
        const items = this._autocompleteItems;

        if (!items) {
            return [];
        }

        return items.map((item: TagModel) => {
            return typeof item === 'string' ? {
                [this.displayBy]: item,
                [this.identifyBy]: item
            } : item;
        });
    }

    /**
   * @name anchor: ElementRef
   */
    @Input() public anchor: ElementRef;

    constructor(private readonly injector: Injector) {}

    /**
     * @name ngOnInit
     */
    public ngOnInit(): void {
        this.onItemClicked().subscribe(this.requestAdding);

        // reset itemsMatching array when the dropdown is hidden
        this.onHide().subscribe(this.resetItems);

        const DEBOUNCE_TIME = 200;
        const KEEP_OPEN = this.keepOpen;

        this.tagInput
        .onTextChange
            .asObservable()
            .pipe(
                debounceTime(DEBOUNCE_TIME),
                filter((value: string) => {
                    if (KEEP_OPEN === false) {
                        return value.length > 0;
                    }

                    return true;
                })
            )
            .subscribe(this.show);

        this.filterAutocomplete();
    }


    /**
     * @name isVisible
     */
    public get isVisible(): boolean {
        return this.dropdown.menu.state.menuState.isVisible;
    }

    /**
     * @name onHide
     */
    public onHide(): EventEmitter<Ng2Dropdown> {
        return this.dropdown.onHide;
    }

    /**
     * @name onItemClicked
     */
    public onItemClicked(): EventEmitter<string> {
        return this.dropdown.onItemClicked;
    }

    /**
     * @name selectedItem
     */
    public get selectedItem(): Ng2MenuItem {
        return this.dropdown.menu.state.dropdownState.selectedItem;
    }

    /**
     * @name state
     */
    public get state(): any {
        return this.dropdown.menu.state;
    }

    @Input() public hideOnBlur = true;

    /**
     *
     * @name show
     */
    public show = (): void => {
        const maxItemsReached = this.tagInput.items.length === this.tagInput.maxItems;
        const value = this.getFormValue();
        const hasMinimumText = value.trim().length >= this.minimumTextLength;
        const items = this.getMatchingItems(value);
        const hasItems = items.length > 0;
        const isHidden = this.isVisible === false;
        const showDropdownIfEmpty = this.showDropdownIfEmpty && hasItems && !value;
        const isDisabled = this.tagInput.disable;
        const assertions = [];

        const shouldShow = isHidden && ((hasItems && hasMinimumText) || showDropdownIfEmpty);
        const shouldHide = this.isVisible && !hasItems;

        if (this.autocompleteObservable && hasMinimumText) {
            return this.getItemsFromObservable(value);
        }

        if ((!this.showDropdownIfEmpty && !value) || maxItemsReached || isDisabled) {
            return this.dropdown.hide();
        }

        this.setItems(items);

        if (shouldShow) {
            this.dropdown.show(this.anchor);
        } else if (shouldHide) {
            this.hide();
        }
    }

    /**
     * @name hide
     */
    public hide(): void {
        this.resetItems();
        this.dropdown.hide();
    }

    /**
     * @name getFormValue
     */
    private getFormValue(): string {
        return this.tagInput.formValue.trim();
    }

    /**
     * @name requestAdding
     * @param item {Ng2MenuItem}
     */
    private requestAdding = (item: Ng2MenuItem): void => {
        this.tagInput.onAddingRequested(true, this.createTagModel(item));
    }

    /**
     * @name createTagModel
     * @param item
     */
    private createTagModel(item: Ng2MenuItem): TagModel {
        const display = typeof item.value === 'string' ? item.value : item.value[this.displayBy];
        const value = typeof item.value === 'string' ? item.value : item.value[this.identifyBy];

        return {
            ...item.value,
            [this.tagInput.displayBy]: display,
            [this.tagInput.identifyBy]: value
        };
    }

    /**
     *
     * @param value {string}
     */
    private getMatchingItems(value: string): TagModel[] {
        if (!value && !this.showDropdownIfEmpty) {
            return [];
        }

        const dupesAllowed = this.tagInput.allowDupes;

        return this.autocompleteItems.filter((item: TagModel) => {
            const hasValue: boolean = dupesAllowed ? false : this.tagInput.tags.some(tag => {
                const identifyBy = this.tagInput.identifyBy;
                const model = typeof tag.model === 'string' ? tag.model : tag.model[identifyBy];

                return model === item[this.identifyBy];
            });

            return this.matchingFn(value, item) && (hasValue === false);
        });
    }

    /**
     * @name setItems
     */
    private setItems(items: TagModel[]): void {
        this.items = items.slice(0, this.limitItemsTo || items.length);
    }

    /**
     * @name resetItems
     */
    private resetItems = (): void => {
        this.items = [];
    }

    /**
     * @name populateItems
     * @param data
     */
    private populateItems(data: any): TagInputDropdown {
        this.autocompleteItems = data.map(item => {
            return typeof item === 'string' ? {
                [this.displayBy]: item,
                [this.identifyBy]: item
            } : item;
        });
        this.filterAutocomplete();

        return this;
    }

    /**
     * @name getItemsFromObservable
     * @param text
     */
    private getItemsFromObservable = (text: string): void => {
        this.setLoadingState(true);

        const subscribeFn = (data: any[]) => {
            // hide loading animation
            this.setLoadingState(false)
                // add items
                .populateItems(data);

            this.setItems(this.getMatchingItems(text));

            if (this.items.length) {
                this.dropdown.show(this.anchor);
            } else if (!this.showDropdownIfEmpty && this.isVisible) {
                this.dropdown.hide();
            } else if (!this.showDropdownIfEmpty) {
                this.dropdown.hide();
            }
        };

        this.autocompleteObservable(text)
            .pipe(
                filter(() => !this.tagInput.disable),
                first()
            )
            .subscribe(subscribeFn, () => this.setLoadingState(false));
    }

    /**
     * @name setLoadingState
     * @param state
     */
    private setLoadingState(state: boolean): TagInputDropdown {
        this.tagInput.isLoading = state;

        return this;
    }

    /**
     * Get display value of item base on its type
     *
     * @param {TagModel} item
     * @returns {string}
     * @memberof TagInputDropdown
     */
    public getDisplayValue(item: TagModel): string {
        if (typeof item === 'string') {
            return item;
        }

        if (!item[this.displayBy]) {
            if (!!item[this.identifyBy]) {
                return item[this.identifyBy];
            }
            return '';
        }

        if (this.tagInput.withCode) {
            return `${item[this.identifyBy]} : ${item[this.displayBy]}`;
        } else {
            return item[this.displayBy];
        }
    }

    /**
     * Filter autocomplete list
     * Remove all items that
     *  - item[this.identifyBy] is undefined
     *  - item[this.identifyBy] AND item[this.displayBy] are undefined
     *
     * @private
     * @memberof TagInputDropdown
     */
    private filterAutocomplete() {
        this.autocompleteItems = this.autocompleteItems
            .map(item => {
                if (typeof item === 'string') {
                    return item;
                } else if (!item[this.identifyBy]) {
                    // Set both indentifyBy and displayBy values
                    // to undefined to filter later
                    return {
                        [this.identifyBy]: item[this.identifyBy],
                        [this.displayBy]: item[this.identifyBy]
                    };
                } else {
                    return item;
                }
            })
            .filter(item => {
                if (!item[this.identifyBy] && !item[this.displayBy]) {
                    return false;
                }
                return true;
            });
    }
}
