# Agent-native Kit Native: research and phased design

Status: **research and proposal. Nothing here is implemented.** Written
2026-11-03 against React Native 0.88 and Expo SDK 58.

Each claim is marked one of three ways:
- *established*: carries a source; dates are the source's own date.
- *proposed*: our design choice.
- **[unconfirmed]**: rests only on secondary sources, or the primary source could not be checked.

This document extends `docs/react-native.md` § 3.7 and `docs/agent-native-architecture.md` § 5 and § 9.

## TL;DR

- **No mobile OS lets an app register tools at runtime the way WebMCP does.**
  - **iOS:** App Intents are static Swift types extracted at build time. Siri AI was announced at WWDC26 and acts only through declared intents in Apple's schema domains. There is no general-purpose "fill this form" schema.
  - **Android:** AppFunctions reached `1.0.0-beta01` on 2026-10-21. Since alpha11 it can bind *handlers* at runtime, scoped to the visible Activity, which is close to WebMCP's model. The *schema* is still generated at compile time, the runtime-handler API needs API 37, and Gemini's use of AppFunctions is still a private or early preview.
  - **Both need native code.** Neither works in Expo Go.
- **The channel that works today, in Expo Go, is the in-app assistant.** Three existing tool shapes can each call a JS-registered tool on the device:
  - CopilotKit's `@copilotkit/react-native` with `useFrontendTool`, which is an AG-UI client;
  - Vercel AI SDK client-side tools, run through `expo/fetch`;
  - `expo-ai`'s on-device tool calling (dev build only).

  Kit's `describe`/`operate` contract maps onto all three with no changes.
- **The channel coding agents use today is dev-time automation.** Expo MCP's local tools (`automation_tap`, `automation_find_view`), appium-mcp, mobile-mcp and Maestro MCP all target **testID and the accessibility tree**.
  - Kit Native components that do not forward `testID` are invisible to this channel. In this repo's `*/native` folders, `testID` appears in **zero** files today.
- **Prior art:** no React Native, SwiftUI or Compose component library ships per-component machine-readable contracts, a validator and undo for *runtime* agents. Existing "agent" UI products fall into two groups:
  - chat and generative-UI renderers: CopilotKit, assistant-ui, Tambo, Hashbrown, Thesys, A2UI;
  - code-generation MCP servers: shadcn MCP, gluestack MCP.

  That leaves the space open.
- **Recommendation**, *proposed*. Five phases, each shippable on its own:
  - **N0:** a11y and testID hygiene.
  - **N1:** native `AgentSurface` plus state-based executors, zero dependencies.
  - **N2:** in-app assistant recipes as documentation and examples, not dependencies.
  - **N3:** a dev-only debug bridge from `AgentSurface` to an MCP server on the developer's machine. Pure JS on the device, works in Expo Go.
  - **N4:** an optional, separately versioned Expo module for AppFunctions and App Intents, gated on platform maturity.

  N0 to N3 keep every current rule. Only N4 touches native code, and it never enters the copy-in core.

---

## 1. OS-level agent entry points

### 1.1 iOS

**App Intents in iOS 26 (WWDC25).** *Established* (WWDC25 session 275, June 2025):
- Interactive snippets: `SnippetIntent`, plus `requestConfirmation(actionName:snippetIntent:)`.
- Visual Intelligence search, via `IntentValueQuery` and `@AppIntent(schema: .visualIntelligence.semanticContentSearch)`. The session says this macro "replaces the `AssistantIntent` macro".
- **Onscreen entities:** `NSUserActivity.appEntityIdentifier` plus `Transferable`, so Siri and ChatGPT can reason about what is on screen.
- Also: `AppIntentsPackage`, `supportedModes` (background or foreground), `IndexedEntity`, `UndoableIntent` and `requestChoice`.

**Siri AI timeline.** *Established:*
- **2026-01-12:** Apple and Google said in a joint statement that the next Apple Foundation Models will be based on Gemini, to power "a more personalized Siri coming this year" (Daring Fireball and The Register, 2026-01-12).
- **2026-03-24:** iOS 26.4 shipped without the new Siri (MacRumors 2026-02-17; Washington Times 2026-03-24).
- **2026-06-08, WWDC26:** Apple announced **Siri AI**, with personal context, onscreen awareness, and actions inside and across apps. A user beta is due "later this year", English only, and not initially in the EU on iOS or in China (Apple Newsroom, 2026-06-08).
- **[unconfirmed]** Whether the user beta has shipped as of 2026-11-03.

**How apps plug into Siri AI (iOS 27).** *Established* (Apple Newsroom 2026-06-08; WWDC26 Apple Intelligence guide; session 240):
- App Intents is the integration point.
- What used to be called assistant schemas are now **App Schemas**. There are entity schemas, such as `@AppEntity(schema: .messages.message)`, and intent schemas, grouped by domain (messages, mail, photos, task management and others).
- **View Annotations** use `.appEntityIdentifier(...)` on list rows to describe several on-screen items. `NSUserActivity` covers the single primary item.
- A new framework, `AppIntentsTesting`, supports testing.
- Expo's App Intents docs say only "primary schema domains are discoverable by Siri and Apple Intelligence".
- **There is no generic form-fill domain.**

