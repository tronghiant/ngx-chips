import { ControlValueAccessor } from '@angular/forms';
import { Input } from '@angular/core';
import { OptionsProvider } from './providers/options-provider';

export class TagModelClass {
    [key: string]: any;
}

export type TagModel = string | TagModelClass;

export function isObject(obj: any): boolean {
    return obj === Object(obj);
}

export class TagInputAccessor implements ControlValueAccessor {
    private _items: TagModel[] = [];
    private _onTouchedCallback: () => void;
    private _onChangeCallback: (items: TagModel[]) => void;

    /**
     * @name displayBy
     */
    @Input() public displayBy: string = OptionsProvider.defaults.tagInput.displayBy;

    /**
     * @name identifyBy
     */
    @Input() public identifyBy: string = OptionsProvider.defaults.tagInput.identifyBy;

    /**
     * Flag to toggle displaying the value of identifyBy or not.
     * If true, display item as <identifyBy>: <displayBy>
     * Else display item as <displayBy>
     *
     * @type {boolean}
     * @memberof TagInputAccessor
     */
    @Input() public withCode: boolean = OptionsProvider.defaults.tagInput.withCode;

    public get items(): TagModel[] {
        return this._items;
    };

    public set items(items: TagModel[]) {
        this._items = items;
        this._onChangeCallback(this._items);
    }

    public onTouched() {
        this._onTouchedCallback();
    }

    public writeValue(items: any[]) {
        if (!items || items.length === 0) {
            this._items = [];
        } else {
            this._items = this.filterItems(items);
        }
    }

    public registerOnChange(fn: any) {
        this._onChangeCallback = fn;
    }

    public registerOnTouched(fn: any) {
        this._onTouchedCallback = fn;
    }

    /**
     * @name getItemValue
     * @param item
     */
    public getItemValue(item: TagModel): string {
        return isObject(item) ? item[this.identifyBy] : item;
    }

    /**
     * @name getItemDisplay
     * @param item
     */
    public getItemDisplay(item: TagModel): string {
        if (isObject(item)) {
            if (!item[this.displayBy]) {
                if (!item[this.identifyBy]) {
                    return '';
                }
                return item[this.identifyBy];
            }
            return item[this.displayBy];
        }
        return item.toString();
    }

    /**
     * @name getItemsWithout
     * @param index
     */
    protected getItemsWithout(index: number): TagModel[] {
        return this.items.filter((item, position) => position !== index);
    }

    /**
     * Filter list of items
     * Remove all items that
     *  - item[this.identifyBy] is undefined
     *  - item[this.identifyBy] AND item[this.displayBy] are undefined
     *
     * @private
     * @param {any[]} items
     * @returns
     * @memberof TagInputAccessor
     */
    private filterItems(items: any[]) {
        return items
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
