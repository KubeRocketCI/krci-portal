// Self-hosted replacements for the Google Fonts links index.html used to carry.
// Family names match the stacks in tailwind.css, Terminal and LogViewer verbatim.
// Covers every weight the app renders today. The old links also requested Roboto
// 100/900 and IBM Plex Mono 100/200/300; nothing uses them, so they are not bundled
// and a future caller reaching for one gets a synthesized face until it is added.
// Roboto 600 was absent from those links too, so font-semibold stays synthesized.
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/300-italic.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/400-italic.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/500-italic.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto/700-italic.css";

import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/400-italic.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/500-italic.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-mono/600-italic.css";
import "@fontsource/ibm-plex-mono/700.css";
import "@fontsource/ibm-plex-mono/700-italic.css";