**MCP on Apple platforms.**
- *Established:* at WWDC26 Apple announced MCP and Agent Client Protocol support for **Xcode 27** agents and plug-ins (Apple Newsroom, 2026-06-08).
- In September 2025, code in the iOS/macOS 26.1 beta suggested groundwork for MCP inside App Intents. That was a code finding, not an announcement (9to5Mac, 2025-09-22).
- **[unconfirmed]** We found no Apple source saying App Intents are exposed over MCP to third-party agents in iOS 27 or macOS 27.

**Foundation Models.** *Established:*
- **iOS 26:** an on-device LLM with a `Tool` protocol (`@Generable` arguments, `call(arguments:)`).
- **iOS 27** (WWDC26 session 241):
  - a `LanguageModel` protocol, implemented by on-device, Private Cloud Compute, Core AI and MLX models, plus Swift packages from Anthropic and Google;
  - `LanguageModelSession.DynamicProfile`, which swaps tools and instructions at runtime;
  - built-in `OCRTool` and `BarcodeReaderTool`.

  This is the nearest Apple equivalent to "tools registered at runtime", but the tools belong to the app's *own* session, not to Siri.

### 1.2 Android

**AppFunctions (`androidx.appfunctions`).** *Established* (Jetpack release notes; developer.android.com/ai/appfunctions):

- **Releases:**
  - alpha01: 2025-05-07.
  - alpha13: 2026-10-07. Renamed `@AppFunction` to `@AppFunctionDeclaration`.
  - **1.0.0-beta01: 2026-10-21.** Renamed app "description" to "instructions" "to align with MCP naming conventions".
- **How it works:**
  - KSP generates an XML schema that the OS indexes.
  - Functions are served by an `AppFunctionService`.
  - KDoc becomes the description the model reads.
- **Who can call:** callers need `EXECUTE_APP_FUNCTIONS`, and there is now also `EXECUTE_APP_FUNCTIONS_TRUSTED`. The platform API needs SDK 36 or higher, or SDK 34 with the extension library.
- **How Google frames it:** "Android MCP". Apps "behave like on device MCP servers".
- **Status:** marked Experimental. "As of May 2026, AppFunctions integration with Gemini is in a private preview with trusted testers."
- **Android Dev Summit, 2026-10-28:** "AppFunctions is now in beta", plus a *Connected Apps Platform* preview for registering Android MCP or remote MCP tools for Gemini.
- **Runtime registration** (alpha11 and alpha12, 2026-08-26 and 2026-09-23; now in beta01):
  - `@AppFunctionSignature` together with `registerAppFunction(s)` / `handleAppFunction(s)`. These are `@ExperimentalAppFunctionsApi` and `@RequiresApi(37)`.
  - `SCOPE_ACTIVITY` binds a handler to the visible Activity. The docs recommend registering it between `onResume` and `onPause`.
  - **The signature must still be declared at compile time.** Registering an undeclared ID throws.

**Gemini acting in apps.** *Established:*
- **"The Intelligent OS"** (Android Developers Blog, 2026-02-25):
  - AppFunctions in Gemini on the Galaxy S26.
  - A UI-automation framework that **needs no developer code**. It is in beta in the Gemini app for a curated set of food, grocery and rideshare apps, in the US and Korea.
- **Gemini 2.5 Computer Use** (2025-10-07) works from screenshots. It is optimised for browsers and described as "promising" for mobile.
- **Android 17** was released on 2026-06-16.
- **Google I/O 2026** (2026-05-26) added:
  - Gemini Nano 4 through the AICore Developer Preview;
  - A2UI;
  - ADK for Android.
- **Android Dev Summit** (2026-10-28) added:
  - an A2UI Compose renderer in alpha;
  - an ML Kit "Agentic API" on Gemini Nano 4 in alpha.
- **[unconfirmed]** No developer-facing API for the UI-automation framework has been published.

**Accessibility services as agents.** *Established:* Google Play policy says the Accessibility API may not be used for "an app that autonomously initiates, plans, and executes actions or decisions" (Play Console Help 16585319, page undated). **[unconfirmed]** Secondary sources say the rule took effect in January 2026.
- This shuts out third-party a11y-service agents on Play.
- It does not affect test-time automation such as UIAutomator or Appium.

### 1.3 Is anything like WebMCP?

*Established*, summarised:

| | Schema defined | Discovered via | Executed by | Runtime registration |
|---|---|---|---|---|
| WebMCP (`document.modelContext`) | page JS, at runtime | the page | page JS | yes |
| Android AppFunctions | compile time (KSP to XML) | OS index | `AppFunctionService`, or Activity-scoped handlers (API 37) | handlers only |
| iOS App Intents | build time (Swift types) | system metadata | `perform()`, in the background or with the app foregrounded | no; only entity *data* (queries, indexed entities, view annotations) |

*Proposed reading:*
- AppFunctions' `SCOPE_ACTIVITY` handlers are the closest mobile analogue to WebMCP's "tools of the current page".
- A generic signature taking `operate_page(target, intents)` could be declared once and bound to whichever screen is visible, but this needs API 37.
- iOS has no such route: Siri decides what is callable from Apple's own schemas.

### 1.4 Reaching these from React Native / Expo

*Established:*

