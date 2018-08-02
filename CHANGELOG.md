## 1.7.14 - 2018-08-02
- Feature: allow user to toggle displaying `<identifyBy>:<displayBy>` format.
    - By default this is off (display only the value of `<displayBy>`). Add `withCode="true"` to enable this feature.
- doc: add demonstration for this feature.

## 1.7.13 - 2018-07-30
- fix: supplementary fix for [v1.7.12](#1.7.12\ -\ 2018-07-26): handle items with undefined key/value that passed from form.
- doc: add demonstration for the case items with undefined key/value passed from form.

## 1.7.12 - 2018-07-26
- feat: handle items whose `displayBy` and/or `identifyBy` value is undefined
    - TagInputDropdown, Tag, TagInputAccessor: Update display value getter
    - Default options: update matching function to handle such special items

## 1.7.11 - 2018-07-17
- feat: display format of tag and menu item now is `<identifyBy>:<displayBy>`

## 1.7.10 - 2018-07-13
- Fix: dropdown sometime does not shown when tap on the input

## 1.7.9 - 2018-07-03
- Fix: tag input does not hide when max items reached on ie10

## 1.7.8 - 2018-06-26
- fix AOT compile error

## 1.7.6 - 2018-06-25
- re-calc menu pos when items count change
- tag-input-dropdown now doesn't animate width/height when show/hide

## 1.7.5 - 2018-06-21
- Update dropdown's position calculation logic. Ng2Dropdown now handle this job in the more effectively way. tag-input now don't have always to listen to scroll event as it should be (there is use-case that It does not own a dropdown)

- When showDropdownIfEmpty= true Dropdown now got shown when user click on tag-input element instead of user have to clicking exactly on the the html input element

## 1.7.4 - 2018-06-20
- better handle position of dropdown-menu (don't cover the input)

## 1.7.3 - 2018-03-27
- Sync a lot of fix from [Gbuomprisco/ngx-chips](https://github.com/Gbuomprisco/ngx-chips)

## 1.6.9 - 2018-03-26
- Fix: should not show dropdown & progress bar while being disabled

## 1.6.8 - 2018-03-26
- Fix https://github.com/Gbuomprisco/ngx-chips/issues/620#issuecomment-351367934

## 1.6.7 - 2018-03-16
- Make ngx-chip works with Angular 4.x

## 1.2.9

### Breaking Changes
- `readonly` is not part of the inputs, and is now a property that needs to be added to each tag in order to make it readonly

### Bug fixes
- removing tag should not trigger `onSelect`
- OnRemoving does not trigger by backspace and drag remove
- Added max-width for very long tags, and ellipsis at the end

## 1.2.3

### Features
- Added `onAdding` and `onRemoving` hooks

### Maintenance
- removed `Renderer`

## 1.1.5-beta.0

### Features
- Added `dropZone` attribute to drag and drop tags

### Demo
- Fixed missing animations module

## 0.7.0

### Breaking changes
- The autocomplete properties `autocompleteItems` and `showDropdownIfEmpty` are now part of the `tag-input-dropdown`
component instead.

### Refactoring
- Lots of code moved around and refactored

## 0.4.8

### Bug Fixes
- Custom theme's style is back

### Improvements
- Custom theme now uses <template> - lots of duplicate code removed as a result
