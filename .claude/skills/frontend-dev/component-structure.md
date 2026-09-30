# Component Structure for Large Frontend Features

Break large frontend components into logically grouped component pieces. Organize feature-specific pieces in subdirectories beside their parent component. The goal is to make responsibilities easy to find and change without creating a folder for every small markup fragment.

## When to split a component

Treat a component as large when it combines distinct responsibilities or user-facing areas, such as:

- A multi-step wizard where each step has its own fields, preview, or interaction behavior.
- A drawer or dialog that includes file selection, a media editor, and a review/confirmation screen.
- A page that mixes independently meaningful sections with their own state and event handling.

Use responsibility and interaction boundaries to decide what to extract; line count alone is not a useful threshold. Keep a short, cohesive component together. Do not extract every label, row, or one-off wrapper into its own component.

## Feature-local directory pattern

Keep the parent component and its specialized child components together:

```text
UploadVideoDrawer/
├── UploadVideoDrawer.tsx          # Shared state, flow config, submit/cancel orchestration
├── index.ts
└── components/
    ├── UploadVideoFileStep/
    │   ├── UploadVideoFileStep.tsx
    │   └── index.ts
    ├── SelectThumbnailStep/
    │   ├── SelectThumbnailStep.tsx
    │   └── index.ts
    └── ReviewSubmitStep/
        ├── ReviewSubmitStep.tsx
        └── index.ts
```

Use this structure when a feature has several substantial child components. Give each child a descriptive PascalCase directory and component name. Keep its stylesheet beside the component when it needs component-specific styles:

```text
SelectThumbnailStep/
├── SelectThumbnailStep.tsx
├── SelectThumbnailStep.module.scss
└── index.ts
```

Small feature-local components may remain directly in the parent directory if adding a nested folder would make them harder to navigate. Shared components used across features belong in `frontend/src/app/components/`; do not promote a feature-specific step into the shared component directory without a real second use case.

## Responsibility boundaries

- The parent owns flow orchestration: wizard configuration, state shared across steps, navigation/reset behavior, and final submission.
- Each child owns the UI and local interaction behavior for one coherent area or step.
- Pass data and callbacks through typed props. Keep each component's props interface next to that component unless multiple siblings truly share a type.
- Keep sibling steps independent. The parent should pass shared values between them instead of having one step import or manipulate another step directly.
- Co-locate styles with the component they affect. Use Radix layout primitives first, as described in the main skill.

For a configured wizard, the parent should read like a concise flow definition:

```tsx
const config: FormStep[] = [
  {
    id: 'video-file',
    title: 'Upload a Video File',
    content: <UploadVideoFileStep file={file} onFileSelect={setFile} />,
    canContinue: Boolean(file),
  },
  {
    id: 'thumbnail',
    title: 'Select a Thumbnail',
    content: <SelectThumbnailStep file={file} onThumbnailChange={setThumbnail} />,
    canContinue: Boolean(thumbnail),
  },
  {
    id: 'review',
    title: 'Review & Submit',
    content: <ReviewSubmitStep file={file} thumbnail={thumbnail} />,
    canContinue: Boolean(file && thumbnail),
  },
];
```

Keep frame capture, file-drop behavior, validation display, or other step-specific interactions in the relevant child. Keep cross-step data and the final upload call in the parent.

## Before finishing

- Confirm each extracted component has one clear responsibility and a small, typed prop contract.
- Confirm the parent is primarily wiring children and coordinating shared state, not rendering all step internals inline.
- Confirm feature-specific pieces stay under the feature's `components/` directory and have predictable filenames/barrel exports.
- Keep simple forms and short dialogs simple; use the directory structure when decomposition improves navigation and maintenance.