- **`expo-app-intents`** is official but alpha (Expo blog 2026-10-19; SDK 58 docs, about 0.5.15):
  - Not in Expo Go.
  - Intents and entities are written **in Swift**, in an `app-intents/` folder, through a config plugin.
  - `perform()` queues the invocation natively (up to 100) and returns *without waiting for JS*. JS receives it at least once through `useAppIntents()`. `openAppWhenRun` brings the app forward.
  - `setEntityCatalogAsync()` publishes entities from JS.
  - `AppEntityView` / `appEntityIdentifier()` handle on-screen entities.
  - `isAvailable()` returns `false` on Android, which means **no AppFunctions support**.
  - The docs state: "JavaScript cannot create those declarations at runtime."
- **Other iOS packages:**
  - `@bacons/apple-targets` has an `app-intent` target and is described as "highly experimental".
  - `@avasapp/react-native-app-intents` is early-stage.
  - `react-native-siri-shortcut` covers only the old Shortcuts API.
- **AppFunctions for React Native:** **no library found.** It would take a custom Expo module with Kotlin, a KSP-generated schema, and a service that bridges into JS.
  - **[unconfirmed]** Whether a headless JS task can answer a call while the app is cold.
- **On-device models from React Native.** All of these need a dev build; none run in Expo Go.
  - Callstack `react-native-ai`: `@react-native-ai/apple` for Foundation Models, `/android` for ML Kit GenAI and Gemini Nano (including Nano 4 function calling, per its README), plus `/llama` and `/json-ui`.
  - Expo's own **`expo-ai`**, which is alpha: Apple Intelligence, Gemini Nano through AICore, or Chrome's `LanguageModel`. It supports tool calling with a `beforeTool` approval hook and `maximumToolCalls` (default 4). The docs say explicitly: "not in Expo Go".
  - `react-native-apple-llm`, `react-native-foundation-models` (Nitro), `react-native-executorch` (tool calling since v0.4.0, May 2025) and `llama.rn`.

---

## 2. In-app agent patterns for RN

*Established:*

| Option | What it gives | Expo Go | Fit with Kit's contract |
|---|---|---|---|
| **Vercel AI SDK** (Expo quickstarts for v5 and v7, ai-sdk.dev) | Expo Router API route running `streamText`; client `useChat` with `DefaultChatTransport({ fetch: expoFetch })`; Zod or JSON-schema tools; generative UI by rendering tool parts | yes (pure JS; needs a server or EAS Hosting) | `operate_page` becomes a client-side tool whose `execute` calls `surface.run` |
| **CopilotKit `@copilotkit/react-native`** (announced 2026-08-19, "the AG-UI client for React Native") | `useFrontendTool` (handler runs on the device), `useAgentContext`, `useHumanInTheLoop`, `useRenderTool`; `/headless` entry has no native dependencies | **[unconfirmed]**: needs Hermes polyfills, a `jose` Metro resolver, and a self-hosted runtime | one `useFrontendTool` per surface: description = `describe`, handler = `run` |
| **`expo-ai`** (alpha) | On-device model with tool calling and a `beforeTool` approval hook | **no** | Same tool shape. Kit's `needs-confirmation` should still be the gate, not `beforeTool` alone |
| **`@react-native-ai/*`** (Callstack) | AI SDK providers for Apple FM, Gemini Nano and llama | no | Same as AI SDK |
| **assistant-ui `@assistant-ui/react-native`** | Chat primitives (about 0.1.x) **[unconfirmed version]** | likely | Chat UI only, no tool semantics of its own |

**Expo's own agent tooling** (*established*, docs.expo.dev/eas/ai/mcp, modified 2026-11-02):
- **Remote MCP** at `mcp.expo.dev`: docs, EAS builds and workflows, cloud simulators.
- **Local tools** need SDK 54 or later, the `expo-mcp` package, and `EXPO_UNSTABLE_MCP_SERVER=1`. They are:
  - `automation_tap`, by coordinates **or testID**;
  - `automation_find_view`, by **testID**;
  - `automation_take_screenshot`;
  - `collect_app_logs`;
  - `expo_router_sitemap`.
- **Expo skills** (github.com/expo/skills) package Expo knowledge for coding agents.
- These serve the *coding* agent. None is a runtime surface inside the shipped app.

**Runtime "the app registers tools" libraries on RN:** only CopilotKit's `useFrontendTool` and the AI SDK client-tool pattern are confirmed. We found no production library that embeds an MCP server in a shipped RN app.

---

## 3. Agents operating apps from outside

*Established:*

| Tool | Reads | Targets by |
|---|---|---|
| **Expo MCP local automation** | view lookup and screenshots | **testID**, coordinates |
| **appium-mcp** (github.com/appium/appium-mcp) | XML page source | **accessibility id**, then id, then iOS predicate or UiAutomator, then XPath as a last resort; opt-in vision |
| **mobile-mcp** (mobile-next, about 10k stars) | native accessibility tree first (`mobile_list_elements_on_screen`), screenshots as fallback | element coordinates and properties |
| **Maestro MCP** (`maestro mcp`, bundled with the CLI) | `inspect_view_hierarchy`, screenshots | visible text and id **[id selectors unconfirmed on that page]** |
| **Wix Pilot** (successor to Detox Copilot) | Detox view hierarchy plus an LLM | natural-language steps; repo quiet since about Feb 2025 |
| **DroidRun** | on-device AccessibilityService tree; screenshots optional | tree elements; vendor-reported 91.4% on AndroidWorld **[secondary]** |

