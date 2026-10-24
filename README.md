# Echo Mirror

A mirror that responds to the duration, proximity, and repetition of self-observation. Designed for a laptop browser and webcam, with a clean, minimal interface.

## Run locally

Open Terminal in this folder and run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Visit **http://localhost:8000** in your browser. Click **Begin experience**, allow camera access, and face the camera at your normal distance for about two seconds to calibrate. Keep your face well lit. Internet access is needed to load the MediaPipe library, model, and optional fonts. Do not open `index.html` directly: webcam access and JavaScript modules need localhost or HTTPS.

No Node installation or build step is required. Stop the server with Ctrl+C. The camera is stopped when you end the session or leave the page.

## Interaction

- **Normal looking:** clear, horizontally mirrored webcam image.
- **Prolonged looking:** after six seconds of estimated attention, reflection gradually fades over twelve seconds to 8% visibility. Adjust the starting time in the interface.
- **Moving closer:** after calibration, face width relative to the starting width drives fragmentation. The default effect starts above 1.35× the calibrated width; sensitivity is adjustable. This is relative proximity, not measured physical distance.
- **Repeated checking:** look away for at least 1.2 seconds, then face the mirror for at least 0.6 seconds. The return leaves a ghost of the previous visit. The first visit is not counted as a return. Up to four traces linger for 45 seconds of active session time.
- **End & reflect:** view estimated total looking time, longest look, return count, and active session duration. Optionally download these numbers as JSON.

Short detection dropouts pause the looking timer without immediately resetting the look. Switching tabs pauses the session timer and breaks the continuous look.

## Demo

**Explore without a camera** uses an illustrated face and simulated attention/proximity controls. It uses the same timing rules as the webcam. Demo summaries and downloaded data are labeled as simulated.

## What attention means here

The prototype uses face landmarks to approximate frontal head orientation. It does **not** measure eye fixation, identify people, diagnose behaviour, or establish that the person is inspecting their appearance. Eyes can look away while the head faces forward. Report the duration as **estimated looking time** in your course work.

The webcam and face processing run in the browser. Images and ghost traces remain in memory and are cleared at the end of the session. No image recording, upload, or persistent image storage is implemented. Third-party requests download the detection library/model and fonts; these providers receive normal network request metadata. Numerical session data is saved only when the participant selects the download button.

## Project files

- `index.html` — interface and session summary.
- `style.css` — responsive minimal visual design.
- `app.js` — camera, MediaPipe tracking, calibration, canvas effects, and controls.
- `engine.js` — attention timer and interaction state.
- `tests.html` — deterministic checks of the timing and state rules; open http://localhost:8000/tests.html.
- `PROJECT.md` — concept, design rationale, demonstration, and evaluation plan.

## Technical basis

Vanilla HTML, CSS, JavaScript, Canvas 2D, browser `getUserMedia`, and Google MediaPipe Face Landmarker. MediaPipe tasks-vision is pinned to 0.10.21; the model uses the version-1 float16 asset. Detection is throttled to roughly ten samples per second. It runs on the main thread in this first prototype; a worker is a future performance improvement for slower machines.

Implementation reference: [Google’s Face Landmarker web guide](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js).

## Troubleshooting

If camera access is denied, allow it in the browser’s site permissions and retry. If model loading fails, check your connection or use the demo. If fragmentation starts at an ordinary distance, step back and recalibrate. Recalibrate when the camera position or participant changes. If detection is inconsistent, improve lighting, show the whole face, and avoid a strongly tilted camera.

## Validation

All ten deterministic interaction checks and JavaScript syntax checks passed during development. The local server returned HTTP 200, and the pinned library, WebAssembly, and model URLs were checked for availability. Browser visual QA was unavailable in the development session. The deterministic checks cover fade timing, looking-away recovery, deliberate returns, brief dropouts, proximity recovery, capped frame time, and demo labeling. A real webcam demonstration still requires manual validation on the presentation laptop; simulated checks cannot establish tracking accuracy.
