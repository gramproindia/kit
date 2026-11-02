import type { ComponentType } from "react";
import { AccordionDemo } from "../../demos/AccordionDemo";
import { AlertDemo } from "../../demos/AlertDemo";
import { AppBarDemo } from "../../demos/AppBarDemo";
import { AvatarDemo } from "../../demos/AvatarDemo";
import { BadgeDemo } from "../../demos/BadgeDemo";
import { BottomNavigationDemo } from "../../demos/BottomNavigationDemo";
import { BottomSheetDemo } from "../../demos/BottomSheetDemo";
import { BreadcrumbDemo } from "../../demos/BreadcrumbDemo";
import { ButtonDemo } from "../../demos/ButtonDemo";
import { CardDemo } from "../../demos/CardDemo";
import { CheckboxDemo } from "../../demos/CheckboxDemo";
import { ComboboxDemo } from "../../demos/ComboboxDemo";
import { DatePickerDemo } from "../../demos/DatePickerDemo";
import { DialogDemo } from "../../demos/DialogDemo";
import { FabDemo } from "../../demos/FabDemo";
import { FileUploaderDemo } from "../../demos/FileUploaderDemo";
import { InputDemo } from "../../demos/InputDemo";
import { ListItemDemo } from "../../demos/ListItemDemo";
import { MenuDemo } from "../../demos/MenuDemo";
import { ModalDemo } from "../../demos/ModalDemo";
import { NumberInputDemo } from "../../demos/NumberInputDemo";
import { OverlayDemo } from "../../demos/OverlayDemo";
import { PopoverDemo } from "../../demos/PopoverDemo";
import { ProgressDemo } from "../../demos/ProgressDemo";
import { RadioGroupDemo } from "../../demos/RadioGroupDemo";
import { SearchBarDemo } from "../../demos/SearchBarDemo";
import { SegmentedControlDemo } from "../../demos/SegmentedControlDemo";
import { SkeletonDemo } from "../../demos/SkeletonDemo";
import { SpinnerDemo } from "../../demos/SpinnerDemo";
import { SwitchDemo } from "../../demos/SwitchDemo";
import { TabsDemo } from "../../demos/TabsDemo";
import { TextareaDemo } from "../../demos/TextareaDemo";
import { ToasterDemo } from "../../demos/ToasterDemo";
import { TooltipDemo } from "../../demos/TooltipDemo";

export interface CatalogEntry {
  id: string;
  name: string;
  group: string;
  description: string;
  demos: ComponentType[];
  /** The demo mounts its own Toaster or DialogHost; the root ones step aside. */
  ownHosts?: boolean;
  /** Mobile-only (source/native) rather than cross-platform. */
  mobileOnly?: boolean;
}

const entry = (
  name: string,
  group: string,
  description: string,
  demos: ComponentType[],
  extra: Partial<CatalogEntry> = {},
): CatalogEntry => ({ id: name.toLowerCase().replace(/[^a-z]+/g, "-"), name, group, description, demos, ...extra });

export const GROUP_ORDER = ["Mobile", "Actions", "Forms", "Pickers", "Overlays", "Display", "Feedback"];

export const CATALOG: CatalogEntry[] = [
  entry("AppBar", "Mobile", "Top bar: title, back, actions, large titles", [AppBarDemo], { mobileOnly: true }),
  entry("BottomNavigation", "Mobile", "Tab bar with badges and an active pill", [BottomNavigationDemo], { mobileOnly: true }),
  entry("Fab & SpeedDial", "Mobile", "Floating action buttons", [FabDemo], { mobileOnly: true }),
  entry("SegmentedControl", "Mobile", "iOS thumb or Material check segments", [SegmentedControlDemo], { mobileOnly: true }),
  entry("SearchBar", "Mobile", "Debounced search with Cancel", [SearchBarDemo], { mobileOnly: true }),
  entry("List & ListItem", "Mobile", "Settings and inbox rows", [ListItemDemo], { mobileOnly: true }),
  entry("BottomSheet", "Mobile", "Draggable sheet with a footer", [BottomSheetDemo], { mobileOnly: true }),
  entry("Button", "Actions", "Variants, sizes, icons, async loading", [ButtonDemo]),
  entry("Badge & Tag", "Actions", "Status labels, counts, removable tags", [BadgeDemo]),
  entry("Input & OtpInput", "Forms", "Text fields and one-time codes", [InputDemo]),
  entry("NumberInput", "Forms", "Locale-aware numbers and currency", [NumberInputDemo]),
  entry("Textarea", "Forms", "Multi-line text, auto-resize, counter", [TextareaDemo]),
  entry("Checkbox", "Forms", "Checkboxes and groups with select-all", [CheckboxDemo]),
  entry("RadioGroup", "Forms", "Options and selectable cards", [RadioGroupDemo]),
  entry("Switch", "Forms", "Toggles, async save, settings rows", [SwitchDemo]),
  entry("FileUploader", "Forms", "Pick, validate, upload with progress", [FileUploaderDemo]),
  entry("Select & MultiSelect", "Pickers", "Searchable lists in a sheet", [ComboboxDemo]),
  entry("DatePicker", "Pickers", "Dates, ranges and date-times", [DatePickerDemo]),
  entry("Toaster", "Overlays", "Toasts with actions and promises", [ToasterDemo], { ownHosts: true }),
  entry("Dialog", "Overlays", "Alert, confirm and prompt", [DialogDemo], { ownHosts: true }),
  entry("Modal", "Overlays", "Centre, drawers, bottom sheet, full screen", [ModalDemo]),
  entry("Menu", "Overlays", "Action sheets and nested menus", [MenuDemo]),
  entry("Popover", "Overlays", "Anchored panels", [PopoverDemo]),
  entry("Tooltip", "Overlays", "Long-press hints", [TooltipDemo]),
  entry("Overlay primitives", "Overlays", "Sheet and Anchored, the shared layer", [OverlayDemo]),
  entry("Tabs", "Display", "Line and pill tabs", [TabsDemo]),
  entry("Accordion", "Display", "Collapsible sections", [AccordionDemo]),
  entry("Card & Stat", "Display", "Surfaces and metrics", [CardDemo]),
  entry("Avatar", "Display", "Initials, images, status, groups", [AvatarDemo]),
  entry("Alert", "Display", "Inline messages", [AlertDemo]),
  entry("Breadcrumb", "Display", "Collapsing trails", [BreadcrumbDemo]),
  entry("Progress", "Feedback", "Bars and rings", [ProgressDemo]),
  entry("Spinner", "Feedback", "Loading indicators", [SpinnerDemo]),
  entry("Skeleton & Empty", "Feedback", "Placeholders and empty states", [SkeletonDemo]),
];