**How React Native's props reach the native accessibility tree.** *Established* (reactnative.dev/docs/accessibility, /view; RN commit 381fb39):

- **`testID`:**
  - iOS: becomes `accessibilityIdentifier`.
  - Android: since about RN 0.64, also `setViewIdResourceName`, so UIAutomator and Appium see it as **resource-id** with no extra configuration. Later fixes covered TextInput, ScrollView and Modal.
  - testID only works if it reaches a real native view. Custom components must forward it.
- **`aria-label` / `accessibilityLabel`:** become the iOS label and Android contentDescription.
- **`role`:** takes precedence over `accessibilityRole`.
- **State and value:** `aria-checked`, `aria-selected`, `aria-expanded`, `aria-disabled` and `aria-valuemin`/`max`/`now`/`text` carry state.
- **Actions:** `accessibilityActions` with `onAccessibilityAction` declare named actions that a tree-reading tool can invoke.

**Does accessibility semantics improve agent reliability?** *Established*, with a caveat:
- **DailyDroid** (arXiv 2604.17817, 2026-04-20): text-only UI input performed about as well as text plus screenshot, at a fraction of the cost. Missing labels, icon-only controls and dynamic content were named as failure sources.
- **AndroidWorld** (arXiv 2405.14573): accessibility-tree agents were competitive with Set-of-Mark agents that also used screenshots.
- **Caveat:** we found no paper that cleanly isolates "add labels, success rate goes up". *Proposed reading:* the accessibility tree is the cheap primary channel, and an unlabelled control is the commonest way to lose it.

**Kit Native today**, measured from this repo on 2026-11-03:
- **Labels and roles:** native fields set `aria-label` and `role`. For example, `input/native/Input.tsx` sets `aria-label`, `aria-labelledby`, `aria-disabled` and `accessibilityHint`, and uses `role="alert"` on errors.
- **`testID`:**
  - The string `testID` appears in no `*/native` source file.
  - Checkbox, Switch and Input spread their remaining props onto the native view, so a caller's `testID` reaches it.
  - Select, DatePicker and NumberInput have no rest spread in the files checked, so a caller cannot set one. That breaks every testID-keyed tool above.
  - Not audited exhaustively.

---

## 4. Standards and protocols

*Established:*

- **MCP.**
  - **Spec version:** latest is **2026-07-28**. It is stateless (no `initialize`, no session id) and adds `server/discover`. Multi Round-Trip Requests (SEP-2322) replace server-initiated elicitation and sampling. Tasks became an extension. Roots, Sampling and Logging are deprecated.
  - **Governance:** donated to the Linux Foundation's Agentic AI Foundation on 2025-12-09.
  - **Tool annotations:** `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint`. **[confirm in 2026-07-28 `schema.ts`]**
- **MCP Apps** (SEP-1865, `ext-apps`, stable `2026-01-26`):
  - A `ui://` HTML resource is rendered in a sandboxed iframe, over a `ui/*` postMessage bridge.
  - ChatGPT implements the same model.
  - **On mobile it means a WebView, not native components.**
- **A2UI** (Google):
  - **Versions:** v0.9.1 is the production version, v1.0 is a candidate, and the project calls itself an "early-stage public preview".
  - **Official renderers:** Lit, Angular, React and, newly, Compose (alpha, 2026-10-28). Flutter and SwiftUI are "not published yet".
  - **React Native:** only a community renderer, `a2ui-react-native`, which supports v0.8 only. **[unconfirmed]** Whether upstream PR #430, which proposes `@a2ui/react-native`, has merged.
- **AG-UI** (CopilotKit):
  - **Events:** lifecycle, text, tool-call, state snapshot/delta, activity and reasoning.
  - **SDKs:** community SDKs for Kotlin (Multiplatform, so iOS too), Dart and others. No Swift SDK found.
  - **React Native:** a first-party client, `@copilotkit/react-native`.
- **WebMCP:**
  - **Spec:** W3C Web ML CG Draft Report, dated 2026-11-02, not on the standards track. The API is `document.modelContext` (`registerTool`, `getTools`, `executeTool`, plus `toolchange` and `toolactivated` events). `ToolAnnotations` are `readOnlyHint`, `untrustedContentHint`, `consequentialHint` and `debugging`.
  - **Chrome:** origin trial from **M149 to M156**, shipping targeted at M157, covering desktop, Android and **WebView** (blink-dev Intent to Experiment, LGTM 2026-05-18).
  - **Edge:** origin trial expires 2027-03-30.
  - **`requestUserInteraction`:** **no longer in the spec**; it appears only under Open Questions.

**Mobile and React Native mappings:**

| Protocol | RN status | Relevance to Kit |
|---|---|---|
| AG-UI | first-party RN client (CopilotKit) | **High.** Frontend tools are exactly `describe`/`operate` |
| MCP (in-app server) | none found in production | Medium. Dev bridge (N3) only |
| MCP Apps | WebView only | Low for native components |
| A2UI | community renderer, v0.8 | Low now; track. Kit is "operate existing UI", not generated UI |
| WebMCP | only for web content inside a WebView | Not applicable to native views. Kit *web* in a WebView already works through the web `AgentSurface` |
| AppFunctions | no RN library | N4 |
| App Intents | `expo-app-intents` (alpha, Swift-authored) | N4 |

