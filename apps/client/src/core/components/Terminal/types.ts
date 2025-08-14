import { Terminal as XTerminal, ITerminalOptions } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { WebLinksAddon } from "@xterm/addon-web-links";

export interface TerminalTheme {
  background?: string;
  foreground?: string;
  cursor?: string;
  selectionBackground?: string;
  selectionForeground?: string;
  black?: string;
  red?: string;
  green?: string;
  yellow?: string;
  blue?: string;
  magenta?: string;
  cyan?: string;
  white?: string;
  brightBlack?: string;
  brightRed?: string;
  brightGreen?: string;
  brightYellow?: string;
  brightBlue?: string;
  brightMagenta?: string;
  brightCyan?: string;
  brightWhite?: string;
}

export interface TerminalProps {
  /** Content to display in the terminal */
  content?: string;
  /** Height of the terminal component */
  height?: number;
  /** Enable search functionality */
  enableSearch?: boolean;
  /** Enable web links functionality */
  enableWebLinks?: boolean;
  /** Terminal theme configuration */
  theme?: TerminalTheme;
  /** Additional xterm.js options */
  options?: Partial<ITerminalOptions>;
  /** Callback when data is entered */
  onData?: (data: string) => void;
  /** Callback when terminal is resized */
  onResize?: (size: { cols: number; rows: number }) => void;
  /** Callback for custom key handling */
  onKeyDown?: (event: KeyboardEvent) => boolean;
  /** CSS class name */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Make terminal readonly (no input) */
  readonly?: boolean;
  /** Enable download functionality */
  enableDownload?: boolean;
  /** Enable copy functionality */
  enableCopy?: boolean;
  /** Custom filename for downloads */
  downloadFilename?: string;
  /** Show action toolbar */
  showToolbar?: boolean;
}

export interface TerminalRef {
  /** Get the underlying xterm.js terminal instance */
  getTerminal: () => XTerminal | null;
  /** Get the fit addon instance */
  getFitAddon: () => FitAddon | null;
  /** Get the search addon instance */
  getSearchAddon: () => SearchAddon | null;
  /** Get the web links addon instance */
  getWebLinksAddon: () => WebLinksAddon | null;
  /** Clear the terminal */
  clear: () => void;
  /** Write data to terminal */
  write: (data: string) => void;
  /** Write line to terminal */
  writeln: (data: string) => void;
  /** Scroll to bottom */
  scrollToBottom: () => void;
  /** Fit terminal to container */
  fit: () => void;
  /** Focus the terminal */
  focus: () => void;
  /** Select all content */
  selectAll: () => void;
  /** Get current selection */
  getSelection: () => string;
  /** Clear current selection */
  clearSelection: () => void;
}