---

## 5. Prior art: "agent-native" on mobile

*Established* (searches up to 2026-11-03):

- **Mobile component libraries:** none of Tamagui, gluestack-ui, React Native Reusables, NativeWind UI, Restyle or Expo UI claims runtime agent support.
  - gluestack's MCP server serves component *source* to coding agents. That is code generation.
- **Web, code-generation only:**
  - shadcn MCP serves registry items to coding agents.
  - Vercel AI Elements is chat and agent UI that is copied into the codebase. It is web only.
- **Chat and generative UI:**
  - **assistant-ui** has a React Native package, and **CopilotKit** has a React Native client. Both are chat and tool runtimes, not component contracts.
  - **Tambo** and **Hashbrown** turn component prop schemas into model tools. Both are web only.
  - **Thesys C1** is web only.
- **Builder.io "Agent-Native"** uses `defineAction()` to serve the agent, the UI and APIs from one action. It is a web framework, not React Native.
- **Google Generative UI** (Nov 2025) has the model write whole interfaces.

*Proposed reading:*
- Nobody ships, on mobile or on the web, a per-instance runtime contract with a validator, coercion, confirmation and undo for each component.
- The nearest neighbours, Tambo and Hashbrown, give the model a prop schema and trust what comes back.
- Kit's "producer proposes, validator authorizes, executor mutates" is the differentiator, and it ports to native unchanged.

---

## 6. Security and consent

*Established:*

- **MCP:**
  - There "SHOULD always be a human in the loop with the ability to deny tool invocations".
  - Hosts must obtain consent.
  - Clients **must treat tool annotations as untrusted** unless the server is trusted.
- **WebMCP** (spec § 6) names these threats:
  - tool poisoning;
  - injection through tool output;
  - misrepresented intent;
  - over-parameterisation.

  It says `consequentialHint` can be omitted by a malicious site, and that agents should not rely on site-declared annotations alone.
- **Apple:**
  - `IntentAuthenticationPolicy` defaults to `alwaysAllowed`, which runs even when the device is locked.
  - `requestConfirmation(...)` throws if the user cancels.
  - **WWDC26 session 347, "Secure your app: mitigate risks to agentic features":**
    - Schema intents inherit side-effect metadata; for example `deleteAssets` is destructive.
    - The system confirms high-risk actions.
    - Authentication policy can only be tightened.
    - Destructive actions should use `.requiresAuthentication`.
    - Threats are "data poisoning" and "action poisoning" by indirect injection.
    - Deterministic controls are preferred over probabilistic ones.
- **Android:** `EXECUTE_APP_FUNCTIONS` gates callers. **[unconfirmed]** Whether it is granted only to privileged apps on Android 16.
- **Prompt injection through on-screen content:**
  - **MIRAGE** (arXiv 2605.28116, May 2026): text injected into user-generated content such as comments and bios beat all 5 mobile agents tested, with 23–30% attack success.
  - arXiv 2505.12981 (May 2025) and 2510.07809 (Oct 2025) show injected UI text redirecting mobile agents.
  - **OWASP LLM Top 10 2025** lists LLM01 Prompt Injection and LLM06 Excessive Agency.
  - **OWASP Agentic Top 10** (2025-12-09) lists ASI01 Agent Goal Hijack. **[secondary]**

*Proposed, for Kit:*

1. **Confirmation stays inside the app.**
   - `needs-confirmation` from the validator is the gate.
   - On native it renders as a Kit `Dialog` or `Sheet` that the *person* taps.
   - No agent-supplied `confirm: true` on a first call ever counts, the same rule as on the web.
2. **Annotations are output, never input.** The surface may *advertise* `readOnlyHint`, `destructiveHint` and `consequentialHint`, mapped from passport operations, to help well-behaved agents. It never *reads* them back to decide anything.
3. **Field values are untrusted content.**
   - `describe` returns user-entered values, which are the MIRAGE channel.
   - Mark them `untrustedContentHint` or wrap them, and keep labels, which are developer-authored, separate from values, which are user-authored.
   - This matches the passport rule: "text is data, never instructions".
4. **Locked device and background:** any OS-level entry point (N4) uses `.requiresAuthentication` for writes and never runs `operate` in the background on iOS.

---

## 7. Recommendations: a phased design for agent-native Kit Native

The rules carried over from `docs/react-native.md` § 5 are:
- the copy-in core has zero dependencies;
- the core is Expo Go compatible;
- one `core/` serves both editions;
- anything native is an optional, separate module.

All of this section is *proposed*.

### 7.1 Channels mapped to Kit pieces

| Channel | Who drives | Kit piece | Native code? |
|---|---|---|---|
| In-app assistant (chat, voice) | the app's own model, local or remote | native `<AgentSurface>`, `useAgentSurface()`, `GramproAIProvider` adapter, recipe tools for AI SDK, CopilotKit and `expo-ai` | no |
| User-to-component NL ("Ask this Grid", mode C) | the person, through the app's adapter | `useAskAgent`, unchanged | no |
| Dev and test automation | Claude Code or Cursor, through MCP | **debug bridge**: `AgentSurface` to WebSocket to a local MCP server; plus testID and a11y for Expo MCP, Appium, Maestro and mobile-mcp | no on the device; a Node CLI on the dev machine |
| OS assistants (Gemini, Siri AI) | the OS | optional **`@grampro/kit-agent-native`** Expo module: AppFunctions `SCOPE_ACTIVITY` handler on Android, `expo-app-intents` recipes on iOS | **yes**, dev build only |
| Fallback: screen-reading agents | any external agent | correct `role`, `aria-*`, forwarded `testID`, `accessibilityActions` | no |

### 7.2 Phases

#### N0 · Accessibility and testID hygiene (effort S, risk low)

- **testID:** every native component forwards `testID` to its main native view.
  - For composites, derive part IDs: `${testID}-trigger`, `-option-${value}`, `-day-${iso}`.
  - Fix Select, DatePicker and NumberInput first; they have no rest spread today.
- **States:** emit `aria-checked`, `aria-selected`, `aria-expanded` and `aria-value*` wherever the web edition has the matching `data-state`.
- **Actions:** declare `accessibilityActions` on composites so tree-reading agents and screen readers share named actions. For example, DatePicker gets `activate` and `increment`/`decrement` by day.
- **Passport:** add `platforms.native.testIds`, a pattern of IDs, so a coding agent writing Maestro or Appium flows can look them up instead of guessing.
- **Exit:** a Maestro flow and an Expo MCP `automation_find_view` locate every field by testID in `native-playground`.
- **Value:** without any AI, this makes Kit forms testable and screen-reader-correct.

#### N1 · Native `AgentSurface` plus state-based executors (effort M, risk low–medium)

- **Shared core:** `createAgentSurface`, `runProjected`, the field contracts, the validator, coercion and history are pure TypeScript and are reused **unchanged**.
- **`shared/native/AgentSurface.tsx`:** the same context and registrar as the web file. It drops the WebMCP registration (`webmcp` defaults to off and is a no-op off-web) and keeps `useAgentSurface()`.
- **`shared/native/useFieldAgent.ts`:**
  - Uses `handleFieldExecutors` only. There is no DOM, so no `domFieldExecutors` and no `write.ts`.
  - Native DatePicker, DateRangePicker, DateTimePicker and Combobox handles **already expose `setValue`**, which commits through their `commit` path; see `docs/controlled-component-adapter.md`.
- **Prerequisite:** text-like fields need a handle.
  - Today `input/native/Input.tsx` hands back the raw `TextInput` instance, which has no `setValue`.
  - Add a Kit handle (`setValue`, `clear`, `focus`) to Input, Textarea, NumberInput, Checkbox, Switch and RadioGroup on native.
  - It goes through the same internal-state-or-`onChange` commit, so controlled hosts hear the change just as they hear a tap.
  - This is the controlled-component adapter, Option A or C, applied on native.
- **Confirmation UI:** a small `AgentConfirm` built from the native `Dialog`. The person confirms; the agent cannot.
- **Undo:** `createSnapshotHistory`, unchanged. Offer "Undo agent change" on a Toaster action.
- **Exit:** react-native.md phase 4's criterion ("`AgentSurface` `describe`/`operate` working in the playground"), plus parity tests. The same intents give the same outcome codes on web and native, by running the web field corpus against native executors in Jest and RNTL.

#### N2 · In-app assistant recipes (effort S–M, risk low)

- These are documentation and example code in `native-playground`, **not dependencies**.
- Each recipe turns the surface into one tool:
  - `name: "operate_screen"`;
  - description from `manifest()`;
  - input schema = `SURFACE_TOOL_SCHEMA`;
  - `execute: ({ target, intents }) => surface.run(target, intents)`.
- **Recipes:**
  1. **Vercel AI SDK** client-side tool (Expo Go).
  2. **CopilotKit** `useFrontendTool` (AG-UI).
  3. **`expo-ai`** on-device (dev build). Kit's `needs-confirmation`, not only `beforeTool`, decides.
  4. Plain `GramproAIProvider` adapter, for `useAskAgent`.
- **Advertise annotations** per member: passport operation to `readOnlyHint` / `destructiveHint` / `consequentialHint`. Mark user values `untrustedContentHint` (section 6).
- **Exit:** the grid and field eval corpora score identically through each recipe's tool. The tool is a pipe, so this should hold by construction, and the test proves it.

#### N3 · Debug bridge for coding agents (effort M, risk medium)

**What it adds:** coding agents can already *tap*, through Expo MCP. With this they can call `describe` and get the live manifest, then `operate` through the validator. A refusal comes back with a code and a layer, not a screenshot to guess from.

**Device side:**
- `shared/native/agentBridge.ts`, pure JS. It uses React Native's built-in `WebSocket`, so it adds no dependency and works in Expo Go.
- Connects only when `__DEV__` is true **and** the developer passes an explicit URL plus a pairing token.
- It is a no-op in release builds.

**Dev-machine side:** a `kit` CLI subcommand starts a stdio MCP server that relays two tools to the connected device:
- `kit_describe_screen`
- `kit_operate_screen`

**Fits alongside Expo MCP:**
- Expo's `automation_*` tools do the taps and screenshots.
- Kit's tools do semantic, validated operation.
- Shared testIDs from N0 let an agent move between the two.

**Risks and mitigations:**
- **Transport surface:** a dev-time WebSocket is an attack surface. Mitigate with localhost or `adb reverse` only, a per-session token, and dev builds only.
- **Spec churn:** the MCP 2026-07-28 statelessness change means the server should target the current spec.

**Exit:** Claude Code fills and submits the playground form through `kit_operate_screen`, and a policy refusal is reported with its layer.

#### N4 · Optional OS-assistant module (effort L, risk high; gated)

A separately versioned Expo module and config plugin, e.g. `@grampro/kit-agent-native`. It is **never** copied in by `kit add`, and it needs a dev build.

- **Android:**
  - Declare one `@AppFunctionSignature` in Kotlin: `operateScreen(target: String, intentsJson: String): String`. Add a read-only `describeScreen()`.
  - Register handlers with `SCOPE_ACTIVITY` between `onResume` and `onPause`. They forward into JS `surface.run`, and the validator answers.
  - Requires API 37 and an experimental API. A generic JSON-string argument also weakens the schema Gemini sees.
  - Fallback: generate per-screen signatures from the surface manifest at build time. This is heavy, and the screens must be known statically.
- **iOS:**
  - No generic route exists (section 1.3).
  - Ship **recipes**, not a generic intent: how an app author writes a schema-conforming App Intent in Swift under `expo-app-intents` whose `perform()` dispatches into JS and then `surface.run`.
  - Plus `appEntityIdentifier` annotations on rows for onscreen awareness.
  - Confirmation through `requestConfirmation`, and `.requiresAuthentication` for writes.
- **Gate:** start only when at least one of these is true:
  - Gemini's AppFunctions integration is out of private preview for third-party apps;
  - the Siri AI user beta has shipped with App Schemas that cover a form-like domain a Kit user needs.

  Until then, track it in this document.
- **Risks:**
  - The APIs are in beta, experimental or alpha on both platforms.
  - The ask is for a native toolchain a Mac-less team cannot test on iOS without CI (`react-native.md` § 3.10).
  - Siri's domains may never fit generic forms.

### 7.3 What not to do

- **Do not** add CopilotKit, the AI SDK or `expo-ai` as dependencies of the copy-in core. They are recipes.
- **Do not** build an A2UI or MCP Apps renderer for native now. Kit's lead is mode B, operating existing UI (`agent-native-architecture.md` § 9).
- **Do not** route OS-agent calls around the validator "because the OS already confirmed". Apple's own guidance prefers deterministic controls, and Kit's validator is one.

### 7.4 Summary

| Phase | Effort | Risk | Expo Go | Depends on |
|---|---|---|---|---|
| N0 a11y and testID | S | low | yes | — |
| N1 native AgentSurface and executors | M | low–medium | yes | native field handles (controlled-component adapter) |
| N2 assistant recipes | S–M | low | yes (except `expo-ai`) | N1 |
| N3 debug bridge | M | medium | yes | N1, CLI |
| N4 OS module | L | high | **no** | N1; platform GA |

---

## Sources

Dates are the publication or last-modified date where the page gives one.

**Apple**
- WWDC25 session 275, App Intents (June 2025): https://developer.apple.com/videos/play/wwdc2025/275/
- Apple Newsroom, Siri AI (2026-06-08): https://www.apple.com/newsroom/2026/06/apple-introduces-siri-ai-a-profoundly-more-capable-and-personal-assistant/
- Apple Newsroom, intelligence frameworks and tools, including Xcode MCP (2026-06-08): https://www.apple.com/newsroom/2026/06/apple-aids-app-development-with-new-intelligence-frameworks-and-advanced-tools/
- WWDC26 Apple Intelligence guide: https://developer.apple.com/wwdc26/guides/apple-intelligence/
- WWDC26 session 240: https://developer.apple.com/videos/play/wwdc2026/240/
- WWDC26 session 241 (Foundation Models): https://developer.apple.com/videos/play/wwdc2026/241/
- WWDC26 session 347 (agentic security): https://developer.apple.com/videos/play/wwdc2026/347/
- IntentAuthenticationPolicy: https://developer.apple.com/documentation/appintents/intentauthenticationpolicy
- requestConfirmation: https://developer.apple.com/documentation/appintents/appintent/requestconfirmation(conditions:actionname:dialog:)
- Apple–Google statement coverage (2026-01-12): https://daringfireball.net/linked/2026/01/12/apple-google-foundation-models-cnbc · https://www.theregister.com/2026/01/12/apple_taps_google_gemini_siri/
- iOS 26.4 without new Siri (2026-02-17): https://www.macrumors.com/2026/02/17/ios-26-4-no-new-siri-features/
- iOS 26.4 release (2026-03-24): https://m.washingtontimes.com/news/2026/mar/24/apple-releases-ios-264-heres-need-know/
- MCP groundwork in iOS/macOS 26.1 beta (2025-09-22): https://9to5mac.com/2025/09/22/macos-tahoe-26-1-beta-1-mcp-integration/

**Android**
- AppFunctions releases: https://developer.android.com/jetpack/androidx/releases/appfunctions
- AppFunctions overview: https://developer.android.com/ai/appfunctions
- AppFunctionManager: https://developer.android.com/reference/kotlin/androidx/appfunctions/AppFunctionManager
- AppFunctionSignature: https://developer.android.com/reference/kotlin/androidx/appfunctions/AppFunctionSignature
- "The Intelligent OS" (2026-02-25): https://android-developers.googleblog.com/2026/02/the-intelligent-os-making-ai-agents.html
- Android 17 (2026-06-16): https://android-developers.googleblog.com/2026/06/Android-17.html
- AI on Android at I/O 26 (2026-05-26): https://developer.android.com/blog/posts/top-ai-on-android-updates-for-building-intelligent-experiences-from-google-i-o-26
- Android Dev Summit (2026-10-28): https://developer.android.com/blog/posts/build-it-your-way-a-next-era-of-android-development
- Play Accessibility API policy: https://support.google.com/googleplay/android-developer/answer/16585319
- Gemini Computer Use (2025-10-07): https://blog.google/technology/google-deepmind/gemini-computer-use-model/

**Expo and React Native**
- Expo App Intents (2026-10-19): https://expo.dev/blog/introducing-expo-app-intents
- Expo App Intents API reference: https://docs.expo.dev/versions/latest/sdk/app-intents/
- expo-ai: https://docs.expo.dev/versions/unversioned/sdk/ai.md
- Expo MCP (modified 2026-11-02): https://docs.expo.dev/eas/ai/mcp/
- Expo skills: https://github.com/expo/skills
- SDK 55: https://expo.dev/changelog/sdk-55
- expo-apple-targets: https://github.com/EvanBacon/expo-apple-targets
- Callstack react-native-ai: https://github.com/callstackincubator/ai
- react-native-apple-llm: https://github.com/deveix/react-native-apple-llm
- react-native-executorch v0.4.0 (May 2025): https://swmansion.com/blog/react-native-executorch-release-v0-4-0-262d4013ac10
- AI SDK Expo quickstart: https://ai-sdk.dev/docs/getting-started/expo
- CopilotKit React Native: https://docs.copilotkit.ai/frontends/react-native · announcement (2026-08-19): https://www.copilotkit.ai/blog/react-native-your-agent-inside-your-mobile-app
- RN accessibility: https://reactnative.dev/docs/accessibility
- RN View: https://reactnative.dev/docs/view
- testID to resource-id commit: https://github.com/facebook/react-native/commit/381fb395ad9d2d48717a5d082aaedbecdd804554

**Automation and agents**
- appium-mcp: https://github.com/appium/appium-mcp
- mobile-mcp: https://github.com/mobile-next/mobile-mcp
- Maestro MCP: https://maestro.dev/mcp
- Wix Pilot: https://wix.github.io/Detox/docs/pilot/testing-with-pilot
- DroidRun: https://github.com/droidrun/droidrun
- AndroidWorld: https://arxiv.org/abs/2405.14573
- DailyDroid (2026-04-20): https://arxiv.org/abs/2604.17817

**Protocols**
- MCP 2026-07-28: https://modelcontextprotocol.io/specification/2026-07-28/changelog · https://blog.modelcontextprotocol.io/posts/2026-07-28/
- MCP tools and human-in-the-loop: https://modelcontextprotocol.io/specification/draft/server/tools
- AAIF (2025-12-09): https://anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation
- MCP Apps: https://github.com/modelcontextprotocol/ext-apps · ChatGPT: https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt
- A2UI: https://github.com/google/A2UI · v0.9 (2026-04-17): https://developers.googleblog.com/en/a2ui-v0-9-generative-ui/ · renderers: https://a2ui.org/ecosystem/renderers/
- AG-UI: https://docs.ag-ui.com/concepts/events · https://github.com/ag-ui-protocol/ag-ui
- WebMCP spec (2026-11-02): https://webmachinelearning.github.io/webmcp/ · explainer: https://github.com/webmachinelearning/webmcp
- Chrome Intent to Experiment (2026-05-16/18): https://groups.google.com/a/chromium.org/g/blink-dev/c/gmYffo5WOE8/m/OJxuQRP3AAAJ
- Edge origin trial: https://developer.microsoft.com/en-us/microsoft-edge/origin-trials/trials/0b76fe60-b266-458e-a285-04e375c0c31a

**Prior art**
- Builder.io agent-native: https://github.com/BuilderIO/agent-native
- shadcn MCP: https://ui.shadcn.com/docs/mcp
- AI Elements: https://vercel.com/blog/introducing-ai-elements
- Tambo: https://github.com/tambo-ai/tambo
- Hashbrown (2025-06-25): https://hashbrown.dev/blog/2025-06-25-Hashbrown-launch
- Thesys C1: https://docs.thesys.dev/guides/what-is-thesys-c1
- Google Generative UI: https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/

**Security**
- MIRAGE (May 2026): https://arxiv.org/abs/2605.28116
- From Assistants to Adversaries (May 2025): https://arxiv.org/abs/2505.12981
- OWASP GenAI: https://genai.owasp.org
- OWASP Agentic Top 10 [secondary]: https://cycode.com/blog/owasp-top-10-agentic-applications/

**This repository**, measured 2026-11-03:
- `source/components/*/native`: testID forwarding and native handle shapes.
- `source/components/shared/core/agent/*`: surface, executors and WebMCP projection.
